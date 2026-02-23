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
const CACHE_PREFIX = 'gemini_cache_v2_';
const MAX_CACHE_SIZE = 50;
const MEMORY_CACHE = new Map<string, any>();

const generateHash = async (content: string): Promise<string> => {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `${CACHE_PREFIX}${hashHex}`;
  }

  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${CACHE_PREFIX}${hash}`;
};

const generateCacheKey = async (input: AnalysisInput): Promise<string> => {
  const content = input.fileData
    ? `${input.fileData.mimeType}:${input.fileData.data}`
    : (input.text || '');

  return generateHash(content);
};

const generateBriefingCacheKey = async (event: EventData): Promise<string> => {
  const content = `BRIEFING:${event.analysis.eventName}:${event.analysis.institution}:${event.analysis.theme}:${event.analysis.description}:${event.analysis.linkedActivities.join(',')}`;
  return generateHash(content);
};

const getFromCache = <T = AnalysisResult>(key: string): T | null => {
  if (MEMORY_CACHE.has(key)) {
    return MEMORY_CACHE.get(key) as T || null;
  }
  if (typeof sessionStorage !== 'undefined') {
    try {
      const item = sessionStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        MEMORY_CACHE.set(key, parsed);
        return parsed as T;
      }
    } catch (e) {
      console.warn('Error reading from sessionStorage:', e);
    }
  }
  return null;
};

const saveToCache = <T>(key: string, data: T) => {
  if (MEMORY_CACHE.size >= MAX_CACHE_SIZE) {
    const firstKey = MEMORY_CACHE.keys().next().value;
    if (firstKey) MEMORY_CACHE.delete(firstKey);
  }
  MEMORY_CACHE.set(key, data);
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to sessionStorage:', e);
    }
  }
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
  const cachedResult = getFromCache<AnalysisResult>(cacheKey);
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
  const cacheKey = await generateBriefingCacheKey(event);
  const cachedResult = getFromCache<string>(cacheKey);
  if (cachedResult) return cachedResult;

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

  const text = response.text || "";
  saveToCache(cacheKey, text);
  return text;
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
