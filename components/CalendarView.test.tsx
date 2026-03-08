import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarView } from './CalendarView';
import { EventData, Priority } from '../types';

const mockEvents: EventData[] = [
  {
    id: 'e1',
    createdAt: Date.now(),
    originalText: '',
    analysis: {
      sender: 'Sender 1',
      institution: 'OBESSU',
      eventName: 'Event 1',
      theme: 'Education',
      description: 'Description 1',
      priority: Priority.High,
      priorityScore: 90,
      priorityReasoning: 'Important',
      date: '2026-02-15',
      time: '10:00',
      venue: 'Online',
      initialDeadline: '',
      finalDeadline: '',
      linkedActivities: []
    },
    contact: {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Coordinator',
      organization: 'OBESSU',
      repRole: 'Speaker',
      polContact: '',
      notes: ''
    },
    followUp: {
      briefing: '',
      postEventNotes: '',
      status: 'To Respond',
      prepResources: '',
      commsPack: {
        remarks: '',
        representative: '',
        datePlace: '',
        additionalInfo: ''
      }
    }
  },
  {
    id: 'e2',
    createdAt: Date.now(),
    originalText: '',
    analysis: {
      sender: 'Sender 2',
      institution: 'EU Commission',
      eventName: 'Event 2',
      theme: 'Policy',
      description: 'Description 2',
      priority: Priority.Medium,
      priorityScore: 60,
      priorityReasoning: 'Moderate',
      date: '2026-03-20',
      venue: 'Brussels',
      initialDeadline: '',
      finalDeadline: '',
      linkedActivities: []
    },
    contact: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'Manager',
      organization: 'EU',
      repRole: 'Participant',
      polContact: '',
      notes: ''
    },
    followUp: {
      briefing: '',
      postEventNotes: '',
      status: 'Prep ready',
      prepResources: '',
      commsPack: {
        remarks: '',
        representative: '',
        datePlace: '',
        additionalInfo: ''
      }
    }
  }
];

describe('CalendarView', () => {
  it('should render calendar header', () => {
    render(<CalendarView events={mockEvents} />);
    expect(screen.getByText('Calendar Overview')).toBeInTheDocument();
  });

  it('should render filter controls', () => {
    render(<CalendarView events={mockEvents} />);
    expect(screen.getByText('Roadmap Filters')).toBeInTheDocument();
    expect(screen.getByText('Priority Status')).toBeInTheDocument();
    expect(screen.getByText('By Theme')).toBeInTheDocument();
  });

  it('should filter by priority', () => {
    render(<CalendarView events={mockEvents} />);

    const highButton = screen.getByRole('button', { name: 'High' });
    fireEvent.click(highButton);

    // Should show only high priority events
    expect(screen.getByText('Event 1')).toBeInTheDocument();
  });

  it('should switch between view modes', () => {
    render(<CalendarView events={mockEvents} />);

    const viewSelect = screen.getByDisplayValue('Week');
    fireEvent.change(viewSelect, { target: { value: 'Month' } });

    expect(viewSelect).toHaveValue('Month');
  });

  it('should filter by theme', () => {
    render(<CalendarView events={mockEvents} />);

    const themeSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(themeSelect, { target: { value: 'Education' } });

    // Should filter to Education theme
    expect(screen.getByText('Event 1')).toBeInTheDocument();
  });

  it('should reset all filters', () => {
    render(<CalendarView events={mockEvents} />);

    // Apply some filters
    const highButton = screen.getByRole('button', { name: 'High' });
    fireEvent.click(highButton);

    // Reset filters
    const resetButton = screen.getByText('Reset All Filters');
    fireEvent.click(resetButton);

    // Filters should be reset
    const priorityButtons = screen.getAllByRole('button');
    const allButton = priorityButtons.find(btn => btn.textContent === 'All');
    expect(allButton).toHaveClass('bg-slate-900');
  });

  it('should display events on correct dates', () => {
    render(<CalendarView events={mockEvents} />);

    // Events should be displayed
    expect(screen.getByText('Event 1')).toBeInTheDocument();
    expect(screen.getByText('Event 2')).toBeInTheDocument();
  });

  it('should show empty state when no events match filters', () => {
    render(<CalendarView events={[]} />);

    expect(screen.getByText(/No roadmap entries found/i)).toBeInTheDocument();
  });

  it('should filter by date range', () => {
    render(<CalendarView events={mockEvents} />);

    const startDateInput = screen.getByDisplayValue('2026-01-01');
    const endDateInput = screen.getByDisplayValue('2026-12-31');

    fireEvent.change(startDateInput, { target: { value: '2026-03-01' } });
    fireEvent.change(endDateInput, { target: { value: '2026-03-31' } });

    // Should only show March events
    expect(screen.queryByText('Event 1')).not.toBeInTheDocument();
    expect(screen.getByText('Event 2')).toBeInTheDocument();
  });

  it('should handle Month view', () => {
    render(<CalendarView events={mockEvents} />);

    const viewSelect = screen.getByDisplayValue('Week');
    fireEvent.change(viewSelect, { target: { value: 'Month' } });

    // Should group events by month
    expect(screen.getByText(/February/i)).toBeInTheDocument();
    expect(screen.getByText(/March/i)).toBeInTheDocument();
  });

  it('should handle empty events array', () => {
    render(<CalendarView events={[]} />);

    expect(screen.getByText(/No roadmap entries found/i)).toBeInTheDocument();
    expect(screen.getByText('Reset All Filters')).toBeInTheDocument();
  });

  it('should filter by contact', () => {
    render(<CalendarView events={mockEvents} />);

    const selects = screen.getAllByRole('combobox');
    const contactSelect = selects.find(select =>
      select.closest('[class*="space-y"]')?.textContent?.includes('By Contact')
    );

    expect(contactSelect).toBeDefined();
    fireEvent.change(contactSelect!, { target: { value: 'John Doe' } });
    expect(screen.getByText('Event 1')).toBeInTheDocument();
    expect(screen.queryByText('Event 2')).not.toBeInTheDocument();
  }
  });

  it('should display event times when available', () => {
    render(<CalendarView events={mockEvents} />);
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
  });

  it('should handle Trimester view', () => {
    render(<CalendarView events={mockEvents} />);

    const viewSelect = screen.getByDisplayValue('Week');
    fireEvent.change(viewSelect, { target: { value: 'Trimester' } });

    expect(screen.getByText(/Trimester/i)).toBeInTheDocument();
  });

  it('should handle Semester view', () => {
    render(<CalendarView events={mockEvents} />);

    const viewSelect = screen.getByDisplayValue('Week');
    fireEvent.change(viewSelect, { target: { value: 'Semester' } });

    expect(screen.getByText(/Semester/i)).toBeInTheDocument();
  });

  it('should handle Year view', () => {
    render(<CalendarView events={mockEvents} />);

    const viewSelect = screen.getByDisplayValue('Week');
    fireEvent.change(viewSelect, { target: { value: 'Year' } });

    expect(screen.getByText('2026')).toBeInTheDocument();
  });
});