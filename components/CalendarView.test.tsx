import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarView } from './CalendarView';
import { EventData, Priority } from '../types';
import * as calendarUtils from '../utils/calendarUtils';

// Mock the calendarUtils module
vi.mock('../utils/calendarUtils', () => ({
  generateCalendarWeeks: vi.fn(),
}));

const createMockEvent = (id: string, date: string, priority: Priority, theme: string): EventData => ({
  id,
  createdAt: Date.now(),
  originalText: '',
  analysis: {
    sender: 'Sender',
    institution: 'Institution',
    eventName: `Event ${id}`,
    theme,
    description: 'Description',
    priority,
    priorityScore: 80,
    priorityReasoning: 'Reasoning',
    date,
    venue: 'Venue',
    initialDeadline: '',
    finalDeadline: '',
    linkedActivities: [],
  },
  contact: {
    polContact: '',
    name: '',
    email: '',
    role: '',
    organization: '',
    repRole: 'Participant',
    notes: '',
  },
  followUp: {
    prepResources: '',
    briefing: '',
    commsPack: {
      remarks: '',
      representative: '',
      datePlace: '',
      additionalInfo: '',
    },
    postEventNotes: '',
    status: 'To Respond',
  },
});

describe('CalendarView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render calendar header', () => {
    vi.mocked(calendarUtils.generateCalendarWeeks).mockReturnValue([]);

    render(<CalendarView events={[]} />);

    expect(screen.getByText('Calendar Overview')).toBeInTheDocument();
    expect(screen.getByText('Coordinate upcoming advocacy and organizational milestones.')).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
  });

  it('should render filter controls', () => {
    vi.mocked(calendarUtils.generateCalendarWeeks).mockReturnValue([]);

    render(<CalendarView events={[]} />);

    expect(screen.getByText('Roadmap Filters')).toBeInTheDocument();
    expect(screen.getByText('Priority Status')).toBeInTheDocument();
    expect(screen.getByText('By Theme')).toBeInTheDocument();
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
  });

  it('should render priority filter buttons', () => {
    vi.mocked(calendarUtils.generateCalendarWeeks).mockReturnValue([]);

    render(<CalendarView events={[]} />);

    expect(screen.getByText('All', { selector: 'button' })).toBeInTheDocument();
    expect(screen.getByText('High', { selector: 'button' })).toBeInTheDocument();
    expect(screen.getByText('Medium', { selector: 'button' })).toBeInTheDocument();
    expect(screen.getByText('Low', { selector: 'button' })).toBeInTheDocument();
  });

  it('should filter by priority when priority button is clicked', () => {
    vi.mocked(calendarUtils.generateCalendarWeeks).mockReturnValue([]);

    render(<CalendarView events={[createMockEvent('1', '2026-06-15', Priority.High, 'Theme A')]} />);

    const highButton = screen.getByText('High', { selector: 'button' });
    fireEvent.click(highButton);

    expect(vi.mocked(calendarUtils.generateCalendarWeeks)).toHaveBeenCalledWith(
      expect.any(Array),
      2026,
      '2026-01-01',
      '2026-12-31',
      Priority.High,
      'All'
    );
  });

  it('should filter by theme when theme dropdown is changed', () => {
    const events = [
      createMockEvent('1', '2026-06-15', Priority.High, 'Theme A'),
      createMockEvent('2', '2026-06-16', Priority.High, 'Theme B'),
    ];

    vi.mocked(calendarUtils.generateCalendarWeeks).mockReturnValue([]);

    render(<CalendarView events={events} />);

    const themeSelect = screen.getByRole('combobox');
    fireEvent.change(themeSelect, { target: { value: 'Theme A' } });

    expect(vi.mocked(calendarUtils.generateCalendarWeeks)).toHaveBeenCalledWith(
      expect.any(Array),
      2026,
      '2026-01-01',
      '2026-12-31',
      'All',
      'Theme A'
    );
  });

  it('should populate theme dropdown with unique themes from events', () => {
    const events = [
      createMockEvent('1', '2026-06-15', Priority.High, 'Education'),
      createMockEvent('2', '2026-06-16', Priority.High, 'Health'),
      createMockEvent('3', '2026-06-17', Priority.High, 'Education'),
    ];

    vi.mocked(calendarUtils.generateCalendarWeeks).mockReturnValue([]);

    render(<CalendarView events={events} />);

    const themeSelect = screen.getByRole('combobox');
    const options = Array.from(themeSelect.querySelectorAll('option')).map((opt: any) => opt.value);

    expect(options).toContain('All');
    expect(options).toContain('Education');
    expect(options).toContain('Health');
    expect(options.length).toBe(3); // All, Education, Health
  });

  it('should update date range filters', () => {
    vi.mocked(calendarUtils.generateCalendarWeeks).mockReturnValue([]);

    render(<CalendarView events={[]} />);

    const dateInputs = screen.getAllByDisplayValue('2026-01-01');
    const startDateInput = dateInputs[0];

    fireEvent.change(startDateInput, { target: { value: '2026-03-01' } });

    expect(vi.mocked(calendarUtils.generateCalendarWeeks)).toHaveBeenCalledWith(
      expect.any(Array),
      2026,
      '2026-03-01',
      '2026-12-31',
      'All',
      'All'
    );
  });

  it('should show reset filters button when filters are active', () => {
    vi.mocked(calendarUtils.generateCalendarWeeks).mockReturnValue([]);

    render(<CalendarView events={[]} />);

    // Initially no reset button visible (filters are at default)
    expect(screen.queryByTitle('Clear all filters')).not.toBeInTheDocument();

    // Change priority filter
    const highButton = screen.getByText('High', { selector: 'button' });
    fireEvent.click(highButton);

    // Now reset button should be visible
    expect(screen.getByTitle('Clear all filters')).toBeInTheDocument();
  });

  it('should reset all filters when reset button is clicked', () => {
    vi.mocked(calendarUtils.generateCalendarWeeks).mockReturnValue([]);

    render(<CalendarView events={[createMockEvent('1', '2026-06-15', Priority.High, 'Theme A')]} />);

    // Apply filters
    const highButton = screen.getByText('High', { selector: 'button' });
    fireEvent.click(highButton);

    const resetButton = screen.getByTitle('Clear all filters');
    fireEvent.click(resetButton);

    // Should revert to default filters
    expect(vi.mocked(calendarUtils.generateCalendarWeeks)).toHaveBeenLastCalledWith(
      expect.any(Array),
      2026,
      '2026-01-01',
      '2026-12-31',
      'All',
      'All'
    );
  });

  it('should display empty state when no weeks match filters', () => {
    vi.mocked(calendarUtils.generateCalendarWeeks).mockReturnValue([]);

    render(<CalendarView events={[]} />);

    expect(screen.getByText('No roadmap entries found for these filters.')).toBeInTheDocument();
    expect(screen.getByText('Adjust your date range or priority settings.')).toBeInTheDocument();
    expect(screen.getByText('Reset All Filters')).toBeInTheDocument();
  });

  it('should render weeks when data is available', () => {
    const mockWeeks = [
      {
        number: 1,
        start: new Date(2026, 0, 1),
        end: new Date(2026, 0, 7),
        events: [createMockEvent('1', '2026-01-05', Priority.High, 'Theme A')],
        days: [
          {
            date: new Date(2026, 0, 5),
            dateString: '2026-01-05',
            events: [createMockEvent('1', '2026-01-05', Priority.High, 'Theme A')],
          },
          {
            date: new Date(2026, 0, 6),
            dateString: '2026-01-06',
            events: [],
          },
          {
            date: new Date(2026, 0, 7),
            dateString: '2026-01-07',
            events: [],
          },
          {
            date: new Date(2026, 0, 1),
            dateString: '2026-01-01',
            events: [],
          },
          {
            date: new Date(2026, 0, 2),
            dateString: '2026-01-02',
            events: [],
          },
          {
            date: new Date(2026, 0, 3),
            dateString: '2026-01-03',
            events: [],
          },
          {
            date: new Date(2026, 0, 4),
            dateString: '2026-01-04',
            events: [],
          },
        ],
      },
    ];

    vi.mocked(calendarUtils.generateCalendarWeeks).mockReturnValue(mockWeeks);

    render(<CalendarView events={[createMockEvent('1', '2026-01-05', Priority.High, 'Theme A')]} />);

    expect(screen.getByText('Week 1')).toBeInTheDocument();
    expect(screen.getByText('Event 1')).toBeInTheDocument();
  });

  it('should display month label for first week of month', () => {
    const mockWeeks = [
      {
        number: 1,
        start: new Date(2026, 0, 1), // Jan 1 - first week
        end: new Date(2026, 0, 7),
        events: [],
        days: Array(7).fill(null).map((_, i) => ({
          date: new Date(2026, 0, i + 1),
          dateString: `2026-01-0${i + 1}`,
          events: [],
        })),
      },
    ];

    vi.mocked(calendarUtils.generateCalendarWeeks).mockReturnValue(mockWeeks);

    render(<CalendarView events={[]} />);

    expect(screen.getByText('January', { selector: 'h3' })).toBeInTheDocument();
  });

  it('should highlight today\'s date', () => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const mockWeeks = [
      {
        number: 1,
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth(), 7),
        events: [],
        days: [
          {
            date: today,
            dateString: todayString,
            events: [],
          },
          ...Array(6).fill(null).map((_, i) => ({
            date: new Date(today.getFullYear(), today.getMonth(), i + 2),
            dateString: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(i + 2).padStart(2, '0')}`,
            events: [],
          })),
        ],
      },
    ];

    vi.mocked(calendarUtils.generateCalendarWeeks).mockReturnValue(mockWeeks);

    render(<CalendarView events={[]} />);

    // Today's date should have special styling
    const todayElement = screen.getByText(today.getDate().toString(), {
      selector: '.bg-blue-600.text-white'
    });
    expect(todayElement).toBeInTheDocument();
  });

  it('should apply different styling to high priority events', () => {
    const mockWeeks = [
      {
        number: 1,
        start: new Date(2026, 0, 1),
        end: new Date(2026, 0, 7),
        events: [createMockEvent('1', '2026-01-05', Priority.High, 'Theme A')],
        days: [
          {
            date: new Date(2026, 0, 5),
            dateString: '2026-01-05',
            events: [createMockEvent('1', '2026-01-05', Priority.High, 'Theme A')],
          },
          ...Array(6).fill(null).map((_, i) => ({
            date: new Date(2026, 0, i === 4 ? 5 : i + 1),
            dateString: `2026-01-0${i === 4 ? 5 : i + 1}`,
            events: [],
          })),
        ],
      },
    ];

    vi.mocked(calendarUtils.generateCalendarWeeks).mockReturnValue(mockWeeks);

    const { container } = render(<CalendarView events={[createMockEvent('1', '2026-01-05', Priority.High, 'Theme A')]} />);

    // High priority events should have red border
    const highPriorityEvent = container.querySelector('.border-l-red-500');
    expect(highPriorityEvent).toBeInTheDocument();
  });

  it('should call generateCalendarWeeks with correct parameters on mount', () => {
    const events = [createMockEvent('1', '2026-06-15', Priority.High, 'Theme A')];

    vi.mocked(calendarUtils.generateCalendarWeeks).mockReturnValue([]);

    render(<CalendarView events={events} />);

    expect(calendarUtils.generateCalendarWeeks).toHaveBeenCalledWith(
      events,
      2026,
      '2026-01-01',
      '2026-12-31',
      'All',
      'All'
    );
  });

  it('should update calendar when events prop changes', () => {
    const initialEvents = [createMockEvent('1', '2026-06-15', Priority.High, 'Theme A')];
    const updatedEvents = [
      createMockEvent('1', '2026-06-15', Priority.High, 'Theme A'),
      createMockEvent('2', '2026-06-16', Priority.High, 'Theme B'),
    ];

    vi.mocked(calendarUtils.generateCalendarWeeks).mockReturnValue([]);

    const { rerender } = render(<CalendarView events={initialEvents} />);

    expect(calendarUtils.generateCalendarWeeks).toHaveBeenLastCalledWith(
      initialEvents,
      2026,
      '2026-01-01',
      '2026-12-31',
      'All',
      'All'
    );

    rerender(<CalendarView events={updatedEvents} />);

    expect(calendarUtils.generateCalendarWeeks).toHaveBeenLastCalledWith(
      updatedEvents,
      2026,
      '2026-01-01',
      '2026-12-31',
      'All',
      'All'
    );
  });

  it('should handle events with missing venue gracefully', () => {
    const eventWithoutVenue = createMockEvent('1', '2026-06-15', Priority.High, 'Theme A');
    eventWithoutVenue.analysis.venue = '';

    const mockWeeks = [
      {
        number: 1,
        start: new Date(2026, 0, 1),
        end: new Date(2026, 0, 7),
        events: [eventWithoutVenue],
        days: [
          {
            date: new Date(2026, 0, 5),
            dateString: '2026-01-05',
            events: [eventWithoutVenue],
          },
          ...Array(6).fill(null).map((_, i) => ({
            date: new Date(2026, 0, i + 1),
            dateString: `2026-01-0${i + 1}`,
            events: [],
          })),
        ],
      },
    ];

    vi.mocked(calendarUtils.generateCalendarWeeks).mockReturnValue(mockWeeks);

    const { container } = render(<CalendarView events={[eventWithoutVenue]} />);

    // Should still render the event card without errors
    expect(screen.getByText('Event 1')).toBeInTheDocument();
  });
});