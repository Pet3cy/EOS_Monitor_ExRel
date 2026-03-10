import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, Priority, EventData } from "../types";
import { OBESSU_DATA_CONTEXT, SYSTEM_INSTRUCTION, responseSchema } from "./prompts";

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
const MAX_CACHE_SIZE = 50;
const MEMORY_CACHE = new Map<string, AnalysisResult>();

// Purge any legacy sessionStorage entries from before in-memory-only caching
// TODO: Remove this cleanup block after a few releases once users have migrated
if (typeof sessionStorage !== 'undefined') {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('gemini_cache_v2_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => {
      sessionStorage.removeItem(k);
    });
  } catch {
    // Ignore errors during cleanup
  }
}

const generateCacheKey = async (input: AnalysisInput): Promise<string> => {
  const content = input.fileData
    ? `${input.fileData.mimeType}:${input.fileData.data}`
    : (input.text || '');

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return String(hash);
};

const getFromCache = (key: string): AnalysisResult | null => {
  const cached = MEMORY_CACHE.get(key);
  if (cached) {
    // Return a shallow copy to prevent callers from mutating the cached entry
    return { ...cached, linkedActivities: [...cached.linkedActivities] };
  }
  return null;
};

const saveToCache = (key: string, data: AnalysisResult) => {
  if (MEMORY_CACHE.size >= MAX_CACHE_SIZE) {
    const firstKey = MEMORY_CACHE.keys().next().value;
    if (firstKey) MEMORY_CACHE.delete(firstKey);
  }
  MEMORY_CACHE.set(key, data);
};


/** @internal Exported for testing — clears the in-memory analysis cache. */
export const clearCache = () => {
  MEMORY_CACHE.clear();
};

export interface AnalysisInput {
  text?: string;
  fileData?: {
    mimeType: string;
    data: string;
  };
}

export const analyzeInvitation = async (input: AnalysisInput): Promise<AnalysisResult> => {
  const cacheKey = await generateCacheKey(input);
  const cachedResult = getFromCache(cacheKey);
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

  const data = JSON.parse(response.text || "{}");
  

  const result: AnalysisResult = {
    ...data,
    priority: data.priority as Priority,
    linkedActivities: data.linkedActivities || [],
  };
  saveToCache(cacheKey, result);
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
