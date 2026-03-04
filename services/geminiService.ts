
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, Priority } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
1. Identify Email Metadata: Extract the Subject, Sender Name, and Sender Email if visible in the headers. Handle raw HTML emails, stripping tags to find the core content. Pay special attention to forwarded messages (e.g., "Fwd:", "Forwarded message") and extract the original sender and context.
2. Nested Event Details: Carefully read through long email threads to extract nested details (e.g., if the time was changed in a later reply, use the updated time). Identify inline replies and signature blocks to avoid confusion.
3. Thematic Analysis: Map the event to OBESSU's strategic goals defined in the context above.
4. Role Mapping: Suggest the most relevant Board Member or Staff based on the portfolios listed above.
5. NLP Priority Scoring (0-100):
   - Perform deep Natural Language Processing (NLP) on the email content to understand the 'why' behind the event's importance. Look for urgency markers, high-level stakeholder involvement, and direct alignment with OBESSU's strategic themes.
   - 90-100: Critical strategic match (e.g., EU Commission VET consultation for Alessandro/Daniele).
   - 70-89: High relevance to specific portfolios (e.g., Mental Health event for Ívar).
   - 50-69: General networking or partnership interest.
   - <50: Low priority or irrelevant.
6. Thread Summarization: If the input is a long email thread, provide a concise overview of the event planning discussion in the 'threadSummary' field.

TRAINING EXAMPLES (Few-Shot):

Example 1:
Input: "Subject: Invitation: VET Quality Workshop. Dear OBESSU, we invite you to a workshop on VET quality on March 15th, 2026 at 10:00 CET. Location: Rue de la Loi 170, Brussels. RSVP here: https://rsvp.example.com"
Output: {
  "sender": "Unknown",
  "institution": "Unknown",
  "eventName": "VET Quality Workshop",
  "theme": "Vocational Education & Training (VET)",
  "description": "Workshop focusing on VET quality standards.",
  "priority": "High",
  "priorityScore": 95,
  "priorityReasoning": "Directly aligns with the VET & Apprenticeships strategic theme. High priority for advocacy.",
  "date": "2026-03-15",
  "time": "10:00 CET",
  "venue": "Rue de la Loi 170, Brussels",
  "registrationLink": "https://rsvp.example.com"
}

Example 2:
Input: "From: info@lllp.eu. Subject: LLLP General Assembly. Join us on April 2nd at 14:00 via Zoom for our annual GA."
Output: {
  "sender": "LLLP Info",
  "senderEmail": "info@lllp.eu",
  "institution": "Lifelong Learning Platform",
  "eventName": "LLLP General Assembly",
  "theme": "Inclusive Education & Social Justice",
  "description": "Annual General Assembly of the Lifelong Learning Platform.",
  "priority": "Medium",
  "priorityScore": 75,
  "priorityReasoning": "Important partnership event, though not a direct policy consultation.",
  "date": "2026-04-02",
  "time": "14:00",
  "venue": "Online (Zoom)",
  "registrationLink": ""
}

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
    threadSummary: { type: Type.STRING },
    date: { type: Type.STRING },
    time: { type: Type.STRING },
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
  papersContent?: string;
}


export const safeParseJSON = (text: string): any => {
  const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    const data = JSON.parse(cleanedText);
    if (!data || typeof data !== 'object') {
       throw new Error('Response is not a valid JSON object');
    }
    return data;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Raw response snippet:', cleanedText.slice(0, 200));
    throw new Error('Failed to parse AI response as JSON.');
  }
};

export const analyzeInvitation = async (input: AnalysisInput): Promise<AnalysisResult> => {
  const parts = [];
  if (input.fileData) {
    parts.push({ inlineData: input.fileData });
    parts.push({ text: "Analyze this document as an event invitation. If it's an email, extract headers. Handle complex email threads, forwarded messages, and various formatting." });
  } else if (input.text) {
    parts.push({ text: `Analyze the following invitation (check for email headers). Handle complex email threads, forwarded messages, and various formatting:\n\n${input.text}` });
  }

  if (input.papersContent) {
    parts.push({ text: `Here are some relevant research papers to align with the event:\n\n${input.papersContent}` });
  }

  // Enhanced instruction for Gemma to ensure JSON output
  const gemmaInstruction = `${SYSTEM_INSTRUCTION}
  
  CRITICAL OUTPUT REQUIREMENT:
  You must output ONLY a valid JSON object. Do not include markdown formatting (like \`\`\`json).
  The JSON must strictly follow this structure:
  {
    "sender": "string",
    "senderEmail": "string",
    "subject": "string",
    "institution": "string",
    "eventName": "string",
    "theme": "string",
    "description": "string",
    "priority": "High" | "Medium" | "Low" | "Irrelevant",
    "priorityScore": number (0-100),
    "priorityReasoning": "string",
    "threadSummary": "string",
    "date": "YYYY-MM-DD",
    "time": "string",
    "venue": "string",
    "initialDeadline": "YYYY-MM-DD",
    "finalDeadline": "YYYY-MM-DD",
    "linkedActivities": ["string"],
    "registrationLink": "string",
    "programmeLink": "string"
  }`;

  const response = await ai.models.generateContent({
    model: "gemma-2-27b-it",
    contents: { parts },
    config: {
      systemInstruction: gemmaInstruction,
      // Gemma works best with explicit prompt instructions rather than strict schema mode
      temperature: 0.2, 
    },
  });

  const text = response.text || "{}";
  const data = safeParseJSON(text);
  
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
    model: "gemma-2-27b-it",
    contents: [{ parts: [{ text: prompt }] }],
  });

  return response.text;
};

export const summarizeFollowUp = async (file: { mimeType: string, data: string }) => {
  const response = await ai.models.generateContent({
    model: "gemma-2-27b-it",
    contents: {
      parts: [
        { inlineData: file },
        { text: "Summarize this document focusing on key outcomes, decisions, and follow-up actions. Keep it professional." }
      ]
    },
  });
  return response.text;
};
