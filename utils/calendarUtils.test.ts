import { describe, it, expect } from 'vitest';
import { generateCalendarWeeks } from './calendarUtils';
import { EventData, Priority } from '../types';

// Mock EventData helper
const createEvent = (id: string, date: string, priority: Priority, theme: string): EventData => ({
  id,
  createdAt: Date.now(),
  originalText: '',
  analysis: {
    sender: '',
    institution: '',
    eventName: `Event ${id}`,
    theme,
    description: '',
    priority,
    priorityScore: 0,
    priorityReasoning: '',
    date,
    venue: '',
    initialDeadline: '',
    finalDeadline: '',
    linkedActivities: [],
  },
  contact: {
    polContact: '',
    name: '',
    email: '',
    role: '',
    organization: '',
    repRole: 'Participant',
    notes: '',
  },
  followUp: {
    prepResources: '',
    briefing: '',
    commsPack: {
      remarks: '',
      representative: '',
      datePlace: '',
      additionalInfo: '',
    },
    postEventNotes: '',
    status: 'To Respond',
  },
});

describe('generateCalendarWeeks', () => {
  const year = 2026;
  const startDate = '2026-01-01';
  const endDate = '2026-12-31';

  it('should generate weeks for the entire year when filters are default', () => {
    const events: EventData[] = [];
    const weeks = generateCalendarWeeks(events, year, startDate, endDate, 'All', 'All');

    expect(weeks.length).toBeGreaterThan(50); // Should be 52 or 53
    expect(weeks[0].number).toBe(1);
  });

  it('should filter weeks by date range', () => {
    const events: EventData[] = [];
    // January only
    const weeks = generateCalendarWeeks(events, year, '2026-01-01', '2026-01-31', 'All', 'All');

    expect(weeks.length).toBeGreaterThan(0);
    expect(weeks.length).toBeLessThan(10);

    const lastWeek = weeks[weeks.length - 1];
    expect(lastWeek.start.getMonth()).toBeLessThanOrEqual(1); // Jan or Feb (if overlap)
  });

  it('should filter events by priority', () => {
    const eventHigh = createEvent('1', '2026-06-15', Priority.High, 'Theme A');
    const eventLow = createEvent('2', '2026-06-16', Priority.Low, 'Theme A');

    const events = [eventHigh, eventLow];

    const weeks = generateCalendarWeeks(events, year, startDate, endDate, Priority.High, 'All');

    // Should find the week containing June 15
    const weekWithEvents = weeks.find(w => w.events.length > 0);
    expect(weekWithEvents).toBeDefined();
    expect(weekWithEvents?.events).toHaveLength(1);
    expect(weekWithEvents?.events[0].id).toBe('1');
  });

  it('should filter events by theme', () => {
    const eventA = createEvent('1', '2026-06-15', Priority.High, 'Theme A');
    const eventB = createEvent('2', '2026-06-16', Priority.High, 'Theme B');

    const events = [eventA, eventB];

    const weeks = generateCalendarWeeks(events, year, startDate, endDate, 'All', 'Theme A');

    const weekWithEvents = weeks.find(w => w.events.length > 0);
    expect(weekWithEvents).toBeDefined();
    expect(weekWithEvents?.events).toHaveLength(1);
    expect(weekWithEvents?.events[0].id).toBe('1');
  });

  it('should exclude weeks with no matching events when priority filter is active', () => {
    const eventLow = createEvent('1', '2026-06-15', Priority.Low, 'Theme A');
    const events = [eventLow];

    // Filter by High priority. No events match.

    const weeks = generateCalendarWeeks(events, year, startDate, endDate, Priority.High, 'All');

    // Should return empty array because no weeks have High priority events,
    // AND the code skips empty weeks when filter is active.
    expect(weeks).toHaveLength(0);
  });

  it('should return empty array for invalid date range', () => {
    const events: EventData[] = [];
    const weeks = generateCalendarWeeks(events, year, 'invalid', 'invalid', 'All', 'All');
    expect(weeks).toEqual([]);
  });

  it('should include events on the edge of the week', () => {
     // Week starts on Monday. Ends on Sunday.
     // Jan 1 2026 is Thursday. First Monday is Dec 29, 2025.
     // Week 1: Dec 29 - Jan 4.
     const eventSunday = createEvent('1', '2026-01-04', Priority.High, 'Theme A');
     const eventNextMonday = createEvent('2', '2026-01-05', Priority.High, 'Theme A');

     const weeks = generateCalendarWeeks([eventSunday, eventNextMonday], year, startDate, endDate, 'All', 'All');

     const week1 = weeks.find(w => w.number === 1);
     const week2 = weeks.find(w => w.number === 2);

     expect(week1?.events.find(e => e.id === '1')).toBeDefined();
     expect(week1?.events.find(e => e.id === '2')).toBeUndefined();

     expect(week2?.events.find(e => e.id === '2')).toBeDefined();
  });
});
