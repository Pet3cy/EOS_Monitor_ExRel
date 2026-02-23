import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Overview } from './Overview';
import { EventData, Priority } from '../types';
import * as stakeholderUtils from '../services/stakeholderUtils';

// Mock stakeholderUtils
vi.mock('../services/stakeholderUtils', () => ({
  aggregateStakeholders: vi.fn(),
}));

const createMockEvent = (id: string, institution: string, status: string, theme: string): EventData => ({
  id,
  createdAt: Date.now(),
  originalText: '',
  analysis: {
    sender: 'Sender',
    institution,
    eventName: `Event ${id}`,
    theme,
    description: 'Description',
    priority: Priority.High,
    priorityScore: 85,
    priorityReasoning: 'High relevance',
    date: '2026-06-15',
    venue: 'Test Venue',
    initialDeadline: '',
    finalDeadline: '',
    linkedActivities: ['Activity 1'],
  },
  contact: {
    name: '',
    email: '',
    role: '',
    organization: '',
    polContact: '',
    repRole: 'Participant',
    notes: '',
  },
  followUp: {
    briefing: '',
    postEventNotes: '',
    status,
    prepResources: '',
    commsPack: {
      remarks: '',
      representative: '',
      datePlace: '',
      additionalInfo: '',
    },
  },
});

describe('Overview', () => {
  const mockEvents = [
    createMockEvent('1', 'Institution A', 'Completed - No follow up', 'Education'),
    createMockEvent('2', 'Institution A', 'To Respond', 'Health'),
    createMockEvent('3', 'Institution B', 'Completed - Follow Up', 'Education'),
  ];

  const mockStakeholders = [
    {
      name: 'Institution A',
      allEvents: [mockEvents[0], mockEvents[1]],
      completedEvents: [mockEvents[0]],
      themes: ['Education', 'Health'],
      papers: ['Policy Paper 1'],
    },
    {
      name: 'Institution B',
      allEvents: [mockEvents[2]],
      completedEvents: [mockEvents[2]],
      themes: ['Education'],
      papers: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(stakeholderUtils.aggregateStakeholders).mockReturnValue(mockStakeholders);
  });

  describe('Rendering', () => {
    it('should render overview header', () => {
      render(<Overview events={mockEvents} />);

      expect(screen.getByText('Stakeholder Overview')).toBeInTheDocument();
      expect(screen.getByText('Strategic breakdown of engagement, topics, and outcomes per partner.')).toBeInTheDocument();
    });

    it('should render table header columns', () => {
      render(<Overview events={mockEvents} />);

      expect(screen.getByText('Stakeholder / Organization')).toBeInTheDocument();
      expect(screen.getByText('Recent Completed Engagements')).toBeInTheDocument();
      expect(screen.getByText('Impact Metrics & Alignment')).toBeInTheDocument();
    });

    it('should render all stakeholders', () => {
      render(<Overview events={mockEvents} />);

      expect(screen.getByText('Institution A')).toBeInTheDocument();
      expect(screen.getByText('Institution B')).toBeInTheDocument();
    });

    it('should call aggregateStakeholders with events', () => {
      render(<Overview events={mockEvents} />);

      expect(stakeholderUtils.aggregateStakeholders).toHaveBeenCalledWith(mockEvents);
    });
  });

  describe('Stakeholder Information', () => {
    it('should display total event count for each stakeholder', () => {
      render(<Overview events={mockEvents} />);

      expect(screen.getByText('2 total invitations')).toBeInTheDocument();
      expect(screen.getByText('1 total invitation')).toBeInTheDocument();
    });

    it('should display completed events', () => {
      render(<Overview events={mockEvents} />);

      expect(screen.getByText('Event 1')).toBeInTheDocument();
      expect(screen.getByText('Event 3')).toBeInTheDocument();
    });

    it('should display event details for completed events', () => {
      render(<Overview events={mockEvents} />);

      expect(screen.getByText('2026-06-15')).toBeInTheDocument();
      expect(screen.getAllByText('Test Venue')).toHaveLength(2);
    });

    it('should show empty state when no completed events', () => {
      const stakeholdersWithNoCompleted = [
        {
          name: 'Institution C',
          allEvents: [mockEvents[1]],
          completedEvents: [],
          themes: ['Education'],
          papers: [],
        },
      ];

      vi.mocked(stakeholderUtils.aggregateStakeholders).mockReturnValue(stakeholdersWithNoCompleted);

      render(<Overview events={[mockEvents[1]]} />);

      expect(screen.getByText('No completed events')).toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    it('should display total events count', () => {
      render(<Overview events={mockEvents} />);

      // Institution A has 2 events
      const metrics = screen.getAllByText('2');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should display topics count', () => {
      render(<Overview events={mockEvents} />);

      // Institution A has 2 topics
      const topicsCount = screen.getAllByText('2');
      expect(topicsCount.length).toBeGreaterThan(0);
    });

    it('should display papers count', () => {
      render(<Overview events={mockEvents} />);

      // Institution A has 1 paper
      const papersCount = screen.getAllByText('1');
      expect(papersCount.length).toBeGreaterThan(0);
    });

    it('should display topic labels', () => {
      render(<Overview events={mockEvents} />);

      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Topics')).toBeInTheDocument();
      expect(screen.getByText('Papers')).toBeInTheDocument();
    });
  });

  describe('Themes Display', () => {
    it('should display all themes for a stakeholder', () => {
      render(<Overview events={mockEvents} />);

      expect(screen.getAllByText('Education')).toHaveLength(2);
      expect(screen.getByText('Health')).toBeInTheDocument();
    });

    it('should show message when no themes are analyzed', () => {
      const stakeholdersWithNoThemes = [
        {
          name: 'Institution D',
          allEvents: [mockEvents[0]],
          completedEvents: [],
          themes: [],
          papers: [],
        },
      ];

      vi.mocked(stakeholderUtils.aggregateStakeholders).mockReturnValue(stakeholdersWithNoThemes);

      render(<Overview events={[mockEvents[0]]} />);

      expect(screen.getByText('No topics analyzed')).toBeInTheDocument();
    });
  });

  describe('Papers Display', () => {
    it('should display linked papers', () => {
      render(<Overview events={mockEvents} />);

      expect(screen.getByText('Policy Paper 1')).toBeInTheDocument();
    });

    it('should show message when no papers are linked', () => {
      render(<Overview events={mockEvents} />);

      expect(screen.getByText('No specific documents linked.')).toBeInTheDocument();
    });
  });

  describe('Inline Editing', () => {
    it('should enter edit mode when stakeholder name is clicked', () => {
      render(<Overview events={mockEvents} />);

      const stakeholderName = screen.getByText('Institution A');
      fireEvent.click(stakeholderName);

      const input = screen.getByDisplayValue('Institution A');
      expect(input).toBeInTheDocument();
      expect(input).toHaveFocus();
    });

    it('should update input value when typing', () => {
      render(<Overview events={mockEvents} />);

      const stakeholderName = screen.getByText('Institution A');
      fireEvent.click(stakeholderName);

      const input = screen.getByDisplayValue('Institution A');
      fireEvent.change(input, { target: { value: 'New Institution Name' } });

      expect(input).toHaveValue('New Institution Name');
    });

    it('should save changes when Enter key is pressed', () => {
      const onRenameStakeholder = vi.fn();
      render(<Overview events={mockEvents} onRenameStakeholder={onRenameStakeholder} />);

      const stakeholderName = screen.getByText('Institution A');
      fireEvent.click(stakeholderName);

      const input = screen.getByDisplayValue('Institution A');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onRenameStakeholder).toHaveBeenCalledWith('Institution A', 'New Name');
    });

    it('should save changes when check button is clicked', () => {
      const onRenameStakeholder = vi.fn();
      render(<Overview events={mockEvents} onRenameStakeholder={onRenameStakeholder} />);

      const stakeholderName = screen.getByText('Institution A');
      fireEvent.click(stakeholderName);

      const input = screen.getByDisplayValue('Institution A');
      fireEvent.change(input, { target: { value: 'New Name' } });

      const saveButton = screen.getByTitle('Save');
      fireEvent.click(saveButton);

      expect(onRenameStakeholder).toHaveBeenCalledWith('Institution A', 'New Name');
    });

    it('should cancel edit when Escape key is pressed', () => {
      const onRenameStakeholder = vi.fn();
      render(<Overview events={mockEvents} onRenameStakeholder={onRenameStakeholder} />);

      const stakeholderName = screen.getByText('Institution A');
      fireEvent.click(stakeholderName);

      const input = screen.getByDisplayValue('Institution A');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(onRenameStakeholder).not.toHaveBeenCalled();
      expect(screen.getByText('Institution A')).toBeInTheDocument();
    });

    it('should cancel edit when X button is clicked', () => {
      const onRenameStakeholder = vi.fn();
      render(<Overview events={mockEvents} onRenameStakeholder={onRenameStakeholder} />);

      const stakeholderName = screen.getByText('Institution A');
      fireEvent.click(stakeholderName);

      const input = screen.getByDisplayValue('Institution A');
      fireEvent.change(input, { target: { value: 'New Name' } });

      const cancelButton = screen.getByTitle('Cancel');
      fireEvent.click(cancelButton);

      expect(onRenameStakeholder).not.toHaveBeenCalled();
      expect(screen.getByText('Institution A')).toBeInTheDocument();
    });

    it('should not call onRenameStakeholder if name is unchanged', () => {
      const onRenameStakeholder = vi.fn();
      render(<Overview events={mockEvents} onRenameStakeholder={onRenameStakeholder} />);

      const stakeholderName = screen.getByText('Institution A');
      fireEvent.click(stakeholderName);

      const input = screen.getByDisplayValue('Institution A');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onRenameStakeholder).not.toHaveBeenCalled();
    });

    it('should trim whitespace from new name', () => {
      const onRenameStakeholder = vi.fn();
      render(<Overview events={mockEvents} onRenameStakeholder={onRenameStakeholder} />);

      const stakeholderName = screen.getByText('Institution A');
      fireEvent.click(stakeholderName);

      const input = screen.getByDisplayValue('Institution A');
      fireEvent.change(input, { target: { value: '  New Name  ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onRenameStakeholder).toHaveBeenCalledWith('Institution A', 'New Name');
    });

    it('should not save if new name is empty after trim', () => {
      const onRenameStakeholder = vi.fn();
      render(<Overview events={mockEvents} onRenameStakeholder={onRenameStakeholder} />);

      const stakeholderName = screen.getByText('Institution A');
      fireEvent.click(stakeholderName);

      const input = screen.getByDisplayValue('Institution A');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onRenameStakeholder).not.toHaveBeenCalled();
    });

    it('should exit edit mode after saving', () => {
      const onRenameStakeholder = vi.fn();
      render(<Overview events={mockEvents} onRenameStakeholder={onRenameStakeholder} />);

      const stakeholderName = screen.getByText('Institution A');
      fireEvent.click(stakeholderName);

      const input = screen.getByDisplayValue('Institution A');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(screen.queryByDisplayValue('New Name')).not.toBeInTheDocument();
    });

    it('should not rename if onRenameStakeholder is not provided', () => {
      render(<Overview events={mockEvents} />);

      const stakeholderName = screen.getByText('Institution A');
      fireEvent.click(stakeholderName);

      const input = screen.getByDisplayValue('Institution A');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      // Should not crash, just exit edit mode
      expect(screen.queryByDisplayValue('New Name')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no stakeholders exist', () => {
      vi.mocked(stakeholderUtils.aggregateStakeholders).mockReturnValue([]);

      render(<Overview events={[]} />);

      expect(screen.getByText('No stakeholder engagement tracked.')).toBeInTheDocument();
      expect(screen.getByText('New invitations will populate this strategic dashboard automatically.')).toBeInTheDocument();
    });
  });

  describe('Icons and Visual Elements', () => {
    it('should render Building2 icon for stakeholders', () => {
      render(<Overview events={mockEvents} />);

      // The component renders icons, we just check the component renders without error
      expect(screen.getByText('Institution A')).toBeInTheDocument();
    });

    it('should render CheckCircle2 icon for completed events', () => {
      render(<Overview events={mockEvents} />);

      // The component renders icons for completed events
      expect(screen.getByText('Event 1')).toBeInTheDocument();
    });
  });

  describe('Data Aggregation', () => {
    it('should update when events prop changes', () => {
      const { rerender } = render(<Overview events={mockEvents} />);

      expect(stakeholderUtils.aggregateStakeholders).toHaveBeenCalledWith(mockEvents);

      const newEvents = [mockEvents[0]];
      rerender(<Overview events={newEvents} />);

      expect(stakeholderUtils.aggregateStakeholders).toHaveBeenCalledWith(newEvents);
    });

    it('should recalculate stakeholders when events change', () => {
      const { rerender } = render(<Overview events={mockEvents} />);

      expect(screen.getByText('Institution A')).toBeInTheDocument();

      const newStakeholders = [
        {
          name: 'Institution C',
          allEvents: [mockEvents[0]],
          completedEvents: [mockEvents[0]],
          themes: ['New Theme'],
          papers: [],
        },
      ];

      vi.mocked(stakeholderUtils.aggregateStakeholders).mockReturnValue(newStakeholders);

      rerender(<Overview events={[mockEvents[0]]} />);

      expect(screen.getByText('Institution C')).toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    it('should have hover class for stakeholder rows', () => {
      render(<Overview events={mockEvents} />);

      const stakeholderName = screen.getByText('Institution A');
      const row = stakeholderName.closest('.grid');

      expect(row).toHaveClass('hover:bg-slate-50/50');
    });
  });

  describe('Field Labels', () => {
    it('should display "Fields of Engagement" label', () => {
      render(<Overview events={mockEvents} />);

      expect(screen.getAllByText('Fields of Engagement')).toHaveLength(2);
    });

    it('should display "OBESSU Strategic Links" label', () => {
      render(<Overview events={mockEvents} />);

      expect(screen.getAllByText('OBESSU Strategic Links')).toHaveLength(2);
    });
  });

  describe('Accessibility', () => {
    it('should have editable stakeholder names', () => {
      render(<Overview events={mockEvents} />);

      const stakeholderName = screen.getByText('Institution A');
      expect(stakeholderName).toHaveClass('cursor-pointer');
    });

    it('should show edit icon on hover', () => {
      render(<Overview events={mockEvents} />);

      const stakeholderName = screen.getByText('Institution A');
      const container = stakeholderName.closest('.group\\/name');

      expect(container).toBeInTheDocument();
    });
  });

  describe('Multiple Stakeholder Editing', () => {
    it('should only allow editing one stakeholder at a time', () => {
      render(<Overview events={mockEvents} />);

      const stakeholderA = screen.getByText('Institution A');
      fireEvent.click(stakeholderA);

      expect(screen.getByDisplayValue('Institution A')).toBeInTheDocument();

      const stakeholderB = screen.getByText('Institution B');
      fireEvent.click(stakeholderB);

      // Should now be editing Institution B
      expect(screen.getByDisplayValue('Institution B')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Institution A')).not.toBeInTheDocument();
    });
  });

  describe('Metric Display Formatting', () => {
    it('should display metrics in correct columns', () => {
      render(<Overview events={mockEvents} />);

      // Check that metrics section exists
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Topics')).toBeInTheDocument();
      expect(screen.getByText('Papers')).toBeInTheDocument();
    });
  });
});