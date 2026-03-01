/// <reference types="vite/client" />
// src/services/gemmaService.ts
import { AnalysisResult, Priority } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY });

const OBESSU_CONTEXT = `ORGANIZATIONAL STRUCTURE & PORTFOLIOS (2026):
BOARD MEMBERS:
- Alessandro Di Miceli: Vocational Education & Training (VET), Apprenticeships, Quality Internships.
- Elodie Böhling: Democracy, Student Rights, Civic Space, Participation.
- Ívar Máni Hrannarsson: Social Affairs, Mental Health, Inclusion, Student Well-being.
- Kacper Bogalecki: Organisational Development, Capacity Building, Internal Governance.
- Lauren Bond: Education Policy, EU Advocacy, Research.

SECRETARIAT:
- Rui Teixeira (Secretary General): External Representation, High-level Management.
- Raquel Moreno Beneit (Comms): Digital Presence, Campaigns.
- Panagiotis Chatzimichail (Head of External Affairs): Partnerships, LLLP, Erasmus+.
- Amira Bakr (Policy Assistant): Policy Monitoring, Outreach.
- Francesca Osima (Head of Projects): Operations, Grant Management.
- Daniele Sabato (Coordinator): VET Strategy, Policy Implementation.

STRATEGIC THEMES 2026:
1. VET & Apprenticeships (Quality, Rights, Pay).
2. Inclusive Schools & Mental Health.
3. Digital Rights in Education (AI, Data Privacy).
4. Democratic School Governance.
5. Climate Justice in Education.`;

// System prompt that includes OBESSU context and instructs JSON output
const SYSTEM_PROMPT = `You are a senior IT & Operations Specialist for OBESSU (Organising Bureau of European School Student Unions). Your task is to analyze event invitations and return a JSON object.

Use the following organizational context to determine relevance and assign priorities:

${OBESSU_CONTEXT}`;

function extractJSON(rawText: string): any {
  try { return JSON.parse(rawText.trim()); } catch {}
  
  const stripped = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try { return JSON.parse(stripped); } catch {}
  
  const match = rawText.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  
  throw new Error('Could not extract valid JSON from model response. Raw: ' + rawText.substring(0, 200));
}

export interface AnalysisInput {
  text?: string;
  fileData?: {
    mimeType: string;
    data: string;
  };
}

export const analyzeInvitation = async (input: AnalysisInput): Promise<AnalysisResult> => {
  let contents: any;

  if (input.fileData) {
    contents = {
      parts: [
        {
          inlineData: {
            mimeType: input.fileData.mimeType,
            data: input.fileData.data,
          },
        },
        {
          text: "Analyze this document as an event invitation. If it's an email, extract headers.",
        },
      ],
    };
  } else if (input.text) {
    contents = `Analyze the following invitation (check for email headers):\n\n${input.text}`;
  } else {
    throw new Error('No input provided');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sender: { type: Type.STRING, description: "name of the sender" },
            senderEmail: { type: Type.STRING, description: "email, if available" },
            subject: { type: Type.STRING, description: "email subject, if available" },
            institution: { type: Type.STRING, description: "organizing body" },
            eventName: { type: Type.STRING },
            theme: { type: Type.STRING, description: "map to OBESSU's strategic themes: VET, Mental Health, Digital Rights, Democracy, Climate Justice" },
            description: { type: Type.STRING, description: "concise summary" },
            priority: { type: Type.STRING, description: "'High', 'Medium', 'Low', or 'Irrelevant'" },
            priorityScore: { type: Type.NUMBER, description: "0-100" },
            priorityReasoning: { type: Type.STRING, description: "1-2 sentences" },
            date: { type: Type.STRING, description: "YYYY-MM-DD" },
            venue: { type: Type.STRING },
            initialDeadline: { type: Type.STRING, description: "YYYY-MM-DD, registration deadline if any" },
            finalDeadline: { type: Type.STRING, description: "YYYY-MM-DD, final deadline to confirm" },
            linkedActivities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "list of related OBESSU projects/documents" },
            registrationLink: { type: Type.STRING, description: "URL if present" },
            programmeLink: { type: Type.STRING, description: "URL if present" },
          },
          required: ["sender", "institution", "eventName", "theme", "description", "priority", "priorityScore", "priorityReasoning", "date", "venue", "initialDeadline", "finalDeadline", "linkedActivities"],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
       throw new Error('Gemini returned an empty response.');
    }

    let parsed;
    try {
      parsed = extractJSON(rawText);
    } catch (e: any) {
      throw new Error(`Failed to parse JSON from model response: ${e.message}`);
    }

    // Map to our AnalysisResult type (with enum for priority)
    return {
      ...parsed,
      priority: parsed.priority as Priority,
      linkedActivities: parsed.linkedActivities || [],
    };
  } catch (error: any) {
    console.error("analyzeInvitation error:", error);
    throw new Error(error.message || 'An unexpected error occurred during analysis.');
  }
};

export const generateBriefing = async (event: any): Promise<string> => {
  const prompt = `Create a 1-page executive briefing for a representative attending the following event:
Event: ${event.analysis.eventName}
Institution: ${event.analysis.institution}
Theme: ${event.analysis.theme}
Context: ${event.analysis.description}
Linked Activities: ${event.analysis.linkedActivities.join(', ')}

${OBESSU_CONTEXT}

Include:
1. Key Objectives for OBESSU
2. Potential 'Red Lines' (What to avoid)
3. Key Stakeholders likely present
4. Suggested opening statement points.

Format as plain text, no JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.3,
      },
    });

    if (!response.text) {
       throw new Error('Gemini returned an empty response.');
    }
    return response.text;
  } catch (error: any) {
    console.error("generateBriefing error:", error);
    throw new Error(error.message || 'An unexpected error occurred during briefing generation.');
  }
};

export const summarizeFollowUp = async (event: any, notes: string): Promise<string> => {
  const prompt = `Summarize the following follow-up notes for the event "${event.analysis.eventName}":\n\n${notes}

${OBESSU_CONTEXT}

Provide a concise summary of outcomes, key contacts made, and follow-up tasks relevant to OBESSU's strategic themes.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    if (!response.text) {
       throw new Error('Gemini returned an empty response.');
    }
    return response.text;
  } catch (error: any) {
    console.error("summarizeFollowUp error:", error);
    throw new Error(error.message || 'An unexpected error occurred during summarization.');
  }
};
