import test from 'node:test';
import assert from 'node:assert/strict';
import { flattenObject } from './csvService.js';

test('flattenObject flattens nested objects', () => {
  const input = {
    name: 'Event',
    analysis: {
      priority: 'High',
      score: 100
    },
    tags: ['tag1', 'tag2']
  };

  const expected = {
    'name': 'Event',
    'analysis.priority': 'High',
    'analysis.score': '100',
    'tags': 'tag1; tag2'
  };

  const actual = flattenObject(input);
  assert.deepEqual(actual, expected);
});

test('flattenObject handles null and empty values', () => {
  const input = {
    a: null,
    b: '',
    c: {}
  };

  const expected = {
    'a': 'null',
    'b': '',
  };

  const actual = flattenObject(input);
  assert.deepEqual(actual, expected);
});
