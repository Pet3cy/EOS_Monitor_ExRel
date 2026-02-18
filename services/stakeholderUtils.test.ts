import { describe, it, expect } from 'vitest';
import { aggregateStakeholders } from './stakeholderUtils';
import { Priority, type EventData, type AnalysisResult, type ContactDetails, type FollowUpDetails } from '../types';

// Helper to create a partial event with defaults
const mockEvent = (overrides: any = {}): EventData => {
  const defaultAnalysis: AnalysisResult = {
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
    registrationLink: '',
    programmeLink: '',
    senderEmail: '',
    subject: ''
  };

  const defaultContact: ContactDetails = {
    polContact: '',
    name: '',
    email: '',
    role: '',
    organization: '',
    repRole: 'Participant',
    notes: '',
    contactId: ''
  };

  const defaultFollowUp: FollowUpDetails = {
    prepResources: '',
    briefing: '',
    commsPack: {
      remarks: '',
      representative: '',
      datePlace: '',
      additionalInfo: '',
      posterData: ''
    },
    postEventNotes: '',
    status: 'To Respond'
  };

  const { analysis, contact, followUp, ...restOverrides } = overrides;

  return {
    id: '1',
    createdAt: Date.now(),
    originalText: '',
    analysis: { ...defaultAnalysis, ...(analysis || {}) },
    contact: { ...defaultContact, ...(contact || {}) },
    followUp: { ...defaultFollowUp, ...(followUp || {}) },
    ...restOverrides
  };
};

describe('aggregateStakeholders', () => {
  it('should normalize institution names by trimming', () => {
    const events = [
      mockEvent({ analysis: { institution: '  Trimmed Inst  ' } }),
      mockEvent({ id: '2', analysis: { institution: '' } }),
    ];

    const result = aggregateStakeholders(events);

    expect(result.length).toBe(2);
    expect(result.find(s => s.name === 'Trimmed Inst')).toBeTruthy();
    expect(result.find(s => s.name === 'Unknown Stakeholder')).toBeTruthy();
  });

  it('should treat institution names case-sensitively (current behavior)', () => {
    const events = [
      mockEvent({ id: '1', analysis: { institution: 'Inst' } }),
      mockEvent({ id: '2', analysis: { institution: 'inst' } }),
    ];

    const result = aggregateStakeholders(events);
    expect(result.length).toBe(2);
    expect(result.map(s => s.name).sort()).toEqual(['Inst', 'inst']);
  });

  it('should group events by stakeholder', () => {
    const events = [
      mockEvent({ id: '1', analysis: { institution: 'A' } }),
      mockEvent({ id: '2', analysis: { institution: 'A' } }),
      mockEvent({ id: '3', analysis: { institution: 'B' } }),
    ];

    const result = aggregateStakeholders(events);

    expect(result.length).toBe(2);
    const stakeholderA = result.find(s => s.name === 'A');
    expect(stakeholderA?.allEvents.length).toBe(2);
    const stakeholderB = result.find(s => s.name === 'B');
    expect(stakeholderB?.allEvents.length).toBe(1);
  });

  it('should identify completed events based on status prefix', () => {
    const events = [
      mockEvent({ id: '1', followUp: { status: 'Completed - Follow Up' } }),
      mockEvent({ id: '2', followUp: { status: 'Completed - No follow up' } }),
      mockEvent({ id: '3', followUp: { status: 'To Respond' } }),
    ];

    const result = aggregateStakeholders(events);
    // The events belong to 'Test Inst' by default
    const stakeholder = result[0];

    expect(stakeholder.allEvents.length).toBe(3);
    expect(stakeholder.completedEvents.length).toBe(2);
    const statuses = stakeholder.completedEvents.map(e => e.followUp.status);
    expect(statuses).toContain('Completed - Follow Up');
    expect(statuses).toContain('Completed - No follow up');
  });

  it('should aggregate unique themes and papers', () => {
    const events = [
      mockEvent({ id: '1', analysis: { theme: 'Theme 1', linkedActivities: ['Paper 1'] } }),
      mockEvent({ id: '2', analysis: { theme: 'Theme 1', linkedActivities: ['Paper 1', 'Paper 2'] } }),
      mockEvent({ id: '3', analysis: { theme: 'Theme 2', linkedActivities: [] } }),
    ];

    const result = aggregateStakeholders(events);
    // Grouped by 'Test Inst' (default)
    const stakeholder = result[0];

    expect(stakeholder.themes.sort()).toEqual(['Theme 1', 'Theme 2']);
    expect(stakeholder.papers.sort()).toEqual(['Paper 1', 'Paper 2']);
  });

  it('should sort stakeholders by total event count descending', () => {
    const events = [
      mockEvent({ id: '1', analysis: { institution: 'Least Active' } }),
      mockEvent({ id: '2', analysis: { institution: 'Most Active' } }),
      mockEvent({ id: '3', analysis: { institution: 'Most Active' } }),
    ];

    const result = aggregateStakeholders(events);

    expect(result[0].name).toBe('Most Active');
    expect(result[1].name).toBe('Least Active');
  });

  it('should handle empty input', () => {
    const result = aggregateStakeholders([]);
    expect(result.length).toBe(0);
  });
});
