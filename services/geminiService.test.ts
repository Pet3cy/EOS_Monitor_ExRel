import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeInvitation, generateBriefing } from './geminiService';
import { EventData, Priority } from '../types';

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
});

describe('generateBriefing', () => {
  const originalApiKey = process.env.API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env.API_KEY = originalApiKey;
  });

  it('should generate briefing successfully', async () => {
    const mockResponseText = 'Briefing content';
    generateContentMock.mockResolvedValue({
      text: mockResponseText,
    });

    const mockEvent: EventData = {
        id: '1',
        createdAt: 1234567890,
        originalText: 'original',
        contact: {
             polContact: 'pol', name: 'name', email: 'email', role: 'role', organization: 'org', repRole: 'Speaker', notes: 'notes'
        },
        followUp: {
            prepResources: '', briefing: '', commsPack: { remarks: '', representative: '', datePlace: '', additionalInfo: '' }, postEventNotes: '', status: 'To Respond'
        },
        analysis: {
            sender: 'sender',
            institution: 'Test Institution',
            eventName: 'Test Event',
            theme: 'Test Theme',
            description: 'Test Description',
            priority: Priority.High,
            priorityScore: 90,
            priorityReasoning: '',
            date: '',
            venue: '',
            initialDeadline: '',
            finalDeadline: '',
            linkedActivities: ['Activity 1', 'Activity 2']
        }
    };

    const result = await generateBriefing(mockEvent);

    expect(generateContentMock).toHaveBeenCalledWith(expect.objectContaining({
      contents: expect.arrayContaining([
        expect.objectContaining({
          parts: expect.arrayContaining([
            expect.objectContaining({
              text: expect.stringContaining('Test Event')
            }),
            expect.objectContaining({
                text: expect.stringContaining('Activity 1, Activity 2')
            })
          ])
        })
      ])
    }));
    expect(result).toBe(mockResponseText);
  });

  it('should throw error if event data is missing', async () => {
    await expect(generateBriefing(null as any)).rejects.toThrow('Invalid event data');
  });

  it('should throw error if analysis data is missing', async () => {
      const mockEvent = { id: '1' } as EventData;
      await expect(generateBriefing(mockEvent)).rejects.toThrow('Invalid event data');
  });

  it('should handle missing optional fields in analysis', async () => {
      generateContentMock.mockResolvedValue({ text: 'Success' });
       const mockEvent: EventData = {
        id: '1',
        createdAt: 1234567890,
        originalText: 'original',
        contact: {} as any,
        followUp: {} as any,
        analysis: {
            eventName: undefined, // Missing
            institution: undefined,
            theme: undefined,
            description: undefined,
            linkedActivities: undefined
        } as any
    };

    const result = await generateBriefing(mockEvent);
    expect(result).toBe('Success');

    // verify N/A are used
     expect(generateContentMock).toHaveBeenCalledWith(expect.objectContaining({
      contents: expect.arrayContaining([
        expect.objectContaining({
          parts: expect.arrayContaining([
            expect.objectContaining({
              text: expect.stringContaining('Event: N/A')
            })
          ])
        })
      ])
    }));
  });
});
