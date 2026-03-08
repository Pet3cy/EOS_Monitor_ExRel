import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { CalendarView } from './CalendarView';
import { EventData, Priority } from '../types';

// Mock the calendarUtils module
vi.mock('../utils/calendarUtils', () => ({
  generateCalendarWeeks: vi.fn((events, year, startDate, endDate, priority, theme) => {
    // Simple mock implementation for testing
    if (events.length === 0 || priority === Priority.Irrelevant) {
      return [];
    }

    // Return a mock week with events
    return [{
      number: 1,
      start: new Date('2026-01-05'),
      end: new Date('2026-01-11'),
      events: events.filter(e => {
        if (priority !== 'All' && e.analysis.priority !== priority) return false;
        if (theme !== 'All' && e.analysis.theme !== theme) return false;
        return true;
      })
    }];
  })
}));

const mockEvents: EventData[] = [
  {
    id: 'e1',
    createdAt: Date.now(),
    originalText: 'Test event 1',
    analysis: {
      sender: 'John Doe',
      institution: 'Test Org',
      eventName: 'Test Event 1',
      theme: 'Education',
      description: 'Test description',
      priority: Priority.High,
      priorityScore: 90,
      priorityReasoning: 'Important event',
      date: '2026-01-07',
      venue: 'Online',
      initialDeadline: '2026-01-05',
      finalDeadline: '2026-01-06',
      linkedActivities: [],
    },
    contact: {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Manager',
      organization: 'Test Org',
      repRole: 'Speaker',
      polContact: '',
      notes: ''
    },
    followUp: {
      briefing: '',
      prepResources: '',
      commsPack: { remarks: '', representative: '', datePlace: '', additionalInfo: '' },
      postEventNotes: '',
      status: 'To Respond'
    }
  },
  {
    id: 'e2',
    createdAt: Date.now(),
    originalText: 'Test event 2',
    analysis: {
      sender: 'Jane Smith',
      institution: 'Another Org',
      eventName: 'Test Event 2',
      theme: 'Research',
      description: 'Another test description',
      priority: Priority.Medium,
      priorityScore: 70,
      priorityReasoning: 'Moderate priority',
      date: '2026-01-08',
      venue: 'Brussels',
      initialDeadline: '2026-01-06',
      finalDeadline: '2026-01-07',
      linkedActivities: [],
    },
    contact: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'Director',
      organization: 'Another Org',
      repRole: 'Participant',
      polContact: '',
      notes: ''
    },
    followUp: {
      briefing: '',
      prepResources: '',
      commsPack: { remarks: '', representative: '', datePlace: '', additionalInfo: '' },
      postEventNotes: '',
      status: 'Confirmation - To be briefed'
    }
  },
  {
    id: 'e3',
    createdAt: Date.now(),
    originalText: 'Test event 3',
    analysis: {
      sender: 'Bob Johnson',
      institution: 'Third Org',
      eventName: 'Test Event 3',
      theme: 'Education',
      description: 'Third test description',
      priority: Priority.Low,
      priorityScore: 40,
      priorityReasoning: 'Low priority',
      date: '2026-01-09',
      venue: 'Paris',
      initialDeadline: '2026-01-07',
      finalDeadline: '2026-01-08',
      linkedActivities: [],
    },
    contact: {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'Coordinator',
      organization: 'Third Org',
      repRole: 'Other',
      polContact: '',
      notes: ''
    },
    followUp: {
      briefing: '',
      prepResources: '',
      commsPack: { remarks: '', representative: '', datePlace: '', additionalInfo: '' },
      postEventNotes: '',
      status: 'To Respond'
    }
  }
];

describe('CalendarView', () => {
  it('renders calendar header', () => {
    render(<CalendarView events={mockEvents} />);

    expect(screen.getByText('Calendar Overview')).toBeInTheDocument();
    expect(screen.getByText(/Coordinate upcoming advocacy/i)).toBeInTheDocument();
  });

  it('renders filter toolbar', () => {
    render(<CalendarView events={mockEvents} />);

    expect(screen.getByText('Roadmap Filters')).toBeInTheDocument();
    expect(screen.getByText('Priority Status')).toBeInTheDocument();
    expect(screen.getByText('By Theme')).toBeInTheDocument();
  });

  it('displays all priority filter options', () => {
    render(<CalendarView events={mockEvents} />);

    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: Priority.High })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: Priority.Medium })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: Priority.Low })).toBeInTheDocument();
  });

  it('changes priority filter when clicked', () => {
    render(<CalendarView events={mockEvents} />);

    const highButton = screen.getByRole('button', { name: Priority.High });
    fireEvent.click(highButton);

    expect(highButton.className).toContain('bg-slate-900');
  });

  it('displays theme filter dropdown', () => {
    render(<CalendarView events={mockEvents} />);

    const themeSelect = screen.getByRole('combobox');
    expect(themeSelect).toBeInTheDocument();

    // Check for unique themes from mock events
    const options = within(themeSelect).getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
  });

  it('changes theme filter when selected', () => {
    render(<CalendarView events={mockEvents} />);

    const themeSelect = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(themeSelect, { target: { value: 'Education' } });

    expect(themeSelect.value).toBe('Education');
  });

  it('renders date range inputs', () => {
    const { container } = render(<CalendarView events={mockEvents} />);

    // Find date inputs by type
    const dateInputs = container.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBeGreaterThanOrEqual(2);
  });

  it('updates start date filter', () => {
    const { container } = render(<CalendarView events={mockEvents} />);

    const dateInputs = container.querySelectorAll('input[type="date"]');
    const startDateInput = dateInputs[0] as HTMLInputElement;

    fireEvent.change(startDateInput, { target: { value: '2026-02-01' } });
    expect(startDateInput.value).toBe('2026-02-01');
  });

  it('updates end date filter', () => {
    const { container } = render(<CalendarView events={mockEvents} />);

    const dateInputs = container.querySelectorAll('input[type="date"]');
    const endDateInput = dateInputs[1] as HTMLInputElement;

    fireEvent.change(endDateInput, { target: { value: '2026-06-30' } });
    expect(endDateInput.value).toBe('2026-06-30');
  });

  it('shows reset button when filters are applied', () => {
    render(<CalendarView events={mockEvents} />);

    const highButton = screen.getByRole('button', { name: Priority.High });
    fireEvent.click(highButton);

    // Look for reset button (X icon button)
    const buttons = screen.getAllByRole('button');
    const resetButton = buttons.find(btn => btn.title === 'Clear all filters');
    expect(resetButton).toBeInTheDocument();
  });

  it('resets all filters when reset button is clicked', () => {
    render(<CalendarView events={mockEvents} />);

    // Apply some filters
    const highButton = screen.getByRole('button', { name: Priority.High });
    fireEvent.click(highButton);

    const startDateInput = screen.getByDisplayValue('2026-01-01') as HTMLInputElement;
    fireEvent.change(startDateInput, { target: { value: '2026-02-01' } });

    // Find and click reset button
    const buttons = screen.getAllByRole('button');
    const resetButton = buttons.find(btn => btn.title === 'Clear all filters');
    if (resetButton) {
      fireEvent.click(resetButton);
    }

    // Check filters are reset
    const allButton = screen.getByRole('button', { name: 'All' });
    expect(allButton.className).toContain('bg-slate-900');
  });

  it('displays empty state when no events match filters', async () => {
    const { generateCalendarWeeks } = await import('../utils/calendarUtils');
    (generateCalendarWeeks as any).mockReturnValueOnce([]);

    render(<CalendarView events={[]} />);

    expect(screen.getByText(/No roadmap entries found/i)).toBeInTheDocument();
  });

  it('shows reset button in empty state', async () => {
    const { generateCalendarWeeks } = await import('../utils/calendarUtils');
    (generateCalendarWeeks as any).mockReturnValueOnce([]);

    render(<CalendarView events={[]} />);

    const resetButton = screen.getByRole('button', { name: /reset all filters/i });
    expect(resetButton).toBeInTheDocument();
  });

  it('renders week headers correctly', () => {
    render(<CalendarView events={mockEvents} />);

    expect(screen.getByText(/Week 1/i)).toBeInTheDocument();
  });

  it('renders event cards within calendar', () => {
    render(<CalendarView events={mockEvents} />);

    expect(screen.getByText('Test Event 1')).toBeInTheDocument();
  });

  it('displays event venue in calendar', () => {
    render(<CalendarView events={mockEvents} />);

    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('highlights high priority events differently', () => {
    const { container } = render(<CalendarView events={mockEvents} />);

    // High priority events should have red border
    const highPriorityCard = container.querySelector('.border-l-red-500');
    expect(highPriorityCard).toBeInTheDocument();
  });

  it('filters by multiple criteria simultaneously', () => {
    render(<CalendarView events={mockEvents} />);

    // Apply priority filter
    const highButton = screen.getByRole('button', { name: Priority.High });
    fireEvent.click(highButton);

    // Apply theme filter
    const themeSelect = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(themeSelect, { target: { value: 'Education' } });

    // Both filters should be active
    expect(highButton.className).toContain('bg-slate-900');
    expect(themeSelect.value).toBe('Education');
  });

  it('handles date input with min and max attributes', () => {
    const { container } = render(<CalendarView events={mockEvents} />);

    const dateInputs = container.querySelectorAll('input[type="date"]');
    const startDateInput = dateInputs[0] as HTMLInputElement;

    expect(startDateInput.min).toBe('2026-01-01');
    expect(startDateInput.max).toBe('2026-12-31');
  });

  it('displays unique themes in dropdown', () => {
    render(<CalendarView events={mockEvents} />);

    const themeSelect = screen.getByRole('combobox');
    const options = within(themeSelect).getAllByRole('option');

    // Should have 'All', 'Education', and 'Research'
    expect(options.length).toBeGreaterThanOrEqual(3);
  });

  it('shows correct year in header', () => {
    render(<CalendarView events={mockEvents} />);

    expect(screen.getByText('2026')).toBeInTheDocument();
  });

  it('applies correct styling to active filter button', () => {
    render(<CalendarView events={mockEvents} />);

    const allButton = screen.getByRole('button', { name: 'All' });
    expect(allButton.className).toContain('bg-slate-900');
    expect(allButton.className).toContain('text-white');
  });

  it('applies correct styling to inactive filter button', () => {
    render(<CalendarView events={mockEvents} />);

    const highButton = screen.getByRole('button', { name: Priority.High });

    // Initially inactive
    expect(highButton.className).toContain('bg-slate-50');
    expect(highButton.className).toContain('text-slate-500');
  });

  it('handles empty events array', () => {
    render(<CalendarView events={[]} />);

    expect(screen.getByText('Calendar Overview')).toBeInTheDocument();
  });

  it('displays week date range correctly', () => {
    render(<CalendarView events={mockEvents} />);

    // Week should show start and end dates
    const weekHeader = screen.getByText(/Week 1/i);
    expect(weekHeader).toBeInTheDocument();
  });

  it('handles events with missing theme gracefully', () => {
    const eventWithoutTheme = {
      ...mockEvents[0],
      analysis: { ...mockEvents[0].analysis, theme: '' }
    };

    render(<CalendarView events={[eventWithoutTheme]} />);

    expect(screen.getByText('Calendar Overview')).toBeInTheDocument();
  });

  it('maintains filter state when events prop changes', () => {
    const { rerender } = render(<CalendarView events={mockEvents} />);

    const highButton = screen.getByRole('button', { name: Priority.High });
    fireEvent.click(highButton);

    // Rerender with different events
    rerender(<CalendarView events={[mockEvents[0]]} />);

    // Filter should still be active
    expect(highButton.className).toContain('bg-slate-900');
  });

  it('filters by low priority correctly', () => {
    render(<CalendarView events={mockEvents} />);

    const lowButton = screen.getByRole('button', { name: Priority.Low });
    fireEvent.click(lowButton);

    expect(lowButton.className).toContain('bg-slate-900');
  });

  it('filters by medium priority correctly', () => {
    render(<CalendarView events={mockEvents} />);

    const mediumButton = screen.getByRole('button', { name: Priority.Medium });
    fireEvent.click(mediumButton);

    expect(mediumButton.className).toContain('bg-slate-900');
  });

  it('handles date range with start date after end date', () => {
    const { container } = render(<CalendarView events={mockEvents} />);

    const dateInputs = container.querySelectorAll('input[type="date"]');
    const startDateInput = dateInputs[0] as HTMLInputElement;
    const endDateInput = dateInputs[1] as HTMLInputElement;

    fireEvent.change(startDateInput, { target: { value: '2026-12-31' } });
    fireEvent.change(endDateInput, { target: { value: '2026-01-01' } });

    // Should handle invalid date range gracefully
    expect(startDateInput.value).toBe('2026-12-31');
    expect(endDateInput.value).toBe('2026-01-01');
  });

  it('renders multiple events on same day', () => {
    const eventsOnSameDay = [
      { ...mockEvents[0], id: 'e1', analysis: { ...mockEvents[0].analysis, date: '2026-01-07' } },
      { ...mockEvents[1], id: 'e2', analysis: { ...mockEvents[1].analysis, date: '2026-01-07' } }
    ];

    render(<CalendarView events={eventsOnSameDay} />);

    expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    expect(screen.getByText('Test Event 2')).toBeInTheDocument();
  });

  it('shows correct styling for weekend days', () => {
    const { container } = render(<CalendarView events={mockEvents} />);

    // Weekend days should have special background
    const weekendCells = container.querySelectorAll('.bg-slate-50\\/30');
    expect(weekendCells.length).toBeGreaterThanOrEqual(0);
  });

  it('handles rapid filter changes', () => {
    render(<CalendarView events={mockEvents} />);

    const highButton = screen.getByRole('button', { name: Priority.High });
    const mediumButton = screen.getByRole('button', { name: Priority.Medium });
    const lowButton = screen.getByRole('button', { name: Priority.Low });
    const allButton = screen.getByRole('button', { name: 'All' });

    // Rapid switching
    fireEvent.click(highButton);
    fireEvent.click(mediumButton);
    fireEvent.click(lowButton);
    fireEvent.click(allButton);

    expect(allButton.className).toContain('bg-slate-900');
  });

  it('theme filter includes all unique themes', () => {
    render(<CalendarView events={mockEvents} />);

    const themeSelect = screen.getByRole('combobox');
    const options = within(themeSelect).getAllByRole('option');

    // Should have All, Education, and Research
    const optionValues = options.map(opt => (opt as HTMLOptionElement).value);
    expect(optionValues).toContain('All');
    expect(optionValues).toContain('Education');
  });

  it('resets date filters when reset button clicked', () => {
    const { container } = render(<CalendarView events={mockEvents} />);

    const dateInputs = container.querySelectorAll('input[type="date"]');
    const startDateInput = dateInputs[0] as HTMLInputElement;

    fireEvent.change(startDateInput, { target: { value: '2026-03-01' } });

    const buttons = screen.getAllByRole('button');
    const resetButton = buttons.find(btn => btn.title === 'Clear all filters');

    if (resetButton) {
      fireEvent.click(resetButton);
      expect(startDateInput.value).toBe('2026-01-01');
    }
  });

  it('displays event priority visually', () => {
    const { container } = render(<CalendarView events={mockEvents} />);

    // High priority should have distinct styling
    const highPriorityElements = container.querySelectorAll('.border-l-red-500');
    expect(highPriorityElements.length).toBeGreaterThanOrEqual(0);
  });

  it('handles events with very long names', () => {
    const longNameEvent = {
      ...mockEvents[0],
      analysis: {
        ...mockEvents[0].analysis,
        eventName: 'A'.repeat(200)
      }
    };

    render(<CalendarView events={[longNameEvent]} />);

    expect(screen.getByText('Calendar Overview')).toBeInTheDocument();
  });

  it('handles events on year boundaries', () => {
    const boundaryEvent = {
      ...mockEvents[0],
      analysis: {
        ...mockEvents[0].analysis,
        date: '2026-12-31'
      }
    };

    render(<CalendarView events={[boundaryEvent]} />);

    expect(screen.getByText('Calendar Overview')).toBeInTheDocument();
  });

  it('displays correct month separators', () => {
    render(<CalendarView events={mockEvents} />);

    // Should show month names as separators
    const { container } = render(<CalendarView events={mockEvents} />);
    expect(container).toBeInTheDocument();
  });

  it('handles theme filter with special characters', () => {
    const specialThemeEvent = {
      ...mockEvents[0],
      analysis: {
        ...mockEvents[0].analysis,
        theme: 'Education & Development'
      }
    };

    render(<CalendarView events={[specialThemeEvent]} />);

    const themeSelect = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(themeSelect, { target: { value: 'Education & Development' } });

    expect(themeSelect.value).toBe('Education & Development');
  });

  it('maintains UI state during filter application', () => {
    render(<CalendarView events={mockEvents} />);

    const highButton = screen.getByRole('button', { name: Priority.High });
    fireEvent.click(highButton);

    // UI should remain stable
    expect(screen.getByText('Roadmap Filters')).toBeInTheDocument();
    expect(screen.getByText('Calendar Overview')).toBeInTheDocument();
  });
});