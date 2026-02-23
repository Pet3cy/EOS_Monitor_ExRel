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

      await expect(analyzeInvitation(input)).rejects.toThrow(/Failed to parse analysis result from AI service/);
  });

   it('should throw error on empty/null response text', async () => {
      generateContentMock.mockResolvedValue({
          text: null,
      });

      const input = { text: 'Test Empty Response' }; // Unique input
      await expect(analyzeInvitation(input)).rejects.toThrow(/Missing required field: sender/);
  });


  it('should throw error when analysis result is missing required fields', async () => {
      const mockResponseData = {
          sender: 'Test Sender',
          // Missing other required fields
      };

      generateContentMock.mockResolvedValue({
          text: JSON.stringify(mockResponseData),
      });

      const input = { text: 'Test Missing Fields' };

      await expect(analyzeInvitation(input)).rejects.toThrow(/Missing required field/);
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
