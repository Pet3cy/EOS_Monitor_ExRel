import { test } from 'node:test';
import * as assert from 'node:assert';
import { extractJSON } from './gemmaService.ts';

test('extractJSON: parses plain JSON object', () => {
  const input = '{"hello": "world"}';
  const result = extractJSON(input);
  assert.deepStrictEqual(result, { hello: 'world' });
});

test('extractJSON: parses plain JSON array', () => {
  const input = '[{"hello": "world"}]';
  const result = extractJSON(input);
  assert.deepStrictEqual(result, [{ hello: 'world' }]);
});

test('extractJSON: parses JSON from markdown code block without language tag', () => {
  const input = '```\n{"hello": "world"}\n```';
  const result = extractJSON(input);
  assert.deepStrictEqual(result, { hello: 'world' });
});

test('extractJSON: parses JSON from markdown code block with language tag', () => {
  const input = '```json\n{"hello": "world"}\n```';
  const result = extractJSON(input);
  assert.deepStrictEqual(result, { hello: 'world' });
});

test('extractJSON: parses JSON embedded in arbitrary text', () => {
  const input = 'Here is your data: {"hello": "world"}\nHave a nice day!';
  const result = extractJSON(input);
  assert.deepStrictEqual(result, { hello: 'world' });
});

test('extractJSON: parses JSON array embedded in arbitrary text', () => {
  const input = 'Here is your data:\n[{"hello": "world"}]\nEnd of data.';
  const result = extractJSON(input);
  assert.deepStrictEqual(result, [{ hello: 'world' }]);
});

test('extractJSON: parses nested JSON objects properly when embedded', () => {
  const input = 'Data: {"outer": {"inner": 1}}';
  const result = extractJSON(input);
  assert.deepStrictEqual(result, { outer: { inner: 1 } });
});

test('extractJSON: parses array containing object properly when embedded', () => {
  const input = 'Data: [{"outer": [1, 2]}]';
  const result = extractJSON(input);
  assert.deepStrictEqual(result, [{ outer: [1, 2] }]);
});

test('extractJSON: throws error on invalid JSON without brackets', () => {
  const input = 'This is just some text with no valid JSON brackets at all.';
  assert.throws(
    () => extractJSON(input),
    /Could not extract valid JSON from model response/
  );
});

test('extractJSON: throws error on malformed JSON structure', () => {
  const input = '```json\n{"hello": "world"\n```'; // missing closing brace in json string
  assert.throws(
    () => extractJSON(input),
    /Could not extract valid JSON from model response/
  );
});

test('extractJSON: allows empty JSON objects or arrays if explicitly requested', () => {
  const input1 = '{}';
  const result1 = extractJSON(input1);
  assert.deepStrictEqual(result1, {});

  const input2 = '[]';
  const result2 = extractJSON(input2);
  assert.deepStrictEqual(result2, []);
});

test('extractJSON: allows empty JSON objects or arrays with whitespace', () => {
  const input1 = ' {\n  } ';
  const result1 = extractJSON(input1);
  assert.deepStrictEqual(result1, {});

  const input2 = ' [\n  ] ';
  const result2 = extractJSON(input2);
  assert.deepStrictEqual(result2, []);
});

test('extractJSON: allows empty brackets embedded within text', () => {
  const input1 = 'Here is some text with {} empty brackets.';
  const result1 = extractJSON(input1);
  assert.deepStrictEqual(result1, {});

  const input2 = 'Here is some text with [] empty brackets.';
  const result2 = extractJSON(input2);
  assert.deepStrictEqual(result2, []);
});
