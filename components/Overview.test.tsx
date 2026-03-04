import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Overview } from './Overview';
import { EventData, Priority } from '../types';

// Mock the stakeholderUtils
vi.mock('../services/stakeholderUtils', () => ({
  aggregateStakeholders: vi.fn(() => [])
}));

import { aggregateStakeholders } from '../services/stakeholderUtils';

describe('Overview', () => {
  const mockEvents: EventData[] = [
    {
      id: 'event-1',
      createdAt: Date.now(),
      originalText: 'Original text',
      analysis: {
        sender: 'John',
        institution: 'Test Org',
        eventName: 'Conference 2026',
        theme: 'Education',
        description: 'A conference',
        priority: Priority.High,
        priorityScore: 85,
        priorityReasoning: 'High relevance',
        date: '2026-05-15',
        venue: 'Brussels',
        initialDeadline: '2026-04-01',
        finalDeadline: '2026-04-15',
        linkedActivities: ['Activity 1']
      },
      contact: {
        polContact: 'Policy',
        name: 'Jane',
        email: 'jane@example.com',
        role: 'Manager',
        organization: 'Org',
        repRole: 'Speaker',
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
        status: 'Completed - No follow up'
      }
    }
  ];

  const mockStakeholders = [
    {
      name: 'Test Org',
      allEvents: [mockEvents[0]],
      completedEvents: [mockEvents[0]],
      themes: ['Education'],
      papers: ['Activity 1']
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders overview header', () => {
    (aggregateStakeholders as any).mockReturnValue([]);
    render(<Overview events={mockEvents} />);
    expect(screen.getByText('Stakeholder Overview')).toBeInTheDocument();
    expect(screen.getByText(/Strategic breakdown/)).toBeInTheDocument();
  });

  it('calls aggregateStakeholders with events', () => {
    render(<Overview events={mockEvents} />);
    expect(aggregateStakeholders).toHaveBeenCalledWith(mockEvents);
  });

  it('renders empty state when no stakeholders', () => {
    (aggregateStakeholders as any).mockReturnValue([]);
    render(<Overview events={mockEvents} />);
    expect(screen.getByText(/No stakeholder engagement tracked/)).toBeInTheDocument();
  });

  it('renders stakeholder name', () => {
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} />);
    expect(screen.getByText('Test Org')).toBeInTheDocument();
  });

  it('displays total invitations count', () => {
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} />);
    expect(screen.getByText(/1 total invitation/)).toBeInTheDocument();
  });

  it('displays plural for multiple invitations', () => {
    const multipleEvents = [
      ...mockStakeholders,
      { ...mockStakeholders[0], allEvents: [mockEvents[0], mockEvents[0]] }
    ];
    (aggregateStakeholders as any).mockReturnValue([{
      ...mockStakeholders[0],
      allEvents: [mockEvents[0], { ...mockEvents[0], id: 'event-2' }]
    }]);
    render(<Overview events={mockEvents} />);
    expect(screen.getByText(/2 total invitations/)).toBeInTheDocument();
  });

  it('renders completed events', () => {
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} />);
    expect(screen.getByText('Conference 2026')).toBeInTheDocument();
  });

  it('shows no completed events message when none exist', () => {
    (aggregateStakeholders as any).mockReturnValue([{
      ...mockStakeholders[0],
      completedEvents: []
    }]);
    render(<Overview events={mockEvents} />);
    expect(screen.getByText(/No completed events/)).toBeInTheDocument();
  });

  it('displays themes', () => {
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} />);
    expect(screen.getByText('Education')).toBeInTheDocument();
  });

  it('displays papers/linked activities', () => {
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} />);
    expect(screen.getByText('Activity 1')).toBeInTheDocument();
  });

  it('shows message when no topics analyzed', () => {
    (aggregateStakeholders as any).mockReturnValue([{
      ...mockStakeholders[0],
      themes: []
    }]);
    render(<Overview events={mockEvents} />);
    expect(screen.getByText(/No topics analyzed/)).toBeInTheDocument();
  });

  it('shows message when no documents linked', () => {
    (aggregateStakeholders as any).mockReturnValue([{
      ...mockStakeholders[0],
      papers: []
    }]);
    render(<Overview events={mockEvents} />);
    expect(screen.getByText(/No specific documents linked/)).toBeInTheDocument();
  });

  it('displays metrics counts correctly', () => {
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} />);

    // Check that all metric labels are present
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Topics')).toBeInTheDocument();
    expect(screen.getByText('Papers')).toBeInTheDocument();

    // Check that counts are displayed (there are multiple "1"s, so we use getAllByText)
    const counts = screen.getAllByText('1');
    expect(counts.length).toBeGreaterThanOrEqual(3); // Total, Topics, Papers
  });

  it('enables editing when stakeholder name is clicked', () => {
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} />);

    const stakeholderName = screen.getByText('Test Org');
    fireEvent.click(stakeholderName);

    const input = screen.getByDisplayValue('Test Org') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('updates stakeholder name input when typing', async () => {
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} />);

    const stakeholderName = screen.getByText('Test Org');
    fireEvent.click(stakeholderName);

    const input = screen.getByDisplayValue('Test Org') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New Org Name' } });

    await waitFor(() => {
      expect(input.value).toBe('New Org Name');
    });
  });

  it('calls onRenameStakeholder when Enter is pressed', async () => {
    const onRenameStakeholder = vi.fn();
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} onRenameStakeholder={onRenameStakeholder} />);

    const stakeholderName = screen.getByText('Test Org');
    fireEvent.click(stakeholderName);

    const input = screen.getByDisplayValue('Test Org');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(onRenameStakeholder).toHaveBeenCalledWith('Test Org', 'New Name');
    });
  });

  it('calls onRenameStakeholder when save button is clicked', async () => {
    const onRenameStakeholder = vi.fn();
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} onRenameStakeholder={onRenameStakeholder} />);

    const stakeholderName = screen.getByText('Test Org');
    fireEvent.click(stakeholderName);

    const input = screen.getByDisplayValue('Test Org');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const saveButton = screen.getByTitle('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onRenameStakeholder).toHaveBeenCalledWith('Test Org', 'New Name');
    });
  });

  it('cancels editing when Escape is pressed', async () => {
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} />);

    const stakeholderName = screen.getByText('Test Org');
    fireEvent.click(stakeholderName);

    const input = screen.getByDisplayValue('Test Org');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.getByText('Test Org')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('New Name')).not.toBeInTheDocument();
    });
  });

  it('cancels editing when cancel button is clicked', async () => {
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} />);

    const stakeholderName = screen.getByText('Test Org');
    fireEvent.click(stakeholderName);

    const input = screen.getByDisplayValue('Test Org');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const cancelButton = screen.getByTitle('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Test Org')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('New Name')).not.toBeInTheDocument();
    });
  });

  it('does not call onRenameStakeholder when name is unchanged', async () => {
    const onRenameStakeholder = vi.fn();
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} onRenameStakeholder={onRenameStakeholder} />);

    const stakeholderName = screen.getByText('Test Org');
    fireEvent.click(stakeholderName);

    const input = screen.getByDisplayValue('Test Org');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(onRenameStakeholder).not.toHaveBeenCalled();
    });
  });

  it('does not call onRenameStakeholder when name is empty', async () => {
    const onRenameStakeholder = vi.fn();
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} onRenameStakeholder={onRenameStakeholder} />);

    const stakeholderName = screen.getByText('Test Org');
    fireEvent.click(stakeholderName);

    const input = screen.getByDisplayValue('Test Org');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(onRenameStakeholder).not.toHaveBeenCalled();
    });
  });

  it('renders table structure with proper columns', () => {
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} />);

    expect(screen.getByText('Stakeholder / Organization')).toBeInTheDocument();
    expect(screen.getByText('Recent Completed Engagements')).toBeInTheDocument();
    expect(screen.getByText('Impact Metrics & Alignment')).toBeInTheDocument();
  });

  it('displays event date and venue in completed events', () => {
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} />);

    expect(screen.getByText('2026-05-15')).toBeInTheDocument();
    expect(screen.getByText('Brussels')).toBeInTheDocument();
  });

  it('handles multiple stakeholders', () => {
    const multipleStakeholders = [
      mockStakeholders[0],
      {
        name: 'Another Org',
        allEvents: [mockEvents[0]],
        completedEvents: [],
        themes: ['Environment'],
        papers: []
      }
    ];

    (aggregateStakeholders as any).mockReturnValue(multipleStakeholders);
    render(<Overview events={mockEvents} />);

    expect(screen.getByText('Test Org')).toBeInTheDocument();
    expect(screen.getByText('Another Org')).toBeInTheDocument();
  });

  it('renders without onRenameStakeholder prop', () => {
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} />);

    const stakeholderName = screen.getByText('Test Org');
    expect(stakeholderName).toBeInTheDocument();
  });

  it('auto-focuses input when editing starts', async () => {
    (aggregateStakeholders as any).mockReturnValue(mockStakeholders);
    render(<Overview events={mockEvents} />);

    const stakeholderName = screen.getByText('Test Org');
    fireEvent.click(stakeholderName);

    await waitFor(() => {
      const input = screen.getByDisplayValue('Test Org');
      expect(document.activeElement).toBe(input);
    });
  });
});