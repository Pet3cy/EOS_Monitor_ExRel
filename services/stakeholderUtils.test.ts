import test from 'node:test';
import assert from 'node:assert';
import { aggregateStakeholders } from './stakeholderUtils.ts';
import { Priority } from '../types.ts';
import type { EventData } from '../types.ts';

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

test('aggregateStakeholders - institution name normalization', () => {
  const events = [
    mockEvent({ analysis: { institution: '  Trimmed Inst  ' } }),
    mockEvent({ id: '2', analysis: { institution: '' } }),
  ];

  const result = aggregateStakeholders(events as EventData[]);

  assert.strictEqual(result.length, 2);
  assert.ok(result.find(s => s.name === 'Trimmed Inst'));
  assert.ok(result.find(s => s.name === 'Unknown Stakeholder'));
});

test('aggregateStakeholders - grouping events by stakeholder', () => {
  const events = [
    mockEvent({ analysis: { institution: 'A' } }),
    mockEvent({ id: '2', analysis: { institution: 'A' } }),
    mockEvent({ id: '3', analysis: { institution: 'B' } }),
  ];

  const result = aggregateStakeholders(events as EventData[]);

  assert.strictEqual(result.length, 2);
  const stakeholderA = result.find(s => s.name === 'A');
  assert.strictEqual(stakeholderA?.allEvents.length, 2);
  const stakeholderB = result.find(s => s.name === 'B');
  assert.strictEqual(stakeholderB?.allEvents.length, 1);
});

test('aggregateStakeholders - identifying completed events', () => {
  const events = [
    mockEvent({ followUp: { status: 'Completed - Follow Up' } }),
    mockEvent({ id: '2', followUp: { status: 'To Respond' } }),
  ];

  const result = aggregateStakeholders(events as EventData[]);
  const stakeholder = result[0];

  assert.strictEqual(stakeholder.allEvents.length, 2);
  assert.strictEqual(stakeholder.completedEvents.length, 1);
  assert.strictEqual(stakeholder.completedEvents[0].followUp.status, 'Completed - Follow Up');
});

test('aggregateStakeholders - aggregating unique themes and papers', () => {
  const events = [
    mockEvent({ analysis: { theme: 'Theme 1', linkedActivities: ['Paper 1'] } }),
    mockEvent({ id: '2', analysis: { theme: 'Theme 1', linkedActivities: ['Paper 1', 'Paper 2'] } }),
  ];

  const result = aggregateStakeholders(events as EventData[]);
  const stakeholder = result[0];

  assert.deepStrictEqual(stakeholder.themes, ['Theme 1']);
  // Papers might be in any order since they come from a Set
  assert.strictEqual(stakeholder.papers.length, 2);
  assert.ok(stakeholder.papers.includes('Paper 1'));
  assert.ok(stakeholder.papers.includes('Paper 2'));
});

test('aggregateStakeholders - sorting by total events', () => {
  const events = [
    mockEvent({ analysis: { institution: 'Least Active' } }),
    mockEvent({ id: '2', analysis: { institution: 'Most Active' } }),
    mockEvent({ id: '3', analysis: { institution: 'Most Active' } }),
  ];

  const result = aggregateStakeholders(events as EventData[]);

  assert.strictEqual(result[0].name, 'Most Active');
  assert.strictEqual(result[1].name, 'Least Active');
});

test('aggregateStakeholders - handling empty input', () => {
  const result = aggregateStakeholders([]);
  assert.strictEqual(result.length, 0);
});
