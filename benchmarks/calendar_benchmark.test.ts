import { describe, test, expect } from 'vitest';
import { generateCalendarWeeks } from '../utils/calendarUtils';
import { EventData, Priority } from '../types';

const generateMockEvents = (count: number): EventData[] => {
  const events: EventData[] = [];
  const startTimestamp = new Date('2026-01-01').getTime();
  const endTimestamp = new Date('2026-12-31').getTime();

  for (let i = 0; i < count; i++) {
    const randomTime = startTimestamp + Math.random() * (endTimestamp - startTimestamp);
    const date = new Date(randomTime);
    const dateStr = date.toISOString().split('T')[0];

    events.push({
      id: `event-${i}`,
      createdAt: Date.now(),
      originalText: '',
      analysis: {
        sender: 'Sender',
        institution: 'Institution',
        eventName: `Event ${i}`,
        theme: 'General',
        description: 'Description',
        priority: Priority.Medium,
        priorityScore: 50,
        priorityReasoning: '',
        date: dateStr,
        venue: 'Venue',
        initialDeadline: '',
        finalDeadline: '',
        linkedActivities: []
      },
      contact: {
          polContact: '',
          name: '',
          email: '',
          role: '',
          organization: '',
          repRole: 'Other',
          notes: ''
      },
      followUp: {
          prepResources: '',
          briefing: '',
          commsPack: {
              remarks: '',
              representative: '',
              datePlace: '',
              additionalInfo: ''
          },
          postEventNotes: '',
          status: 'Not Relevant'
      },
    });
  }
  return events;
};

describe('generateCalendarWeeks Performance', () => {
  test('Performance with 10,000 events', () => {
    const count = 10000;
    const events = generateMockEvents(count);
    const iterations = 50;

    // Warmup
    generateCalendarWeeks(events, 2026, '2026-01-01', '2026-12-31', 'All', 'All');

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      generateCalendarWeeks(events, 2026, '2026-01-01', '2026-12-31', 'All', 'All');
    }
    const end = performance.now();
    const avgTime = (end - start) / iterations;

    console.log(`[Baseline] Events: ${count}, Iterations: ${iterations}, Avg Time: ${avgTime.toFixed(4)} ms`);

    // Simple assertion to ensure it runs
    expect(avgTime).toBeGreaterThan(0);
  });
});
