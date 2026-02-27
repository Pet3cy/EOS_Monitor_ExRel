// src/services/gemmaService.ts
import { AnalysisResult, Priority } from '../types';

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'gemma2:2b'; // Change to your preferred Gemma model

// System prompt that includes OBESSU context and instructs JSON output
const SYSTEM_PROMPT = `You are a senior IT & Operations Specialist for OBESSU (Organising Bureau of European School Student Unions). Your task is to analyze event invitations and return a JSON object with the following fields:

- sender: string (name of the sender)
- senderEmail: string (email, if available)
- subject: string (email subject, if available)
- institution: string (organizing body)
- eventName: string
- theme: string (map to OBESSU's strategic themes: VET, Mental Health, Digital Rights, Democracy, Climate Justice)
- description: string (concise summary)
- priority: "High" | "Medium" | "Low" | "Irrelevant"
- priorityScore: number (0-100)
- priorityReasoning: string (1-2 sentences)
- date: string (YYYY-MM-DD)
- venue: string
- initialDeadline: string (YYYY-MM-DD, registration deadline if any)
- finalDeadline: string (YYYY-MM-DD, final deadline to confirm)
- linkedActivities: string[] (list of related OBESSU projects/documents)
- registrationLink: string (URL if present)
- programmeLink: string (URL if present)

Use the following organizational context to determine relevance and assign priorities:

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

Return ONLY a valid JSON object, no additional text or markdown.`;

export interface AnalysisInput {
  text?: string;
  fileData?: {
    mimeType: string;
    data: string;
  };
}

export const analyzeInvitation = async (input: AnalysisInput): Promise<AnalysisResult> => {
  // Build the user prompt from input
  let userPrompt = '';
  if (input.fileData) {
    // For file data, we include a note (actual file processing is done before calling this)
    userPrompt = `Analyze this document as an event invitation. If it's an email, extract headers. Document type: ${input.fileData.mimeType}\n\n[Base64 data omitted, but treat it as the full content]`;
  } else if (input.text) {
    userPrompt = `Analyze the following invitation (check for email headers):\n\n${input.text}`;
  } else {
    throw new Error('No input provided');
  }

  const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt: fullPrompt,
      stream: false,
      temperature: 0.2,
      max_tokens: 1024,
      format: 'json',  // hint to Ollama to generate JSON (supported by many models)
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.response;

  // Attempt to extract JSON from the response (Gemma might add extra text)
  let jsonMatch = rawText.match(/\{.*\}/s);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from model response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Map to our AnalysisResult type (with enum for priority)
  return {
    ...parsed,
    priority: parsed.priority as Priority,
    linkedActivities: parsed.linkedActivities || [],
  };
};

export const generateBriefing = async (event: any): Promise<string> => {
  const prompt = `Create a 1-page executive briefing for a representative attending the following event:
Event: ${event.analysis.eventName}
Institution: ${event.analysis.institution}
Theme: ${event.analysis.theme}
Context: ${event.analysis.description}
Linked Activities: ${event.analysis.linkedActivities.join(', ')}

Use the OBESSU context below to tailor the briefing:

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

Include:
1. Key Objectives for OBESSU
2. Potential 'Red Lines' (What to avoid)
3. Key Stakeholders likely present
4. Suggested opening statement points.

Format as plain text, no JSON.`;

  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt: prompt,
      stream: false,
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    throw new Error('Briefing generation failed');
  }

  const data = await response.json();
  return data.response;
};

export const summarizeFollowUp = async (event: any, notes: string): Promise<string> => {
  const prompt = `Summarize the following follow-up notes for the event "${event.analysis.eventName}":\n\n${notes}`;
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt: prompt,
      stream: false,
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });
  if (!response.ok) {
    throw new Error('Follow-up summarization failed');
  }
  const data = await response.json();
  return data.response;
};
