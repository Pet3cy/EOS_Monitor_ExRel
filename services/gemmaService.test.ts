import { describe, it, expect } from 'vitest';
import { extractJSON } from './gemmaService.ts';

describe('extractJSON', () => {
  it('should extract plain JSON', () => {
    const jsonStr = '{"key": "value"}';
    const result = extractJSON(jsonStr);
    expect(result).toEqual({ key: 'value' });
  });

  it('should extract JSON from markdown code blocks', () => {
    const markdownStr = '```json\n{"key": "value"}\n```';
    const result = extractJSON(markdownStr);
    expect(result).toEqual({ key: 'value' });
  });

  it('should extract JSON embedded within arbitrary text', () => {
    const embeddedStr = 'Here is the json you requested:\n\n{"key": "value"}\n\nHope this helps!';
    const result = extractJSON(embeddedStr);
    expect(result).toEqual({ key: 'value' });
  });

  it('should throw error on completely malformed JSON', () => {
    const malformedStr = 'This is just some plain text without any JSON in it.';
    expect(() => extractJSON(malformedStr)).toThrowError(/Could not extract valid JSON from model response/);
  });

  it('should throw error on invalid JSON object structure', () => {
    const malformedStr = 'Here is some broken JSON: { "key": "value", } and some text';
    expect(() => extractJSON(malformedStr)).toThrowError(/Could not extract valid JSON from model response/);
  });
});
