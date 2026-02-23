import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Priority } from '../types';
import { analyzeInvitation, generateBriefing } from './geminiService';

const { generateContentMock } = vi.hoisted(() => {
  return { generateContentMock: vi.fn() };
});

vi.mock('@google/genai', () => {
  return {
    // Use a regular function so it can be used as a constructor
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

describe('analyzeInvitation', () => {
  const originalApiKey = process.env.API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env.API_KEY = originalApiKey;
  });

  it('should analyze text input correctly', async () => {
    const mockResponseData = {
      sender: 'Test Sender',
      subject: 'Test Subject',
      priority: 'High',
      priorityScore: 95,
      linkedActivities: ['Activity 1'],
      description: 'Test Description',
      eventName: 'Test Event',
      institution: 'Test Institution',
      date: '2023-10-27',
      venue: 'Brussels'
    };

    generateContentMock.mockResolvedValue({
      text: JSON.stringify(mockResponseData),
    });

    const input = { text: 'Test invitation text' };
    const result = await analyzeInvitation(input);

    expect(generateContentMock).toHaveBeenCalledWith(expect.objectContaining({
      contents: expect.objectContaining({
        parts: expect.arrayContaining([
            expect.objectContaining({ text: expect.stringContaining('Test invitation text') })
        ])
      }),
    }));

    expect(result).toEqual({
      ...mockResponseData,
      priority: 'High',
      linkedActivities: ['Activity 1'],
    });
  });

  it('should analyze file input correctly', async () => {
     const mockResponseData = {
      sender: 'File Sender',
      subject: 'File Subject',
      priority: 'Medium',
      priorityScore: 60,
      linkedActivities: [],
      description: 'File Description',
      eventName: 'File Event',
      institution: 'File Institution',
      date: '2023-11-01',
      venue: 'Online'
    };

    generateContentMock.mockResolvedValue({
      text: JSON.stringify(mockResponseData),
    });

    const input = {
      fileData: {
        mimeType: 'application/pdf',
        data: 'base64data',
      },
    };
    const result = await analyzeInvitation(input);

    expect(generateContentMock).toHaveBeenCalledWith(expect.objectContaining({
      contents: expect.objectContaining({
         parts: expect.arrayContaining([
            expect.objectContaining({ inlineData: input.fileData })
         ])
      }),
    }));

    expect(result).toEqual({
        ...mockResponseData,
        priority: 'Medium',
        linkedActivities: [],
    });
  });

  it('should throw error on invalid JSON response', async () => {
      generateContentMock.mockResolvedValue({
          text: 'Invalid JSON',
      });

      const input = { text: 'Test Invalid JSON' }; // Unique input

      await expect(analyzeInvitation(input)).rejects.toThrow('Failed to parse analysis result from AI service');
  });

   it('should handle empty/null response text gracefully', async () => {
      generateContentMock.mockResolvedValue({
          text: null,
      });

      const input = { text: 'Test Empty Response' }; // Unique input
      const result = await analyzeInvitation(input);

      expect(result).toEqual({
          priority: undefined,
          linkedActivities: [],
      });
  });

  it('should throw error when API_KEY is missing', async () => {
    delete process.env.API_KEY;
    const input = { text: 'Unique Test Input For API Key Check' }; // Unique input to bypass cache
    await expect(analyzeInvitation(input)).rejects.toThrow('API_KEY environment variable is missing');
  });

  describe('Caching', () => {
    let sessionStorageMock: any;
    let localStorageMock: any;

    beforeEach(() => {
      sessionStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
      };
      localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
      };
      vi.stubGlobal('sessionStorage', sessionStorageMock);
      vi.stubGlobal('localStorage', localStorageMock);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should use sessionStorage and not localStorage', async () => {
      const mockResponseData = {
        sender: 'Cache Sender',
        subject: 'Cache Subject',
        priority: 'Low',
        priorityScore: 20,
        linkedActivities: [],
        description: 'Cache Description',
        eventName: 'Cache Event',
        institution: 'Cache Institution',
        date: '2023-12-01',
        venue: 'Virtual'
      };

      generateContentMock.mockResolvedValue({
        text: JSON.stringify(mockResponseData),
      });

      const input = { text: 'Testing cache storage' };
      await analyzeInvitation(input);

      // Verify sessionStorage was used
      expect(sessionStorageMock.setItem).toHaveBeenCalled();

      // Verify localStorage was NOT used
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(localStorageMock.getItem).not.toHaveBeenCalled();
    });
  });
});

describe('generateBriefing', () => {
  const originalApiKey = process.env.API_KEY;
  const mockEvent = {
    id: '1',
    analysis: {
      sender: 'Test Sender',
      subject: 'Test Subject',
      priority: Priority.High,
      priorityScore: 90,
      linkedActivities: ['Activity 1'],
      description: 'Test Description',
      eventName: 'Test Event',
      institution: 'Test Institution',
      date: '2023-10-27',
      venue: 'Brussels',
      theme: 'Test Theme'
    },
    contact: {
      id: '1',
      name: 'Test Contact',
      email: 'test@example.com',
      role: 'Test Role',
      institution: 'Test Institution',
      notes: 'Test Notes'
    },
    status: 'Pending'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env.API_KEY = originalApiKey;
  });

  it('should generate briefing correctly', async () => {
    generateContentMock.mockResolvedValue({
      text: 'Generated Briefing',
    });

    // Create a unique event to bypass cache
    const uniqueEvent = { ...mockEvent, analysis: { ...mockEvent.analysis, description: 'Unique Description ' + Math.random() } };

    const result = await generateBriefing(uniqueEvent as any);

    expect(generateContentMock).toHaveBeenCalledWith(expect.objectContaining({
      contents: expect.arrayContaining([
        expect.objectContaining({ parts: expect.arrayContaining([expect.objectContaining({ text: expect.stringContaining('Create a 1-page executive briefing') })]) })
      ])
    }));
    expect(result).toBe('Generated Briefing');
  });

  it('should cache briefing results', async () => {
    generateContentMock.mockResolvedValue({
      text: 'Cached Briefing',
    });

    // Create a unique event for this test
    const uniqueEvent = { ...mockEvent, analysis: { ...mockEvent.analysis, description: 'Cached Description ' + Math.random() } };

    // First call
    const result1 = await generateBriefing(uniqueEvent as any);
    expect(result1).toBe('Cached Briefing');
    expect(generateContentMock).toHaveBeenCalledTimes(1);

    // Second call with same event
    const result2 = await generateBriefing(uniqueEvent as any);
    expect(result2).toBe('Cached Briefing');

    // Should still be 1 call
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });
});
