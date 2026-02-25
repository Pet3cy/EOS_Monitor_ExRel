import { test, describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { flattenObject, generateCSVContent } from './csvService';

describe('csvService', () => {
    describe('flattenObject', () => {
        it('should flatten nested objects', () => {
            const data = {
                a: 1,
                b: { c: 2, d: 3 },
                e: { f: { g: 4 } }
            };
            const expected = {
                'a': '1',
                'b.c': '2',
                'b.d': '3',
                'e.f.g': '4'
            };
            assert.deepEqual(flattenObject(data), expected);
        });

        it('should handle arrays by joining with semicolons', () => {
            const data = {
                a: [1, 2, 3],
                b: ['x', 'y']
            };
            const expected = {
                'a': '1; 2; 3',
                'b': 'x; y'
            };
            assert.deepEqual(flattenObject(data), expected);
        });

        it('should handle primitives', () => {
            const data = { a: 'hello', b: 42, c: true };
            const expected = { a: 'hello', b: '42', c: 'true' };
            assert.deepEqual(flattenObject(data), expected);
        });
    });

    describe('generateCSVContent', () => {
        it('should generate valid CSV content', () => {
            const data = {
                id: 1,
                name: 'Test',
                details: {
                    info: 'Something "quoted"'
                }
            };
            const csv = generateCSVContent(data);

            // Check headers
            assert.ok(csv.includes('id'));
            assert.ok(csv.includes('name'));
            assert.ok(csv.includes('details.info'));

            // Check values with escaping
            assert.ok(csv.includes('"1"'));
            assert.ok(csv.includes('"Test"'));
            assert.ok(csv.includes('"Something ""quoted"""'));
        });
    });
});
