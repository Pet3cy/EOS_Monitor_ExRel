import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  escapeCSVField,
  arrayToCSV,
  exportEventsToCSV,
  exportContactsToCSV,
  downloadCSV,
  parseCSV
} from './csvService';
import { EventData, Contact, Priority } from '../types';

describe('csvService', () => {
  describe('escapeCSVField', () => {
    it('should return empty string for null or undefined', () => {
      expect(escapeCSVField(null)).toBe('');
      expect(escapeCSVField(undefined)).toBe('');
    });

    it('should convert numbers to strings', () => {
      expect(escapeCSVField(42)).toBe('42');
      expect(escapeCSVField(0)).toBe('0');
    });

    it('should escape fields with commas', () => {
      expect(escapeCSVField('hello, world')).toBe('"hello, world"');
    });

    it('should escape fields with quotes', () => {
      expect(escapeCSVField('say "hello"')).toBe('"say ""hello"""');
    });

    it('should escape fields with newlines', () => {
      expect(escapeCSVField('line1\nline2')).toBe('"line1\nline2"');
    });

    it('should not escape simple strings', () => {
      expect(escapeCSVField('simple')).toBe('simple');
    });
  });

  describe('arrayToCSV', () => {
    it('should join array elements with semicolons', () => {
      expect(arrayToCSV(['a', 'b', 'c'])).toBe('a; b; c');
    });

    it('should handle empty arrays', () => {
      expect(arrayToCSV([])).toBe('');
    });

    it('should handle single element', () => {
      expect(arrayToCSV(['single'])).toBe('single');
    });
  });

  describe('exportEventsToCSV', () => {
    it('should export events to CSV format', () => {
      const events: EventData[] = [
        {
          id: 'e1',
          createdAt: 1640995200000, // 2022-01-01
          originalText: 'Event text',
          analysis: {
            sender: 'John Doe',
            institution: 'OBESSU',
            eventName: 'Test Event',
            theme: 'Education',
            description: 'A test event',
            priority: Priority.High,
            priorityScore: 90,
            priorityReasoning: 'Important',
            date: '2022-02-01',
            time: '14:00',
            venue: 'Online',
            initialDeadline: '2022-01-25',
            finalDeadline: '2022-01-30',
            linkedActivities: ['Activity 1', 'Activity 2']
          },
          contact: {
            contactId: 'c1',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'Coordinator',
            organization: 'OBESSU',
            repRole: 'Speaker',
            polContact: 'Policy Contact',
            notes: 'Notes'
          },
          followUp: {
            briefing: 'Brief',
            postEventNotes: 'Notes',
            status: 'To Respond',
            prepResources: 'Resources',
            commsPack: {
              remarks: 'Remarks',
              representative: 'Rep',
              datePlace: 'Date Place',
              additionalInfo: 'Info'
            }
          }
        }
      ];

      const csv = exportEventsToCSV(events);
      expect(csv).toContain('ID,Created At,Event Name');
      expect(csv).toContain('e1');
      expect(csv).toContain('Test Event');
      expect(csv).toContain('OBESSU');
      expect(csv).toContain('Jane Smith');
    });

    it('should handle empty events array', () => {
      const csv = exportEventsToCSV([]);
      expect(csv).toContain('ID,Created At,Event Name');
      expect(csv.split('\n').length).toBe(1); // Only headers
    });

    it('should escape special characters in event data', () => {
      const events: EventData[] = [
        {
          id: 'e1',
          createdAt: Date.now(),
          originalText: '',
          analysis: {
            sender: 'Sender',
            institution: 'Test, Inc',
            eventName: 'Event "Special"',
            theme: 'Theme',
            description: 'Desc\nWith\nNewlines',
            priority: Priority.Medium,
            priorityScore: 50,
            priorityReasoning: 'Reason',
            date: '2022-02-01',
            venue: 'Venue',
            initialDeadline: '',
            finalDeadline: '',
            linkedActivities: []
          },
          contact: {
            name: 'Name',
            email: 'email@test.com',
            role: 'Role',
            organization: 'Org',
            repRole: 'Participant',
            polContact: '',
            notes: ''
          },
          followUp: {
            briefing: '',
            postEventNotes: '',
            status: 'To Respond',
            prepResources: '',
            commsPack: {
              remarks: '',
              representative: '',
              datePlace: '',
              additionalInfo: ''
            }
          }
        }
      ];

      const csv = exportEventsToCSV(events);
      expect(csv).toContain('"Test, Inc"');
      expect(csv).toContain('"Event ""Special"""');
      expect(csv).toContain('"Desc\nWith\nNewlines"');
    });
  });

  describe('exportContactsToCSV', () => {
    it('should export contacts to CSV format', () => {
      const contacts: Contact[] = [
        {
          id: 'c1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'Manager',
          organization: 'OBESSU',
          notes: 'Important contact'
        },
        {
          id: 'c2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'Coordinator',
          organization: 'EU Commission',
          notes: ''
        }
      ];

      const csv = exportContactsToCSV(contacts);
      expect(csv).toContain('ID,Name,Email,Role,Organization,Notes');
      expect(csv).toContain('John Doe');
      expect(csv).toContain('john@example.com');
      expect(csv).toContain('Jane Smith');
    });

    it('should handle empty contacts array', () => {
      const csv = exportContactsToCSV([]);
      expect(csv).toContain('ID,Name,Email');
      expect(csv.split('\n').length).toBe(1); // Only headers
    });
  });

  describe('downloadCSV', () => {
    beforeEach(() => {
      // Mock document methods
      document.createElement = vi.fn().mockReturnValue({
        setAttribute: vi.fn(),
        click: vi.fn(),
        style: {}
      });
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:url');
      global.URL.revokeObjectURL = vi.fn();
    });

    it('should create and trigger download', () => {
      const csvContent = 'ID,Name\n1,Test';
      const filename = 'test.csv';

      downloadCSV(csvContent, filename);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('parseCSV', () => {
    it('should parse simple CSV', () => {
      const csv = 'Name,Email\nJohn,john@example.com\nJane,jane@example.com';
      const result = parseCSV(csv);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ Name: 'John', Email: 'john@example.com' });
      expect(result[1]).toEqual({ Name: 'Jane', Email: 'jane@example.com' });
    });

    it('should handle quoted fields', () => {
      const csv = 'Name,Description\nJohn,"A, B, C"\nJane,"Quote ""test"""';
      const result = parseCSV(csv);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ Name: 'John', Description: 'A, B, C' });
      expect(result[1]).toEqual({ Name: 'Jane', Description: 'Quote "test"' });
    });

    it('should handle empty CSV', () => {
      const result = parseCSV('');
      expect(result).toEqual([]);
    });

    it('should handle CSV with only headers', () => {
      const csv = 'Name,Email';
      const result = parseCSV(csv);
      expect(result).toEqual([]);
    });

    it('should skip malformed rows', () => {
      const csv = 'Name,Email\nJohn,john@example.com\nInvalid\nJane,jane@example.com';
      const result = parseCSV(csv);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ Name: 'John', Email: 'john@example.com' });
      expect(result[1]).toEqual({ Name: 'Jane', Email: 'jane@example.com' });
    });
  });

  describe('edge cases', () => {
    it('should handle CSV with newlines in quoted fields', () => {
      const csv = 'Name,Notes\nJohn,"Line 1\nLine 2"';
      const result = parseCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0].Notes).toContain('\n');
    });

    it('should handle consecutive commas', () => {
      const csv = 'A,B,C\n1,,3';
      const result = parseCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ A: '1', B: '', C: '3' });
    });
  });
});