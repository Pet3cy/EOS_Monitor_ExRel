import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeInvitation, generateBriefing } from './geminiService';
import { AnalysisResult, Priority } from '../types';

// Mock sessionStorage
const mockStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (i: number) => Object.keys(store)[i] || null,
    get length() { return Object.keys(store).length; }
  };
})();

Object.defineProperty(global, 'sessionStorage', {
  value: mockStorage,
  writable: true
});

const { mockGenerateContent } = vi.hoisted(() => {
  return { mockGenerateContent: vi.fn() };
});

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(function() {
      return {
        models: {
          generateContent: mockGenerateContent
        }
      };
    }),
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      ARRAY: 'ARRAY',
      INTEGER: 'INTEGER',
      BOOLEAN: 'BOOLEAN'
    },
    Schema: {}
  };
});

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('should call API on cache miss and cache the result for analyzeInvitation', async () => {
    const mockResult: AnalysisResult = {
      sender: 'Test Sender',
      institution: 'Test Inst',
      eventName: 'Test Event',
      theme: 'Test Theme',
      description: 'Test Desc',
      priority: Priority.High,
      priorityScore: 90,
      priorityReasoning: 'Reason',
      date: '2026-01-01',
      time: '10:00',
      venue: 'Test Venue',
      initialDeadline: '2026-01-01',
      finalDeadline: '2026-01-01',
      linkedActivities: [],
      registrationLink: 'http://test.com'
    };

    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(mockResult)
    });

    const input = { text: 'Invitation text' };

    // First call - API hit
    const result1 = await analyzeInvitation(input);
    expect(result1).toMatchObject(mockResult);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);

    // Second call - Cache hit
    const result2 = await analyzeInvitation(input);
    expect(result2).toMatchObject(mockResult);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1); // Still 1
  });

  it('should use separate cache for briefing', async () => {
    const mockBriefing = 'Executive Briefing Content';
    mockGenerateContent.mockResolvedValueOnce({
      text: mockBriefing
    });

    const event = {
      analysis: {
        eventName: 'Test Event',
        institution: 'Test Inst',
        theme: 'Test Theme',
        description: 'Test Desc',
        linkedActivities: []
      }
    };

    // First call - API hit
    const result1 = await generateBriefing(event);
    expect(result1).toBe(mockBriefing);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);

    // Second call - Cache hit
    const result2 = await generateBriefing(event);
    expect(result2).toBe(mockBriefing);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});
