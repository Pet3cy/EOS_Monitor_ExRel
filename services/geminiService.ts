import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, Priority } from "../types";
import { OBESSU_DATA_CONTEXT, SYSTEM_INSTRUCTION } from "./prompts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sender: { type: Type.STRING },
    senderEmail: { type: Type.STRING },
    subject: { type: Type.STRING },
    institution: { type: Type.STRING },
    eventName: { type: Type.STRING },
    theme: { type: Type.STRING },
    description: { type: Type.STRING },
    priority: { type: Type.STRING, enum: ["High", "Medium", "Low", "Irrelevant"] },
    priorityScore: { type: Type.INTEGER },
    priorityReasoning: { type: Type.STRING },
    date: { type: Type.STRING },
    venue: { type: Type.STRING },
    initialDeadline: { type: Type.STRING },
    finalDeadline: { type: Type.STRING },
    linkedActivities: { type: Type.ARRAY, items: { type: Type.STRING } },
    registrationLink: { type: Type.STRING },
    programmeLink: { type: Type.STRING }
  },
  required: ["sender", "institution", "eventName", "priority", "priorityScore", "date", "venue", "description"],
};

export interface AnalysisInput {
  text?: string;
  fileData?: {
    mimeType: string;
    data: string;
  };
}

export const analyzeInvitation = async (input: AnalysisInput): Promise<AnalysisResult> => {
  const parts = [];
  if (input.fileData) {
    parts.push({ inlineData: input.fileData });
    parts.push({ text: "Analyze this document as an event invitation. If it's an email, extract headers." });
  } else if (input.text) {
    parts.push({ text: `Analyze the following invitation (check for email headers):\n\n${input.text}` });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  const data = JSON.parse(response.text || "{}");
  
  return {
    ...data,
    priority: data.priority as Priority,
    linkedActivities: data.linkedActivities || [],
  };
};

export const generateBriefing = async (event: any) => {
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

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
  });

  return response.text;
};

export const summarizeFollowUp = async (file: { mimeType: string, data: string }) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: file },
        { text: "Summarize this document focusing on key outcomes, decisions, and follow-up actions. Keep it professional." }
      ]
    },
  });
  return response.text;
};
