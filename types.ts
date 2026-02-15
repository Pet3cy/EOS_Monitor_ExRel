export enum Priority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
  Irrelevant = 'Irrelevant',
}

export interface AnalysisResult {
  sender: string;
  senderEmail?: string;
  subject?: string;
  institution: string;
  eventName: string;
  theme: string;
  description: string;
  priority: Priority;
  priorityScore: number; // 0-100 scale
  priorityReasoning: string;
  date: string;
  venue: string;
  initialDeadline: string;
  finalDeadline: string;
  linkedActivities: string[];
  registrationLink?: string;
  programmeLink?: string;
}

export type RepresentativeRole = 'Speaker' | 'Participant' | 'Activity Host' | 'Other';

export interface Contact {
  id: string;
  name: string;
  email: string;
  role: string; // Professional title/role
  organization: string;
  notes: string;
}

export interface ContactDetails {
  contactId?: string; // Reference to a global contact
  polContact: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  repRole: RepresentativeRole;
  notes: string;
}

export interface CommsPack {
  remarks: string;
  representative: string;
  datePlace: string;
  additionalInfo: string;
  posterData?: string;
}

export interface FollowUpDetails {
  prepResources: string;
  briefing: string;
  commsPack: CommsPack;
  postEventNotes: string;
  status: 'To Respond' | 'Responsed - On hold for updates' | 'Confirmation - To be briefed' | 'Prep ready' | 'Completed - No follow up' | 'Completed - Follow Up' | 'MOs comms' | 'Not Relevant';
}

export interface EventData {
  id: string;
  createdAt: number;
  originalText: string;
  analysis: AnalysisResult;
  contact: ContactDetails;
  followUp: FollowUpDetails;
}


// Note: Global JSX namespace override is intentionally omitted to enforce strict type checking.
