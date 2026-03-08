import { EventData, Contact } from '../types';

/**
 * CSV Service for exporting event data and contacts to CSV format
 */

/**
 * Escape CSV field values by wrapping in quotes and escaping internal quotes
 */
export function escapeCSVField(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert array to CSV string
 */
export function arrayToCSV(arr: string[]): string {
  return arr.join('; ');
}

/**
 * Export events to CSV format
 */
export function exportEventsToCSV(events: EventData[]): string {
  const headers = [
    'ID',
    'Created At',
    'Event Name',
    'Institution',
    'Date',
    'Time',
    'Venue',
    'Priority',
    'Priority Score',
    'Theme',
    'Description',
    'Status',
    'Contact Name',
    'Contact Email',
    'Contact Role',
    'Rep Role',
    'Deadline',
    'Linked Activities',
    'Registration Link',
    'Programme Link'
  ];

  const rows = events.map(event => [
    escapeCSVField(event.id),
    escapeCSVField(new Date(event.createdAt).toISOString()),
    escapeCSVField(event.analysis.eventName),
    escapeCSVField(event.analysis.institution),
    escapeCSVField(event.analysis.date),
    escapeCSVField(event.analysis.time),
    escapeCSVField(event.analysis.venue),
    escapeCSVField(event.analysis.priority),
    escapeCSVField(event.analysis.priorityScore),
    escapeCSVField(event.analysis.theme),
    escapeCSVField(event.analysis.description),
    escapeCSVField(event.followUp.status),
    escapeCSVField(event.contact.name),
    escapeCSVField(event.contact.email),
    escapeCSVField(event.contact.role),
    escapeCSVField(event.contact.repRole),
    escapeCSVField(event.analysis.finalDeadline),
    escapeCSVField(arrayToCSV(event.analysis.linkedActivities)),
    escapeCSVField(event.analysis.registrationLink),
    escapeCSVField(event.analysis.programmeLink)
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Export contacts to CSV format
 */
export function exportContactsToCSV(contacts: Contact[]): string {
  const headers = [
    'ID',
    'Name',
    'Email',
    'Role',
    'Organization',
    'Notes'
  ];

  const rows = contacts.map(contact => [
    escapeCSVField(contact.id),
    escapeCSVField(contact.name),
    escapeCSVField(contact.email),
    escapeCSVField(contact.role),
    escapeCSVField(contact.organization),
    escapeCSVField(contact.notes)
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Download CSV file in the browser
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV string to array of objects
 */
export function parseCSV(csvContent: string): Record<string, string>[] {
  if (!csvContent.trim()) return [];

  // Split into lines while respecting quoted fields
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of csvContent) {
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === '\n' && !inQuotes) {
      if (current.trim()) lines.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current);

  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
      data.push(obj);
    }
  }

  return data;
}

/**
 * Parse a single CSV line handling quotes and commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current);

  return result;
}