import { describe, it, expect } from 'vitest';
import { flattenObject, convertToCSV } from './exportUtils';
import { Priority, EventData } from '../types';

describe('exportUtils', () => {
  describe('flattenObject', () => {
    it('should flatten a simple object', () => {
      const input = { a: 1, b: 'test' };
      const expected = { a: '1', b: 'test' };
      expect(flattenObject(input)).toEqual(expected);
    });

    it('should flatten nested objects', () => {
      const input = { a: 1, b: { c: 2, d: { e: 3 } } };
      const expected = { a: '1', 'b.c': '2', 'b.d.e': '3' };
      expect(flattenObject(input)).toEqual(expected);
    });

    it('should join arrays with semicolon', () => {
      const input = { a: [1, 2, 3], b: { c: ['x', 'y'] } };
      const expected = { a: '1; 2; 3', 'b.c': 'x; y' };
      expect(flattenObject(input)).toEqual(expected);
    });

    it('should handle null and undefined', () => {
      const input = { a: null, b: undefined };
      const expected = { a: 'null', b: 'undefined' };
      expect(flattenObject(input)).toEqual(expected);
    });
  });

  describe('convertToCSV', () => {
    const mockEvent: EventData = {
      id: '1',
      createdAt: 123456789,
      originalText: 'original',
      analysis: {
        sender: 'Sender',
        institution: 'Inst',
        eventName: 'Test Event',
        theme: 'Theme',
        description: 'Desc',
        priority: Priority.High,
        priorityScore: 90,
        priorityReasoning: 'Reason',
        date: '2023-10-10',
        venue: 'Venue',
        initialDeadline: '2023-10-01',
        finalDeadline: '2023-10-05',
        linkedActivities: ['Act 1', 'Act 2'],
      },
      contact: {
        polContact: 'Pol',
        name: 'Contact Name',
        email: 'email@example.com',
        role: 'Role',
        organization: 'Org',
        repRole: 'Speaker',
        notes: 'Notes'
      },
      followUp: {
        prepResources: 'Resources',
        briefing: 'Briefing',
        commsPack: {
          remarks: 'Remarks',
          representative: 'Rep',
          datePlace: 'DatePlace',
          additionalInfo: 'Info'
        },
        postEventNotes: 'Post Notes',
        status: 'To Respond'
      }
    };

    it('should convert event data to CSV string with headers and values', () => {
      const csv = convertToCSV(mockEvent);
      const lines = csv.split('\n');
      expect(lines.length).toBe(2);

      const headers = lines[0].split(',');
      expect(headers).toContain('analysis.eventName');
      expect(headers).toContain('analysis.priority');
      expect(headers).toContain('analysis.linkedActivities');
      expect(headers).toContain('contact.name');

      const values = lines[1].split(',');
      // Note: values are quoted
      expect(values).toContain('"Test Event"');
      expect(values).toContain('"High"');
      expect(values).toContain('"Act 1; Act 2"');
      expect(values).toContain('"Contact Name"');
    });

    it('should sanitize dangerous characters', () => {
      const dangerousEvent = {
        ...mockEvent,
        analysis: {
          ...mockEvent.analysis,
          eventName: '=Dangerous',
          description: '+More'
        }
      };
      const csv = convertToCSV(dangerousEvent);
      expect(csv).toContain('"' + "'=Dangerous" + '"');
      expect(csv).toContain('"' + "'+More" + '"');
    });

    it('should escape double quotes', () => {
      const quotedEvent = {
        ...mockEvent,
        analysis: {
          ...mockEvent.analysis,
          eventName: 'Event with "quotes"'
        }
      };
      const csv = convertToCSV(quotedEvent);
      expect(csv).toContain('"Event with ""quotes"""');
    });
  });
});
