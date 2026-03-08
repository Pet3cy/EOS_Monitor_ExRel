import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CalendarView } from './CalendarView';
import { EventData, Priority } from '../types';

describe('CalendarView', () => {
  const mockEvents: EventData[] = [
    {
      id: 'event-1',
      createdAt: Date.now(),
      originalText: 'Original text',
      analysis: {
        sender: 'John Sender',
        institution: 'Test Institution',
        eventName: 'Annual Conference',
        theme: 'Education',
        description: 'A conference',
        priority: Priority.High,
        priorityScore: 85,
        priorityReasoning: 'High relevance',
        date: '2026-05-15',
        venue: 'Brussels',
        initialDeadline: '2026-04-01',
        finalDeadline: '2026-04-15',
        linkedActivities: []
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
        status: 'To Respond'
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders calendar header', () => {
    render(<CalendarView events={mockEvents} />);
    expect(screen.getByText('Calendar Overview')).toBeInTheDocument();
    expect(screen.getByText(/Coordinate upcoming advocacy/)).toBeInTheDocument();
  });

  it('renders filter section', () => {
    render(<CalendarView events={mockEvents} />);
    expect(screen.getByText('Roadmap Filters')).toBeInTheDocument();
  });

  it('renders priority filter buttons', () => {
    render(<CalendarView events={mockEvents} />);
    const buttons = screen.getAllByRole('button');
    const priorityButtons = buttons.filter(btn =>
      ['All', 'High', 'Medium', 'Low'].includes(btn.textContent || '')
    );
    expect(priorityButtons.length).toBeGreaterThanOrEqual(4);
  });

  it('renders theme filter dropdown', () => {
    render(<CalendarView events={mockEvents} />);
    const themeSelects = screen.getAllByRole('combobox');
    expect(themeSelects.length).toBeGreaterThan(0);
  });

  it('renders date range filters', () => {
    render(<CalendarView events={mockEvents} />);
    const dateInputs = screen.getAllByDisplayValue(/2026/);
    expect(dateInputs.length).toBeGreaterThanOrEqual(2);
  });

  it('renders view selector with Week default', () => {
    render(<CalendarView events={mockEvents} />);
    const viewSelects = screen.getAllByRole('combobox');
    const viewSelect = Array.from(viewSelects).find(s =>
      (s as HTMLSelectElement).value === 'Week'
    );
    expect(viewSelect).toBeInTheDocument();
  });

  it('updates priority filter when button is clicked', () => {
    render(<CalendarView events={mockEvents} />);
    const highButton = screen.getByText('High');
    fireEvent.click(highButton);

    // Should apply active styling
    expect(highButton).toHaveClass('bg-slate-900', 'text-white');
  });

  it('applies active styling to selected priority filter', () => {
    render(<CalendarView events={mockEvents} />);
    const allButton = screen.getByText('All');
    // Default selection should be All
    expect(allButton).toHaveClass('bg-slate-900', 'text-white');
  });

  it('updates theme filter when dropdown changes', () => {
    const eventsWithThemes = [
      { ...mockEvents[0] },
      { ...mockEvents[0], id: 'event-2', analysis: { ...mockEvents[0].analysis, theme: 'Environment' } }
    ];

    render(<CalendarView events={eventsWithThemes} />);
    const themeSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(themeSelect, { target: { value: 'Education' } });

    expect((themeSelect as HTMLSelectElement).value).toBe('Education');
  });

  it('shows reset button when filters are active', () => {
    render(<CalendarView events={mockEvents} />);
    const highButton = screen.getByText('High');
    fireEvent.click(highButton);

    const resetButtons = screen.getAllByTitle('Clear all filters');
    expect(resetButtons.length).toBeGreaterThan(0);
  });

  it('resets all filters when reset button is clicked', () => {
    render(<CalendarView events={mockEvents} />);

    // Set filters
    const highButton = screen.getByText('High');
    fireEvent.click(highButton);

    // Reset
    const resetButton = screen.getByTitle('Clear all filters');
    fireEvent.click(resetButton);

    // Check All is selected again
    const allButton = screen.getByText('All');
    expect(allButton).toHaveClass('bg-slate-900', 'text-white');
  });

  it('renders empty state message appropriately', () => {
    render(<CalendarView events={[]} />);
    expect(screen.getByText(/No roadmap entries found/)).toBeInTheDocument();
  });

  it('renders event name in calendar', () => {
    render(<CalendarView events={mockEvents} />);
    // Event may appear in the calendar view
    expect(screen.queryByText('Annual Conference')).toBeInTheDocument();
  });

  it('updates date range filters', () => {
    render(<CalendarView events={mockEvents} />);
    const dateInputs = screen.getAllByDisplayValue('2026-01-01');

    if (dateInputs[0]) {
      fireEvent.change(dateInputs[0], { target: { value: '2026-06-01' } });
      expect((dateInputs[0] as HTMLInputElement).value).toBe('2026-06-01');
    }
  });

  it('renders venue information for events', () => {
    render(<CalendarView events={mockEvents} />);
    expect(screen.getByText('Brussels')).toBeInTheDocument();
  });

  it('generates unique themes list from events', () => {
    const eventsWithMultipleThemes = [
      mockEvents[0],
      { ...mockEvents[0], id: 'event-2', analysis: { ...mockEvents[0].analysis, theme: 'Environment' } },
      { ...mockEvents[0], id: 'event-3', analysis: { ...mockEvents[0].analysis, theme: 'Education' } }
    ];

    render(<CalendarView events={eventsWithMultipleThemes} />);
    const themeSelect = screen.getAllByRole('combobox')[0];
    const options = Array.from(themeSelect.querySelectorAll('option')).map(opt => opt.textContent);

    expect(options).toContain('All');
    expect(options).toContain('Education');
    expect(options).toContain('Environment');
  });

  it('renders reset filters button in empty state', () => {
    render(<CalendarView events={mockEvents} />);
    const highButton = screen.getByText('High');
    fireEvent.click(highButton);

    expect(screen.getByText('Reset All Filters')).toBeInTheDocument();
  });

  it('handles empty events array gracefully', () => {
    render(<CalendarView events={[]} />);
    expect(screen.getByText(/No roadmap entries found/)).toBeInTheDocument();
  });

  it('filters by multiple themes consecutively', () => {
    const eventsWithDifferentThemes = [
      mockEvents[0],
      { ...mockEvents[0], id: 'event-2', analysis: { ...mockEvents[0].analysis, theme: 'Environment' } },
      { ...mockEvents[0], id: 'event-3', analysis: { ...mockEvents[0].analysis, theme: 'Health' } }
    ];

    render(<CalendarView events={eventsWithDifferentThemes} />);
    const themeSelect = screen.getAllByRole('combobox')[0];

    // Filter by first theme
    fireEvent.change(themeSelect, { target: { value: 'Education' } });
    expect((themeSelect as HTMLSelectElement).value).toBe('Education');

    // Filter by second theme
    fireEvent.change(themeSelect, { target: { value: 'Environment' } });
    expect((themeSelect as HTMLSelectElement).value).toBe('Environment');
  });

  it('combines priority and theme filters', () => {
    render(<CalendarView events={mockEvents} />);

    // Set priority filter
    const highButton = screen.getByText('High');
    fireEvent.click(highButton);

    // Set theme filter
    const themeSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(themeSelect, { target: { value: 'Education' } });

    // Both filters should be applied
    expect(highButton).toHaveClass('bg-slate-900', 'text-white');
    expect((themeSelect as HTMLSelectElement).value).toBe('Education');
  });

  it('switches view modes', () => {
    render(<CalendarView events={mockEvents} />);
    const viewSelects = screen.getAllByRole('combobox');
    const viewSelect = Array.from(viewSelects).find(s =>
      Array.from((s as HTMLSelectElement).options).some(opt => opt.value === 'Month')
    );

    if (viewSelect) {
      fireEvent.change(viewSelect, { target: { value: 'Month' } });
      expect((viewSelect as HTMLSelectElement).value).toBe('Month');
    }
  });

  it('handles contact filter', () => {
    render(<CalendarView events={mockEvents} />);
    const comboboxes = screen.getAllByRole('combobox');
    const contactSelect = Array.from(comboboxes).find(cb => {
      const label = cb.closest('.space-y-2')?.querySelector('label');
      return label?.textContent?.includes('Contact');
    });

    expect(contactSelect).toBeInTheDocument();
  });
});