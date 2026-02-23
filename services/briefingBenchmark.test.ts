import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateBriefing } from './geminiService';
import { EventData, Priority } from '../types';

// Mock the GoogleGenAI client
const { generateContentMock } = vi.hoisted(() => {
  return { generateContentMock: vi.fn() };
});

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn(function() {
      return {
        models: {
          generateContent: generateContentMock,
        },
      };
    }),
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      INTEGER: 'INTEGER',
      ARRAY: 'ARRAY',
    },
    Schema: {},
  };
});

describe('generateBriefing Benchmark', () => {
  const originalApiKey = process.env.API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_KEY = 'test-api-key';
    // Mock sessionStorage
    const sessionStorageMock = {
        store: {} as Record<string, string>,
        getItem: vi.fn((key: string) => sessionStorageMock.store[key] || null),
        setItem: vi.fn((key: string, value: string) => { sessionStorageMock.store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete sessionStorageMock.store[key]; }),
        clear: vi.fn(() => { sessionStorageMock.store = {}; }),
    };
    vi.stubGlobal('sessionStorage', sessionStorageMock);
  });

  afterEach(() => {
    process.env.API_KEY = originalApiKey;
    vi.unstubAllGlobals();
  });

  it('should measure execution time of generateBriefing', async () => {
    const mockEvent: EventData = {
      id: 'event-123',
      createdAt: Date.now(),
      originalText: 'original text',
      analysis: {
        eventName: 'Test Event',
        institution: 'Test Institution',
        theme: 'Test Theme',
        description: 'Test Description',
        linkedActivities: ['Activity 1'],
        priority: Priority.High,
        priorityScore: 10,
        priorityReasoning: 'Reason',
        date: '2023-10-27',
        venue: 'Venue',
        initialDeadline: 'Deadline',
        finalDeadline: 'Deadline',
        sender: 'Sender',
        sender: 'Sender',
      },
      contact: {},
      followUp: {},
    };
    };

    // Simulate a slow API response
    generateContentMock.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      return { text: 'Briefing content' };
    });

    const start1 = performance.now();
    await generateBriefing(mockEvent);
    const end1 = performance.now();
    const duration1 = end1 - start1;

    const start2 = performance.now();
    await generateBriefing(mockEvent);
    const end2 = performance.now();
    const duration2 = end2 - start2;

    expect(duration2).toBeLessThan(duration1);
    expect(duration2).toBeLessThan(1); // Expect cache hit to be very fast
  });
});
