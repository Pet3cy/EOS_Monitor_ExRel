import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeInvitation } from './geminiService';

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

      await expect(analyzeInvitation(input)).rejects.toThrow();
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

  it('should handle combined text and fileData input by prioritizing fileData', async () => {
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
      text: 'This text should be ignored',
      fileData: {
        mimeType: 'application/pdf',
        data: 'base64data',
      },
    };

    const result = await analyzeInvitation(input);

    // Should use fileData, not text
    expect(generateContentMock).toHaveBeenCalledWith(expect.objectContaining({
      contents: expect.objectContaining({
         parts: expect.arrayContaining([
            expect.objectContaining({ inlineData: input.fileData })
         ])
      }),
    }));

    expect(result.priority).toBe('Medium');
  });

  it('should normalize priority field to Priority enum', async () => {
    const mockResponseData = {
      sender: 'Test Sender',
      priority: 'Low',
      priorityScore: 30,
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

    const input = { text: 'Test normalization input' };
    const result = await analyzeInvitation(input);

    expect(result.priority).toBe('Low');
    expect(result.linkedActivities).toEqual(['Activity 1']);
  });

  it('should ensure linkedActivities is always an array', async () => {
    const mockResponseData = {
      sender: 'Test Sender',
      priority: 'High',
      priorityScore: 90,
      description: 'Test Description',
      eventName: 'Test Event',
      institution: 'Test Institution',
      date: '2023-10-27',
      venue: 'Brussels'
      // linkedActivities is missing
    };

    generateContentMock.mockResolvedValue({
      text: JSON.stringify(mockResponseData),
    });

    const input = { text: 'Test linked activities normalization' };
    const result = await analyzeInvitation(input);

    expect(result.linkedActivities).toEqual([]);
    expect(Array.isArray(result.linkedActivities)).toBe(true);
  });

  it('should cache results to avoid duplicate API calls', async () => {
    const mockResponseData = {
      sender: 'Cached Sender',
      priority: 'High',
      priorityScore: 95,
      linkedActivities: [],
      description: 'Cached Description',
      eventName: 'Cached Event',
      institution: 'Cached Institution',
      date: '2023-12-01',
      venue: 'Paris'
    };

    generateContentMock.mockResolvedValue({
      text: JSON.stringify(mockResponseData),
    });

    const input = { text: 'This should be cached test input unique identifier 12345' };

    // First call
    const result1 = await analyzeInvitation(input);
    const result1 = await analyzeInvitation(input);
    expect(generateContentMock).toHaveBeenCalledTimes(1);

    // Second call with same input makes another API call (no caching)
    const result2 = await analyzeInvitation(input);
    expect(generateContentMock).toHaveBeenCalledTimes(2);

    expect(result1).toEqual(result2);
  });

  it('should handle API responses with missing priority field', async () => {
    const mockResponseData = {
      sender: 'Test Sender',
      description: 'Test Description',
      eventName: 'Test Event',
      institution: 'Test Institution',
      date: '2023-10-27',
      venue: 'Brussels'
      // priority is missing
    };

    generateContentMock.mockResolvedValue({
      text: JSON.stringify(mockResponseData),
    });

    const input = { text: 'Test input for missing priority field' };
    const result = await analyzeInvitation(input);

    expect(result.priority).toBeUndefined();
    expect(result.linkedActivities).toEqual([]);
  });

  it('should handle concurrent requests correctly', async () => {
    const mockResponse1 = {
      sender: 'Sender 1',
      priority: 'High',
      priorityScore: 95,
      linkedActivities: [],
      eventName: 'Event 1',
      institution: 'Institution 1',
      date: '2023-10-27',
      venue: 'Brussels'
    };

    const mockResponse2 = {
      sender: 'Sender 2',
      priority: 'Low',
      priorityScore: 30,
      linkedActivities: [],
      eventName: 'Event 2',
      institution: 'Institution 2',
      date: '2023-11-01',
      venue: 'Paris'
    };

    let callCount = 0;
    generateContentMock.mockImplementation(async () => {
      callCount++;
      return {
        text: JSON.stringify(callCount === 1 ? mockResponse1 : mockResponse2),
      };
    });

    const input1 = { text: 'Unique concurrent test input 1' };
    const input2 = { text: 'Unique concurrent test input 2' };

    const [result1, result2] = await Promise.all([
      analyzeInvitation(input1),
      analyzeInvitation(input2),
    ]);

    expect(result1.eventName).toBe('Event 1');
    expect(result2.eventName).toBe('Event 2');
    expect(generateContentMock).toHaveBeenCalledTimes(2);
  });
});