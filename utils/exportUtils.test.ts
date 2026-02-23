import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { flattenObject, exportToCSV, exportToJSON } from './exportUtils';

describe('exportUtils', () => {
  describe('flattenObject', () => {
    it('should flatten a nested object', () => {
      const input = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3
          }
        }
      };
      const expected = {
        'a': '1',
        'b.c': '2',
        'b.d.e': '3'
      };
      expect(flattenObject(input)).toEqual(expected);
    });

    it('should handle arrays by joining with "; "', () => {
      const input = {
        a: [1, 2, 3],
        b: {
          c: ['x', 'y']
        }
      };
      const expected = {
        'a': '1; 2; 3',
        'b.c': 'x; y'
      };
      expect(flattenObject(input)).toEqual(expected);
    });

    it('should handle mixed types', () => {
        const input = {
            a: "string",
            b: 123,
            c: true,
            d: null
        };
        const expected = {
            a: "string",
            b: "123",
            c: "true",
            d: "null"
        };
        expect(flattenObject(input)).toEqual(expected);
    });
  });

  describe('exportToCSV', () => {
    let createElementSpy: any;
    let appendChildSpy: any;
    let removeChildSpy: any;
    let clickSpy: any;
    let linkMock: any;

    beforeEach(() => {
      clickSpy = vi.fn();
      linkMock = {
        setAttribute: vi.fn(),
        click: clickSpy,
        style: {}
      };
      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(linkMock as any);
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => ({}) as any);
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => ({}) as any);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create a CSV file and trigger download', () => {
      const data = {
        name: 'Test Event',
        details: {
          location: 'Remote'
        }
      };
      const fileName = 'test.csv';

      exportToCSV(data, fileName);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(linkMock.setAttribute).toHaveBeenCalledWith('download', fileName);
      expect(linkMock.setAttribute).toHaveBeenCalledWith('href', expect.stringContaining('data:text/csv;charset=utf-8,'));

      // Verify content roughly
      const href = linkMock.setAttribute.mock.calls.find((call: any[]) => call[0] === 'href')[1];
      const decodedContent = decodeURI(href.replace('data:text/csv;charset=utf-8,', ''));
      expect(decodedContent).toContain('name,details.location');
      expect(decodedContent).toContain('"Test Event","Remote"');

      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });

    it('should sanitize dangerous characters', () => {
      const data = {
        malicious: '=cmd|'
      };
      exportToCSV(data, 'unsafe.csv');

      const href = linkMock.setAttribute.mock.calls.find((call: any[]) => call[0] === 'href')[1];
      const decodedContent = decodeURI(href.replace('data:text/csv;charset=utf-8,', ''));
      expect(decodedContent).toContain('"\'=cmd|"');
    });
  });

  describe('exportToJSON', () => {
    let createElementSpy: any;
    let appendChildSpy: any;
    let removeChildSpy: any;
    let clickSpy: any;
    let linkMock: any;

    beforeEach(() => {
      clickSpy = vi.fn();
      linkMock = {
        setAttribute: vi.fn(),
        click: clickSpy,
        style: {}
      };
      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(linkMock as any);
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => ({}) as any);
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => ({}) as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create a JSON file and trigger download', () => {
        const data = { key: "value" };
        const fileName = "test.json";

        exportToJSON(data, fileName);

        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(linkMock.setAttribute).toHaveBeenCalledWith('download', fileName);
        expect(linkMock.setAttribute).toHaveBeenCalledWith('href', expect.stringContaining('data:application/json;charset=utf-8,'));

        const href = linkMock.setAttribute.mock.calls.find((call: any[]) => call[0] === 'href')[1];
        const content = decodeURIComponent(href.replace('data:application/json;charset=utf-8,', ''));
        expect(JSON.parse(content)).toEqual(data);

        expect(appendChildSpy).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();
        expect(removeChildSpy).toHaveBeenCalled();
    });
  });
});
