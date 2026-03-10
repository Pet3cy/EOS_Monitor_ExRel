import { test } from 'node:test';
import assert from 'node:assert';
import { extractJSON } from './gemmaService.ts';

test('extractJSON handles plain JSON strings', () => {
  const input = '{"key": "value", "number": 123}';
  const expected = { key: 'value', number: 123 };
  assert.deepStrictEqual(extractJSON(input), expected);
});

test('extractJSON handles JSON with leading/trailing whitespace', () => {
  const input = '   {"key": "value"}   \n';
  const expected = { key: 'value' };
  assert.deepStrictEqual(extractJSON(input), expected);
});

test('extractJSON handles JSON in markdown code blocks (json)', () => {
  const input = '```json\n{"key": "value"}\n```';
  const expected = { key: 'value' };
  assert.deepStrictEqual(extractJSON(input), expected);
});

test('extractJSON handles JSON in plain markdown code blocks', () => {
  const input = '```\n{"key": "value"}\n```';
  const expected = { key: 'value' };
  assert.deepStrictEqual(extractJSON(input), expected);
});

test('extractJSON handles JSON embedded in arbitrary text', () => {
  const input = 'Here is the result: {"key": "value"} Hope this helps!';
  const expected = { key: 'value' };
  assert.deepStrictEqual(extractJSON(input), expected);
});

test('extractJSON handles complex nested JSON', () => {
  const input = '```json\n{"outer": {"inner": [1, 2, 3], "bool": true}, "null": null}\n```';
  const expected = { outer: { inner: [1, 2, 3], bool: true }, null: null };
  assert.deepStrictEqual(extractJSON(input), expected);
});

test('extractJSON throws error for malformed JSON', () => {
  const input = 'This is not JSON at all';
  assert.throws(() => {
    extractJSON(input);
  }, /Could not extract valid JSON from model response/);
});

test('extractJSON throws error for partially valid JSON that fails to parse', () => {
  const input = '{"key": "missing quote}';
  assert.throws(() => {
    extractJSON(input);
  }, /Could not extract valid JSON from model response/);
});
