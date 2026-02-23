import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, Priority, EventData } from "../types";
import { OBESSU_DATA_CONTEXT, SYSTEM_INSTRUCTION, responseSchema } from "./prompts";
import { CacheService } from "./cacheService";

const GEMINI_MODEL_NAME = "gemini-1.5-flash-latest";

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is missing");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

// Caching configuration
const sessionCacheService = new CacheService<AnalysisResult>('gemini_cache_v2_', 50);

export interface AnalysisInput {
  text?: string;
  fileData?: {
    mimeType: string;
    data: string;
  };
}

export const analyzeInvitation = async (input: AnalysisInput): Promise<AnalysisResult> => {
  const content = input.fileData
    ? `${input.fileData.mimeType}:${input.fileData.data}`
    : (input.text || '');

  const cacheKey = await sessionCacheService.generateHash(content);
  const cachedResult = sessionCacheService.get(cacheKey);
  if (cachedResult) return cachedResult;

  const parts = [];
  if (input.fileData) {
    parts.push({ inlineData: input.fileData });
    parts.push({ text: "Analyze this document as an event invitation. If it's an email, extract headers." });
  } else if (input.text) {
    parts.push({ text: `Analyze the following invitation (check for email headers):\n\n${input.text}` });
  }

  const response = await getAiClient().models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  let data;
  try {
    data = JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("Failed to parse analysis result from AI service");
  }
  

  const result: AnalysisResult = {
    ...data,
    priority: data.priority as Priority,
    linkedActivities: data.linkedActivities || [],
  };
    // Cache the result using the secure cache service (session-scoped)
  sessionCacheService.set(cacheKey, result);
  return result;
};

export const generateBriefing = async (event: EventData) => {
  const prompt = `Create a 1-page executive briefing for a representative attending the following event:
  Event: ${event.analysis.eventName}
  Institution: ${event.analysis.institution}
  Theme: ${event.analysis.theme}
  Context: ${event.analysis.description}
  Linked Activities: ${event.analysis.linkedActivities.join(', ')}
  
  CONTEXT:
  ${OBESSU_DATA_CONTEXT}

  Include:
  1. Key Objectives for OBESSU
  2. Potential 'Red Lines' (What to avoid)
  3. Key Stakeholders likely present
  4. Suggested opening statement points.`;

  const response = await getAiClient().models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: [{ parts: [{ text: prompt }] }],
  });

  return response.text;
};

export const summarizeFollowUp = async (file: { mimeType: string, data: string }) => {
  const response = await getAiClient().models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: {
      parts: [
        { inlineData: file },
        { text: "Summarize this document focusing on key outcomes, decisions, and follow-up actions. Keep it professional." }
      ]
    },
  });
  return response.text;
};
