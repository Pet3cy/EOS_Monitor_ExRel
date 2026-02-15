
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, Priority } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Caching configuration
const CACHE_PREFIX = 'gemini_cache_v2_';
const MAX_CACHE_SIZE = 50;
const MEMORY_CACHE = new Map<string, AnalysisResult>();

const generateCacheKey = async (input: AnalysisInput): Promise<string> => {
  const content = input.fileData
    ? `${input.fileData.mimeType}:${input.fileData.data}`
    : (input.text || '');

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

const getFromCache = (key: string): AnalysisResult | null => {
  if (MEMORY_CACHE.has(key)) {
    return MEMORY_CACHE.get(key) || null;
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        MEMORY_CACHE.set(key, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
  }
  return null;
};

const saveToCache = (key: string, data: AnalysisResult) => {
  if (MEMORY_CACHE.size >= MAX_CACHE_SIZE) {
    const firstKey = MEMORY_CACHE.keys().next().value;
    if (firstKey) MEMORY_CACHE.delete(firstKey);
  }
  MEMORY_CACHE.set(key, data);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }
};


const OBESSU_DATA_CONTEXT = `
ORGANIZATIONAL STRUCTURE & PORTFOLIOS (2026):

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
5. Climate Justice in Education.
`;

const SYSTEM_INSTRUCTION = `
You are a senior IT & Operations Specialist for OBESSU (Organising Bureau of European School Student Unions). 
Your task is to analyze event invitations received via email or documents and structure the information for the secretariat.

DATA INTEGRATION:
Use the following organizational context to determine relevance, assign priorities, and suggest appropriate representatives:
${OBESSU_DATA_CONTEXT}

Extraction Rules:
1. Identify Email Metadata: Extract the Subject, Sender Name, and Sender Email if visible in the headers.
2. Thematic Analysis: Map the event to OBESSU's strategic goals defined in the context above.
3. Role Mapping: Suggest the most relevant Board Member or Staff based on the portfolios listed above.
4. Prioritization Scoring (0-100):
   - 90-100: Critical strategic match (e.g., EU Commission VET consultation for Alessandro/Daniele).
   - 70-89: High relevance to specific portfolios (e.g., Mental Health event for Ívar).
   - 50-69: General networking or partnership interest.
   - <50: Low priority or irrelevant.

Output Requirements:
- Provide a concise summary (description).
- Extract URLs for registration and agendas.
- Suggest internal OBESSU documents or past positions relevant to the topic.
`;

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
  

  const result: AnalysisResult = {
    ...data,
    priority: data.priority as Priority,
    linkedActivities: data.linkedActivities || [],
  };
  saveToCache(cacheKey, result);
  return result;
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
