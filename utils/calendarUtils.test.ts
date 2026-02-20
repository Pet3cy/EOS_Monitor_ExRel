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

  describe('Year boundary alignment', () => {
      // 2023: Jan 1 is Sunday. Week 1 should start Mon Dec 26 2022.
      it('should start week 1 on Dec 26 2022 for year 2023 (Jan 1 is Sunday)', () => {
          const weeks = generateCalendarWeeks([], 2023, '2023-01-01', '2023-12-31', 'All', 'All');
          expect(weeks[0].number).toBe(1);
          expect(weeks[0].start.getFullYear()).toBe(2022);
          expect(weeks[0].start.getMonth()).toBe(11); // Dec
          expect(weeks[0].start.getDate()).toBe(26);
      });

      // 2024: Jan 1 is Monday. Week 1 should start Mon Jan 01 2024.
      it('should start week 1 on Jan 01 2024 for year 2024 (Jan 1 is Monday)', () => {
          const weeks = generateCalendarWeeks([], 2024, '2024-01-01', '2024-12-31', 'All', 'All');
          expect(weeks[0].number).toBe(1);
          expect(weeks[0].start.getFullYear()).toBe(2024);
          expect(weeks[0].start.getMonth()).toBe(0); // Jan
          expect(weeks[0].start.getDate()).toBe(1);
      });

      // 2025: Jan 1 is Wednesday. Week 1 should start Mon Dec 30 2024.
      it('should start week 1 on Dec 30 2024 for year 2025 (Jan 1 is Wednesday)', () => {
          const weeks = generateCalendarWeeks([], 2025, '2025-01-01', '2025-12-31', 'All', 'All');
          expect(weeks[0].number).toBe(1);
          expect(weeks[0].start.getFullYear()).toBe(2024);
          expect(weeks[0].start.getMonth()).toBe(11); // Dec
          expect(weeks[0].start.getDate()).toBe(30);
      });

       // 2026: Jan 1 is Thursday. Week 1 should start Mon Dec 29 2025.
      it('should start week 1 on Dec 29 2025 for year 2026 (Jan 1 is Thursday)', () => {
          const weeks = generateCalendarWeeks([], 2026, '2026-01-01', '2026-12-31', 'All', 'All');
          expect(weeks[0].number).toBe(1);
          expect(weeks[0].start.getFullYear()).toBe(2025);
          expect(weeks[0].start.getMonth()).toBe(11); // Dec
          expect(weeks[0].start.getDate()).toBe(29);
      });
  });

  describe('Leap year handling', () => {
      it('should handle events on Feb 29th', () => {
          const leapEvent = createEvent('leap1', '2024-02-29', Priority.High, 'Theme A');
          const weeks = generateCalendarWeeks([leapEvent], 2024, '2024-01-01', '2024-12-31', 'All', 'All');

          const weekWithEvent = weeks.find(w => w.events.find(e => e.id === 'leap1'));
          expect(weekWithEvent).toBeDefined();

          // Feb 29 2024 is Thursday.
          // Week starts Mon Feb 26, ends Sun Mar 3.
          expect(weekWithEvent?.start.getDate()).toBe(26);
          expect(weekWithEvent?.start.getMonth()).toBe(1); // Feb
          expect(weekWithEvent?.end.getDate()).toBe(3);
          expect(weekWithEvent?.end.getMonth()).toBe(2); // Mar
      });
  });

  describe('Invalid date handling', () => {
      it('should gracefully ignore events with invalid dates', () => {
           const invalidEvent = createEvent('inv1', 'invalid-date-string', Priority.High, 'Theme A');
           const validEvent = createEvent('val1', '2026-06-15', Priority.High, 'Theme A');

           const weeks = generateCalendarWeeks([invalidEvent, validEvent], 2026, '2026-01-01', '2026-12-31', 'All', 'All');

           // Should find valid event
           expect(weeks.some(w => w.events.some(e => e.id === 'val1'))).toBeTruthy();

           // Should NOT find invalid event
           expect(weeks.some(w => w.events.some(e => e.id === 'inv1'))).toBeFalsy();
      });

      it('should gracefully ignore events with empty dates', () => {
           const emptyDateEvent = createEvent('empty1', '', Priority.High, 'Theme A');
           const weeks = generateCalendarWeeks([emptyDateEvent], 2026, '2026-01-01', '2026-12-31', 'All', 'All');
           expect(weeks.some(w => w.events.some(e => e.id === 'empty1'))).toBeFalsy();
      });
  });

  describe('Days distribution', () => {
    it('should correctly distribute events into days', () => {
      const event1 = createEvent('1', '2026-06-15', Priority.High, 'Theme A'); // Monday
      const event2 = createEvent('2', '2026-06-15', Priority.High, 'Theme A'); // Monday
      const event3 = createEvent('3', '2026-06-17', Priority.High, 'Theme A'); // Wednesday

      const weeks = generateCalendarWeeks([event1, event2, event3], 2026, '2026-01-01', '2026-12-31', 'All', 'All');

      const targetWeek = weeks.find(w => w.events.some(e => e.id === '1'));
      expect(targetWeek).toBeDefined();
      expect(targetWeek?.days).toHaveLength(7);

      const monday = targetWeek?.days.find(d => d.dateString === '2026-06-15');
      expect(monday).toBeDefined();
      expect(monday?.events).toHaveLength(2);
      expect(monday?.events.map(e => e.id)).toContain('1');
      expect(monday?.events.map(e => e.id)).toContain('2');

      const wednesday = targetWeek?.days.find(d => d.dateString === '2026-06-17');
      expect(wednesday).toBeDefined();
      expect(wednesday?.events).toHaveLength(1);
      expect(wednesday?.events[0].id).toBe('3');

      const tuesday = targetWeek?.days.find(d => d.dateString === '2026-06-16');
      expect(tuesday).toBeDefined();
      expect(tuesday?.events).toHaveLength(0);
    });
  });
});
