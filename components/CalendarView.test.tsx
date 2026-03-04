import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CalendarView } from './CalendarView';
import { EventData, Priority } from '../types';

// Mock the calendarUtils
vi.mock('../utils/calendarUtils', () => ({
  generateCalendarWeeks: vi.fn(() => [])
}));

import { generateCalendarWeeks } from '../utils/calendarUtils';

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

  const mockWeeks = [
    {
      number: 20,
      start: new Date(2026, 4, 11),
      end: new Date(2026, 4, 17),
      days: [
        {
          date: new Date(2026, 4, 11),
          dateString: '2026-05-11',
          events: []
        },
        {
          date: new Date(2026, 4, 15),
          dateString: '2026-05-15',
          events: [mockEvents[0]]
        }
      ]
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders calendar header', () => {
    (generateCalendarWeeks as any).mockReturnValue([]);
    render(<CalendarView events={mockEvents} />);
    expect(screen.getByText('Calendar Overview')).toBeInTheDocument();
    expect(screen.getByText(/Coordinate upcoming advocacy/)).toBeInTheDocument();
  });

  it('renders filter section', () => {
    (generateCalendarWeeks as any).mockReturnValue([]);
    render(<CalendarView events={mockEvents} />);
    expect(screen.getByText('Roadmap Filters')).toBeInTheDocument();
  });

  it('renders priority filter buttons', () => {
    (generateCalendarWeeks as any).mockReturnValue([]);
    render(<CalendarView events={mockEvents} />);
    const buttons = screen.getAllByRole('button');
    const priorityButtons = buttons.filter(btn =>
      ['All', 'High', 'Medium', 'Low'].includes(btn.textContent || '')
    );
    expect(priorityButtons.length).toBeGreaterThanOrEqual(4);
  });

  it('renders theme filter dropdown', () => {
    (generateCalendarWeeks as any).mockReturnValue([]);
    render(<CalendarView events={mockEvents} />);
    const themeSelects = screen.getAllByRole('combobox');
    expect(themeSelects.length).toBeGreaterThan(0);
  });

  it('renders date range filters', () => {
    (generateCalendarWeeks as any).mockReturnValue([]);
    render(<CalendarView events={mockEvents} />);
    const dateInputs = screen.getAllByDisplayValue(/2026/);
    expect(dateInputs.length).toBeGreaterThanOrEqual(2);
  });

  it('calls generateCalendarWeeks with default filters', () => {
    render(<CalendarView events={mockEvents} />);
    expect(generateCalendarWeeks).toHaveBeenCalledWith(
      mockEvents,
      2026,
      '2026-01-01',
      '2026-12-31',
      'All',
      'All'
    );
  });

  it('updates priority filter when button is clicked', () => {
    (generateCalendarWeeks as any).mockReturnValue([]);
    render(<CalendarView events={mockEvents} />);

    const highButton = screen.getByText('High');
    fireEvent.click(highButton);

    expect(generateCalendarWeeks).toHaveBeenLastCalledWith(
      mockEvents,
      2026,
      '2026-01-01',
      '2026-12-31',
      Priority.High,
      'All'
    );
  });

  it('applies active styling to selected priority filter', () => {
    (generateCalendarWeeks as any).mockReturnValue([]);
    render(<CalendarView events={mockEvents} />);

    const allButtons = screen.getAllByRole('button').filter(btn => btn.textContent === 'All');
    const priorityAllButton = allButtons.find(btn => btn.className.includes('bg-slate-900'));
    expect(priorityAllButton).toHaveClass('bg-slate-900', 'text-white');
  });

  it('updates theme filter when dropdown changes', () => {
    (generateCalendarWeeks as any).mockReturnValue([]);
    const eventsWithThemes = [
      { ...mockEvents[0] },
      { ...mockEvents[0], id: 'event-2', analysis: { ...mockEvents[0].analysis, theme: 'Environment' } }
    ];

    render(<CalendarView events={eventsWithThemes} />);

    const themeSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(themeSelect, { target: { value: 'Education' } });

    expect(generateCalendarWeeks).toHaveBeenLastCalledWith(
      eventsWithThemes,
      2026,
      '2026-01-01',
      '2026-12-31',
      'All',
      'Education'
    );
  });

  it('shows reset button when filters are active', () => {
    (generateCalendarWeeks as any).mockReturnValue([]);
    render(<CalendarView events={mockEvents} />);

    const highButton = screen.getByText('High');
    fireEvent.click(highButton);

    const resetButtons = screen.getAllByTitle('Clear all filters');
    expect(resetButtons.length).toBeGreaterThan(0);
  });

  it('resets all filters when reset button is clicked', () => {
    (generateCalendarWeeks as any).mockReturnValue([]);
    render(<CalendarView events={mockEvents} />);

    // Set filters
    const highButton = screen.getByText('High');
    fireEvent.click(highButton);

    // Reset
    const resetButton = screen.getByTitle('Clear all filters');
    fireEvent.click(resetButton);

    expect(generateCalendarWeeks).toHaveBeenLastCalledWith(
      mockEvents,
      2026,
      '2026-01-01',
      '2026-12-31',
      'All',
      'All'
    );
  });

  it('renders empty state when no weeks match filters', () => {
    (generateCalendarWeeks as any).mockReturnValue([]);
    render(<CalendarView events={mockEvents} />);

    expect(screen.getByText(/No roadmap entries found/)).toBeInTheDocument();
  });

  it('renders week cards when weeks are available', () => {
    (generateCalendarWeeks as any).mockReturnValue(mockWeeks);
    render(<CalendarView events={mockEvents} />);

    expect(screen.getByText(/Week 20/)).toBeInTheDocument();
  });

  it('renders event in calendar day', () => {
    (generateCalendarWeeks as any).mockReturnValue(mockWeeks);
    render(<CalendarView events={mockEvents} />);

    expect(screen.getByText('Annual Conference')).toBeInTheDocument();
  });

  it('displays High priority events with red border', () => {
    (generateCalendarWeeks as any).mockReturnValue(mockWeeks);
    render(<CalendarView events={mockEvents} />);

    const eventName = screen.getByText('Annual Conference');
    const eventCard = eventName.closest('.border-l-4');
    expect(eventCard).toHaveClass('border-l-red-500');
  });

  it('shows month headers for first week of month', () => {
    const januaryWeek = [{
      number: 1,
      start: new Date(2026, 0, 5),
      end: new Date(2026, 0, 11),
      days: [
        { date: new Date(2026, 0, 5), dateString: '2026-01-05', events: [] }
      ]
    }];

    (generateCalendarWeeks as any).mockReturnValue(januaryWeek);
    render(<CalendarView events={mockEvents} />);

    expect(screen.getByText('January')).toBeInTheDocument();
  });

  it('highlights today in calendar', () => {
    const today = new Date();
    const todayWeek = [{
      number: 1,
      start: today,
      end: today,
      days: [
        { date: today, dateString: today.toISOString().split('T')[0], events: [] }
      ]
    }];

    (generateCalendarWeeks as any).mockReturnValue(todayWeek);
    render(<CalendarView events={mockEvents} />);

    // Find the date number within the rounded circle
    const dateNumbers = screen.getAllByText(today.getDate().toString());
    const todayIndicator = dateNumbers.find(el => el.className.includes('bg-blue-600'));
    expect(todayIndicator).toHaveClass('bg-blue-600', 'text-white');
  });

  it('applies weekend styling to Saturday and Sunday', () => {
    const weekWithWeekend = [{
      number: 1,
      start: new Date(2026, 0, 3), // Saturday
      end: new Date(2026, 0, 4), // Sunday
      days: [
        { date: new Date(2026, 0, 3), dateString: '2026-01-03', events: [] },
        { date: new Date(2026, 0, 4), dateString: '2026-01-04', events: [] }
      ]
    }];

    (generateCalendarWeeks as any).mockReturnValue(weekWithWeekend);
    const { container } = render(<CalendarView events={mockEvents} />);

    // Check that weekend days have the weekend styling class
    const weekendDays = container.querySelectorAll('.bg-slate-50\\/30');
    expect(weekendDays.length).toBeGreaterThanOrEqual(2);
  });

  it('updates date range filters', () => {
    (generateCalendarWeeks as any).mockReturnValue([]);
    render(<CalendarView events={mockEvents} />);

    const dateInputs = screen.getAllByDisplayValue('2026-01-01');
    if (dateInputs[0]) {
      fireEvent.change(dateInputs[0], { target: { value: '2026-06-01' } });

      expect(generateCalendarWeeks).toHaveBeenLastCalledWith(
        mockEvents,
        2026,
        '2026-06-01',
        '2026-12-31',
        'All',
        'All'
      );
    }
  });

  it('renders venue information for events', () => {
    (generateCalendarWeeks as any).mockReturnValue(mockWeeks);
    render(<CalendarView events={mockEvents} />);

    expect(screen.getByText('Brussels')).toBeInTheDocument();
  });

  it('generates unique themes list from events', () => {
    const eventsWithMultipleThemes = [
      mockEvents[0],
      { ...mockEvents[0], id: 'event-2', analysis: { ...mockEvents[0].analysis, theme: 'Environment' } },
      { ...mockEvents[0], id: 'event-3', analysis: { ...mockEvents[0].analysis, theme: 'Education' } }
    ];

    (generateCalendarWeeks as any).mockReturnValue([]);
    render(<CalendarView events={eventsWithMultipleThemes} />);

    const themeSelect = screen.getAllByRole('combobox')[0];
    const options = Array.from(themeSelect.querySelectorAll('option')).map(opt => opt.textContent);

    expect(options).toContain('All');
    expect(options).toContain('Education');
    expect(options).toContain('Environment');
  });

  it('renders reset filters button in empty state', () => {
    (generateCalendarWeeks as any).mockReturnValue([]);
    render(<CalendarView events={mockEvents} />);

    const highButton = screen.getByText('High');
    fireEvent.click(highButton);

    expect(screen.getByText('Reset All Filters')).toBeInTheDocument();
  });
});