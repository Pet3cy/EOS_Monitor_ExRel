import { describe, it, expect, vi, beforeEach } from 'vitest';

const { generateContentMock } = vi.hoisted(() => {
  return { generateContentMock: vi.fn() };
});

vi.mock('@google/genai', async () => {
  const actual = await vi.importActual<any>('@google/genai');
  return {
    ...actual,
    GoogleGenAI: class {
      models = {
        generateContent: generateContentMock,
      };
      constructor(args: any) {}
    },
  };
});

import { analyzeInvitation } from './geminiService';

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should analyze invitation successfully (Happy Path)', async () => {
    const mockData = {
      sender: 'Test Sender',
      institution: 'Test Institution',
      eventName: 'Test Event',
      priority: 'High',
      priorityScore: 90,
      description: 'Test Description',
      date: '2023-10-27',
      venue: 'Brussels',
      linkedActivities: ['Activity 1'],
    };

    generateContentMock.mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockData),
      },
    });

    const input = { text: 'Test invitation text' };
    const result = await analyzeInvitation(input);

    expect(result).toEqual({
      ...mockData,
      priority: 'High',
      linkedActivities: ['Activity 1'],
    });

    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors gracefully', async () => {
    const error = new Error('Network Error');
    generateContentMock.mockRejectedValue(error);

    const input = { text: 'Test invitation text' };

    await expect(analyzeInvitation(input)).rejects.toThrow('Failed to analyze invitation: Network Error');
  });

  it('should handle invalid JSON response gracefully', async () => {
    generateContentMock.mockResolvedValue({
      response: {
        text: () => 'Invalid JSON',
      },
    });

    const input = { text: 'Test invitation text' };

    await expect(analyzeInvitation(input)).rejects.toThrow(/Failed to parse AI response/);
  });
});
