import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, Priority, EventData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

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
  const parts = [];
  if (input.fileData) {
    parts.push({ inlineData: input.fileData });
    parts.push({ text: "Analyze this document as an event invitation. If it's an email, extract headers." });
  } else if (input.text) {
    parts.push({ text: `Analyze the following invitation (check for email headers):\n\n${input.text}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    try {
      const data = JSON.parse(response.text || "{}");

      return {
        ...data,
        priority: data.priority as Priority,
        linkedActivities: data.linkedActivities || [],
      };
    } catch (parseError) {
      throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Failed to parse AI response')) {
      throw error;
    }
    throw new Error(`Failed to analyze invitation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ parts: [{ text: prompt }] }],
  });

  return response.text;
};

export const summarizeFollowUp = async (file: { mimeType: string, data: string }) => {
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: {
      parts: [
        { inlineData: file },
        { text: "Summarize this document focusing on key outcomes, decisions, and follow-up actions. Keep it professional." }
      ]
    },
  });
  return response.text;
};
