import { describe, it, expect } from 'vitest';
import { aggregateStakeholders } from './stakeholderUtils';
import { Priority } from '../types';
import type { EventData } from '../types';

const mockEvent = (overrides: any = {}): EventData => ({
  id: '1',
  createdAt: Date.now(),
  originalText: '',
  analysis: {
    institution: 'Test Inst',
    theme: 'Test Theme',
    linkedActivities: ['Activity 1'],
    eventName: 'Test Event',
    sender: 'Sender',
    description: 'Desc',
    priority: Priority.Medium,
    priorityScore: 50,
    priorityReasoning: 'Reason',
    date: '2023-01-01',
    venue: 'Venue',
    initialDeadline: '',
    finalDeadline: '',
    ...overrides.analysis
  },
  contact: {
    polContact: '',
    name: '',
    email: '',
    role: '',
    organization: '',
    repRole: 'Participant',
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
    status: 'To Respond',
    ...overrides.followUp
  }
});

describe('aggregateStakeholders', () => {
  it('should normalize institution names', () => {
    const events = [
      mockEvent({ analysis: { institution: '  Trimmed Inst  ' } }),
      mockEvent({ id: '2', analysis: { institution: '' } }),
    ];

    const result = aggregateStakeholders(events as EventData[]);

    expect(result.length).toBe(2);
    expect(result.find(s => s.name === 'Trimmed Inst')).toBeTruthy();
    expect(result.find(s => s.name === 'Unknown Stakeholder')).toBeTruthy();
  });

  it('should group events by stakeholder', () => {
    const events = [
      mockEvent({ analysis: { institution: 'A' } }),
      mockEvent({ id: '2', analysis: { institution: 'A' } }),
      mockEvent({ id: '3', analysis: { institution: 'B' } }),
    ];

    const result = aggregateStakeholders(events as EventData[]);

    expect(result.length).toBe(2);
    const stakeholderA = result.find(s => s.name === 'A');
    expect(stakeholderA?.allEvents.length).toBe(2);
    const stakeholderB = result.find(s => s.name === 'B');
    expect(stakeholderB?.allEvents.length).toBe(1);
  });

  it('should identify completed events', () => {
    const events = [
      mockEvent({ followUp: { status: 'Completed - Follow Up' } }),
      mockEvent({ id: '2', followUp: { status: 'To Respond' } }),
    ];

    const result = aggregateStakeholders(events as EventData[]);
    const stakeholder = result[0];

    expect(stakeholder.allEvents.length).toBe(2);
    expect(stakeholder.completedEvents.length).toBe(1);
    expect(stakeholder.completedEvents[0].followUp.status).toBe('Completed - Follow Up');
  });

  it('should aggregate unique themes and papers', () => {
    const events = [
      mockEvent({ analysis: { theme: 'Theme 1', linkedActivities: ['Paper 1'] } }),
      mockEvent({ id: '2', analysis: { theme: 'Theme 1', linkedActivities: ['Paper 1', 'Paper 2'] } }),
    ];

    const result = aggregateStakeholders(events as EventData[]);
    const stakeholder = result[0];

    expect(stakeholder.themes).toEqual(['Theme 1']);
    // Papers might be in any order since they come from a Set
    expect(stakeholder.papers.length).toBe(2);
    expect(stakeholder.papers.includes('Paper 1')).toBeTruthy();
    expect(stakeholder.papers.includes('Paper 2')).toBeTruthy();
  });

  it('should sort by total events', () => {
    const events = [
      mockEvent({ analysis: { institution: 'Least Active' } }),
      mockEvent({ id: '2', analysis: { institution: 'Most Active' } }),
      mockEvent({ id: '3', analysis: { institution: 'Most Active' } }),
    ];

    const result = aggregateStakeholders(events as EventData[]);

    expect(result[0].name).toBe('Most Active');
    expect(result[1].name).toBe('Least Active');
  });

  it('should handle empty input', () => {
    const result = aggregateStakeholders([]);
    expect(result.length).toBe(0);
  });
});
