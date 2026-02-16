import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeInvitation, generateBriefing, summarizeFollowUp } from './geminiService';
import { SYSTEM_INSTRUCTION, OBESSU_DATA_CONTEXT } from './prompts';

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
      config: expect.objectContaining({
          systemInstruction: SYSTEM_INSTRUCTION
      })
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

  it('should prioritize fileData over text when both are provided', async () => {
    const mockResponseData = {
      sender: 'Priority Sender',
      subject: 'Priority Subject',
      priority: 'Low',
      priorityScore: 20,
      linkedActivities: [],
      description: 'Desc',
      eventName: 'Event',
      institution: 'Inst',
      date: '2023-12-01',
      venue: 'Home'
    };

    generateContentMock.mockResolvedValue({
        text: JSON.stringify(mockResponseData),
    });

    const input = {
        text: 'Text Input',
        fileData: {
            mimeType: 'application/pdf',
            data: 'filedata'
        }
    };

    await analyzeInvitation(input);

    // Should contain fileData part
    expect(generateContentMock).toHaveBeenCalledWith(expect.objectContaining({
        contents: expect.objectContaining({
            parts: expect.arrayContaining([
                expect.objectContaining({ inlineData: input.fileData }),
                expect.objectContaining({ text: "Analyze this document as an event invitation. If it's an email, extract headers." })
            ])
        })
    }));

    // Should NOT contain the text-specific prompt
    const calls = generateContentMock.mock.calls[0][0];
    const parts = calls.contents.parts;
    const textPart = parts.find((p: any) => p.text && p.text.includes('Analyze the following invitation'));
    expect(textPart).toBeUndefined();
  });

  it('should throw error when input is empty', async () => {
      const input = {};
      // @ts-ignore - testing runtime validation
      await expect(analyzeInvitation(input)).rejects.toThrow('Input must contain either text or fileData');
  });

  it('should throw error on invalid JSON response', async () => {
      generateContentMock.mockResolvedValue({
          text: 'Invalid JSON',
      });

      const input = { text: 'Test Invalid JSON' };

      await expect(analyzeInvitation(input)).rejects.toThrow();
  });

   it('should handle empty/null response text gracefully', async () => {
      generateContentMock.mockResolvedValue({
          text: null,
      });

      const input = { text: 'Test Empty Response' };
      const result = await analyzeInvitation(input);

      expect(result).toEqual({
          priority: undefined,
          linkedActivities: [],
      });
  });

  it('should throw error when API_KEY is missing', async () => {
    delete process.env.API_KEY;
    const input = { text: 'Unique Test Input For API Key Check' };
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

    it('should generate briefing based on event data', async () => {
        generateContentMock.mockResolvedValue({
            text: 'Briefing Content',
        });

        const eventData: any = {
            analysis: {
                eventName: 'Test Event',
                institution: 'Test Inst',
                theme: 'Test Theme',
                description: 'Test Desc',
                linkedActivities: ['Activity A', 'Activity B']
            }
        };

        const result = await generateBriefing(eventData);

        expect(result).toBe('Briefing Content');

        // generateBriefing sends contents: [{ parts: [{ text: prompt }] }]
        expect(generateContentMock).toHaveBeenCalledWith(expect.objectContaining({
            contents: expect.arrayContaining([
                expect.objectContaining({
                    parts: expect.arrayContaining([
                        expect.objectContaining({
                            text: expect.stringContaining('Test Event')
                        }),
                        expect.objectContaining({
                            text: expect.stringContaining(OBESSU_DATA_CONTEXT)
                        })
                    ])
                })
            ])
        }));
    });
});

describe('summarizeFollowUp', () => {
    const originalApiKey = process.env.API_KEY;

    beforeEach(() => {
      vi.clearAllMocks();
      process.env.API_KEY = 'test-api-key';
    });

    afterEach(() => {
      process.env.API_KEY = originalApiKey;
    });

    it('should summarize follow-up document', async () => {
        generateContentMock.mockResolvedValue({
            text: 'Summary Content',
        });

        const file = {
            mimeType: 'application/pdf',
            data: 'base64data'
        };

        const result = await summarizeFollowUp(file);

        expect(result).toBe('Summary Content');
        // summarizeFollowUp sends contents: { parts: [...] }
        expect(generateContentMock).toHaveBeenCalledWith(expect.objectContaining({
            contents: expect.objectContaining({
                parts: expect.arrayContaining([
                    expect.objectContaining({ inlineData: file }),
                    expect.objectContaining({ text: expect.stringContaining('Summarize this document') })
                ])
            })
        }));
    });
});
