import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeInvitation } from './geminiService';

// Mock dependencies
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

describe('Security Check: LocalStorage Usage', () => {
  let localStorageMock: any;
  let sessionStorageMock: any;

  beforeEach(() => {
    // Setup mocks
    localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    sessionStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('sessionStorage', sessionStorageMock);

    process.env.API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should explicitly avoid using localStorage for sensitive data caching', async () => {
    const mockResponseData = {
      sender: 'Security Test Sender',
      subject: 'Security Test Subject',
      priority: 'High',
      priorityScore: 90,
      linkedActivities: [],
      description: 'Sensitive Description',
      eventName: 'Sensitive Event',
      institution: 'Sensitive Institution',
      date: '2024-01-01',
      venue: 'Secure Location'
    };

    generateContentMock.mockResolvedValue({
      text: JSON.stringify(mockResponseData),
    });

    const input = { text: 'Analyze this sensitive invitation' };
    await analyzeInvitation(input);

    // Assertions
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    expect(localStorageMock.getItem).not.toHaveBeenCalled();

    // Verify sessionStorage is used instead (as the secure alternative)
    expect(sessionStorageMock.setItem).toHaveBeenCalled();
  });
});
