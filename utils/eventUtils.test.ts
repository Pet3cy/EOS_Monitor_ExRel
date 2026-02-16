import { describe, it, expect } from 'vitest';
import { deepCopyEvent, filterEvents, isCompletedOrArchived } from './eventUtils';
import { EventData, Priority, ViewMode } from '../types';

describe('deepCopyEvent', () => {
  const mockEvent: EventData = {
    id: 'e1',
    createdAt: 1700000000000,
    originalText: 'Test Event',
    analysis: {
      sender: 'Sender',
      institution: 'Institution',
      eventName: 'Event Name',
      theme: 'Theme',
      description: 'Description',
      priority: Priority.High,
      priorityScore: 90,
      priorityReasoning: 'Reasoning',
      date: '2026-02-10',
      venue: 'Online',
      initialDeadline: '2026-02-05',
      finalDeadline: '2026-02-09',
      linkedActivities: ['Activity 1', 'Activity 2'],
    },
    contact: {
      contactId: 'c1',
      name: 'Contact Name',
      email: 'contact@example.com',
      role: 'Role',
      organization: 'Org',
      repRole: 'Speaker',
      polContact: 'Pol Contact',
      notes: 'Notes'
    },
    followUp: {
      briefing: 'Briefing',
      prepResources: 'Resources',
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

  it('should create a deep copy of the event', () => {
    const copy = deepCopyEvent(mockEvent);

    // Check value equality
    expect(copy).toEqual(mockEvent);

    // Check reference inequality for nested objects
    expect(copy).not.toBe(mockEvent);
    expect(copy.analysis).not.toBe(mockEvent.analysis);
    expect(copy.analysis.linkedActivities).not.toBe(mockEvent.analysis.linkedActivities);
    expect(copy.contact).not.toBe(mockEvent.contact);
    expect(copy.followUp).not.toBe(mockEvent.followUp);
    expect(copy.followUp.commsPack).not.toBe(mockEvent.followUp.commsPack);
  });

  it('should handle undefined linkedActivities gracefully', () => {
    const eventWithoutLinkedActivities = {
      ...mockEvent,
      analysis: {
        ...mockEvent.analysis,
        linkedActivities: undefined as any
      }
    };

    const copy = deepCopyEvent(eventWithoutLinkedActivities);
    expect(copy.analysis.linkedActivities).toEqual([]);
    expect(Array.isArray(copy.analysis.linkedActivities)).toBe(true);
  });

  it('should not mutate the original object when modifying the copy', () => {
    const copy = deepCopyEvent(mockEvent);

    copy.analysis.eventName = 'Modified Name';
    copy.analysis.linkedActivities.push('New Activity');
    copy.contact.name = 'Modified Contact';
    copy.followUp.status = 'Completed - No follow up';
    copy.followUp.commsPack.remarks = 'Modified Remarks';

    expect(mockEvent.analysis.eventName).toBe('Event Name');
    expect(mockEvent.analysis.linkedActivities).toHaveLength(2);
    expect(mockEvent.contact.name).toBe('Contact Name');
    expect(mockEvent.followUp.status).toBe('To Respond');
    expect(mockEvent.followUp.commsPack.remarks).toBe('Remarks');
  });
});

describe('isCompletedOrArchived', () => {
  it('should return true for status starting with "Completed"', () => {
    expect(isCompletedOrArchived('Completed - No follow up')).toBe(true);
    expect(isCompletedOrArchived('Completed - Follow Up')).toBe(true);
  });

  it('should return true for status "Not Relevant"', () => {
    expect(isCompletedOrArchived('Not Relevant')).toBe(true);
  });

  it('should return false for other statuses', () => {
    expect(isCompletedOrArchived('To Respond')).toBe(false);
    expect(isCompletedOrArchived('Prep ready')).toBe(false);
  });
});

describe('filterEvents', () => {
  const createMockEvent = (id: string, name: string, institution: string, status: any): EventData => ({
    id,
    createdAt: 1700000000000,
    originalText: '',
    analysis: {
      sender: 'Sender',
      institution,
      eventName: name,
      theme: 'Theme',
      description: 'Description',
      priority: Priority.High,
      priorityScore: 90,
      priorityReasoning: 'Reasoning',
      date: '2026-02-10',
      venue: 'Online',
      initialDeadline: '2026-02-05',
      finalDeadline: '2026-02-09',
      linkedActivities: [],
    },
    contact: {
      contactId: 'c1',
      name: 'Contact Name',
      email: 'contact@example.com',
      role: 'Role',
      organization: 'Org',
      repRole: 'Speaker',
      polContact: 'Pol Contact',
      notes: 'Notes'
    },
    followUp: {
      briefing: 'Briefing',
      prepResources: 'Resources',
      commsPack: {
        remarks: 'Remarks',
        representative: 'Rep',
        datePlace: 'DatePlace',
        additionalInfo: 'Info'
      },
      postEventNotes: 'Post Notes',
      status
    }
  });

  const events = [
    createMockEvent('1', 'Alpha Conference', 'Tech Corp', 'To Respond'),
    createMockEvent('2', 'Beta Workshop', 'Edu Org', 'Completed - No follow up'),
    createMockEvent('3', 'Gamma Summit', 'Tech Corp', 'Not Relevant'),
    createMockEvent('4', 'Delta Meeting', 'Gov Body', 'Prep ready'),
  ];

  it('should filter by search term (name)', () => {
    const results = filterEvents(events, 'Alpha', 'upcoming');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  it('should filter by search term (institution)', () => {
    const results = filterEvents(events, 'Tech', 'upcoming');
    expect(results).toHaveLength(1); // '1' is 'To Respond' (upcoming), '3' is 'Not Relevant' (archived)
    expect(results[0].id).toBe('1');
  });

  it('should be case insensitive', () => {
    const results = filterEvents(events, 'alpha', 'upcoming');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  it('should filter by viewMode "upcoming" (excludes completed/archived)', () => {
    const results = filterEvents(events, '', 'upcoming');
    expect(results).toHaveLength(2); // '1' and '4' are upcoming
    expect(results.map(e => e.id).sort()).toEqual(['1', '4']);
  });

  it('should filter by viewMode "past" (only completed/archived)', () => {
    const results = filterEvents(events, '', 'past');
    expect(results).toHaveLength(2); // '2' and '3' are past
    expect(results.map(e => e.id).sort()).toEqual(['2', '3']);
  });

  it('should include all events for other view modes', () => {
    expect(filterEvents(events, '', 'calendar')).toHaveLength(4);
    expect(filterEvents(events, '', 'overview')).toHaveLength(4);
    expect(filterEvents(events, '', 'contacts')).toHaveLength(4);
  });

  it('should combine search term and viewMode', () => {
    // Search "Tech" in "past" view -> should match '3' (Tech Corp, Not Relevant)
    const results = filterEvents(events, 'Tech', 'past');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('3');
  });

  it('should return empty list if no match found', () => {
    const results = filterEvents(events, 'Zeta', 'upcoming');
    expect(results).toHaveLength(0);
  });
});
