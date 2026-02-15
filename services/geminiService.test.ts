import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  beforeEach(() => {
    vi.clearAllMocks();
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

      const input = { text: 'Test' };

      await expect(analyzeInvitation(input)).rejects.toThrow();
  });

   it('should handle empty/null response text gracefully', async () => {
      generateContentMock.mockResolvedValue({
          text: null,
      });

      const input = { text: 'Test' };
      const result = await analyzeInvitation(input);

      expect(result).toEqual({
          priority: undefined,
          linkedActivities: [],
      });
  });
});
