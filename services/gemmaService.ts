/// <reference types="vite/client" />
// src/services/gemmaService.ts
import { AnalysisResult, Priority } from '../types';

export interface AnalysisInput {
  text?: string;
  fileData?: {
    mimeType: string;
    data: string;
  };
}

const API_BASE = '/api/ai';

export const analyzeInvitation = async (input: AnalysisInput): Promise<AnalysisResult> => {
  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }

    const { result } = await response.json();

    // Map to our AnalysisResult type (with enum for priority)
    return {
      ...result,
      priority: result.priority as Priority,
      linkedActivities: result.linkedActivities || [],
    };
  } catch (error: any) {
    console.error("analyzeInvitation error:", error);
    throw new Error(error.message || 'An unexpected error occurred during analysis.');
  }
};

export const generateBriefing = async (event: any): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/briefing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Briefing generation failed');
    }

    const { result } = await response.json();
    return result;
  } catch (error: any) {
    console.error("generateBriefing error:", error);
    throw new Error(error.message || 'An unexpected error occurred during briefing generation.');
  }
};

export const summarizeFollowUp = async (event: any, notes: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Summarization failed');
    }

    const { result } = await response.json();
    return result;
  } catch (error: any) {
    console.error("summarizeFollowUp error:", error);
    throw new Error(error.message || 'An unexpected error occurred during summarization.');
  }
};
