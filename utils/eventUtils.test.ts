import { describe, it, expect } from 'vitest';
import { deepCopyEvent } from './eventUtils';
import { EventData, Priority } from '../types';

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
