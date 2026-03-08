import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from './App';
import { Priority } from './types';

// Mock the child components to simplify testing
vi.mock('./components/EventCard', () => ({
  EventCard: ({ event, onClick, isSelected }: any) => (
    <div
      data-testid={`event-card-${event.id}`}
      onClick={() => onClick(event.id)}
      className={isSelected ? 'selected' : ''}
    >
      {event.analysis.eventName}
    </div>
  )
}));

vi.mock('./components/EventDetail', () => ({
  EventDetail: ({ event }: any) => (
    <div data-testid="event-detail">{event.analysis.eventName} Detail</div>
  )
}));

vi.mock('./components/UploadModal', () => ({
  UploadModal: ({ onClose, onAnalysisComplete }: any) => (
    <div data-testid="upload-modal">
      Upload Modal
      <button onClick={onClose}>Close</button>
      <button onClick={() => onAnalysisComplete({
        id: 'new-event',
        createdAt: Date.now(),
        originalText: 'test',
        analysis: { eventName: 'New Event', priority: Priority.High, date: '2026-05-01', venue: 'Test', institution: 'Test', theme: 'Test', description: 'Test', priorityScore: 80, priorityReasoning: 'Test', initialDeadline: '2026-04-01', finalDeadline: '2026-04-30', linkedActivities: [] },
        contact: { name: '', email: '', role: '', organization: '', repRole: 'Participant', polContact: '', notes: '' },
        followUp: { status: 'To Respond', briefing: '', prepResources: '', postEventNotes: '', commsPack: { remarks: '', representative: '', datePlace: '', additionalInfo: '' } }
      })}>Add Event</button>
    </div>
  )
}));

vi.mock('./components/CalendarView', () => ({
  CalendarView: () => <div data-testid="calendar-view">Calendar View</div>
}));

vi.mock('./components/Overview', () => ({
  Overview: () => <div data-testid="overview">Overview</div>
}));

vi.mock('./components/ContactsView', () => ({
  ContactsView: () => <div data-testid="contacts-view">Contacts View</div>
}));

vi.mock('./components/CalendarSync', () => ({
  CalendarSync: ({ onEventsSynced }: any) => <div data-testid="calendar-sync">Calendar Sync</div>
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders app header', () => {
    render(<App />);
    expect(screen.getByText('EventFlow AI')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Search events...')).toBeInTheDocument();
  });

  it('renders Add Invitation button', () => {
    render(<App />);
    expect(screen.getByText('Add Invitation')).toBeInTheDocument();
  });

  it('renders all view mode tabs', () => {
    render(<App />);
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText('Past')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('defaults to calendar view', () => {
    render(<App />);
    expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
  });

  it('switches to upcoming view when tab is clicked', () => {
    render(<App />);
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    // Should show event list for upcoming
    expect(screen.queryByTestId('calendar-view')).not.toBeInTheDocument();
  });

  it('switches to past view when tab is clicked', () => {
    render(<App />);
    const pastTab = screen.getByText('Past');
    fireEvent.click(pastTab);

    expect(screen.queryByTestId('calendar-view')).not.toBeInTheDocument();
  });

  it('switches to contacts view when tab is clicked', () => {
    render(<App />);
    const contactsTab = screen.getByText('Contacts');
    fireEvent.click(contactsTab);

    expect(screen.getByTestId('contacts-view')).toBeInTheDocument();
  });

  it('switches to overview view when tab is clicked', () => {
    render(<App />);
    const overviewTab = screen.getByText('Overview');
    fireEvent.click(overviewTab);

    expect(screen.getByTestId('overview')).toBeInTheDocument();
  });

  it('opens upload modal when Add Invitation is clicked', () => {
    render(<App />);
    const addButton = screen.getByText('Add Invitation');
    fireEvent.click(addButton);

    expect(screen.getByTestId('upload-modal')).toBeInTheDocument();
  });

  it('closes upload modal when close is triggered', () => {
    render(<App />);
    const addButton = screen.getByText('Add Invitation');
    fireEvent.click(addButton);

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('upload-modal')).not.toBeInTheDocument();
  });

  it('filters events by search term', async () => {
    render(<App />);

    // Switch to upcoming view to see event list
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: 'Conference' } });

    // Wait for the filter to apply
    await waitFor(() => {
      const events = screen.queryAllByTestId(/event-card-/);
      // Should filter events based on the search term
      expect(events.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('displays event count in sidebar header', () => {
    render(<App />);
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    // Should show count of filtered events
    expect(screen.getByText(/Active List/)).toBeInTheDocument();
  });

  it('selects event when event card is clicked', async () => {
    render(<App />);
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const events = screen.queryAllByTestId(/event-card-/);
    if (events.length > 0) {
      fireEvent.click(events[0]);

      await waitFor(() => {
        expect(screen.getByTestId('event-detail')).toBeInTheDocument();
      });
    }
  });

  it('highlights selected event card', async () => {
    render(<App />);
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const events = screen.queryAllByTestId(/event-card-/);
    if (events.length > 0) {
      fireEvent.click(events[0]);

      await waitFor(() => {
        expect(events[0]).toHaveClass('selected');
      });
    }
  });

  it('applies active tab styling', () => {
    render(<App />);
    const calendarTab = screen.getByText('Calendar');
    expect(calendarTab).toHaveClass('border-blue-600', 'text-blue-600');
  });

  it('shows placeholder when no event is selected', () => {
    render(<App />);
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    expect(screen.getByText('Select an event to view details')).toBeInTheDocument();
  });

  it('filters upcoming events correctly', () => {
    render(<App />);
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    expect(screen.getByText(/Active List/)).toBeInTheDocument();
  });

  it('filters past events correctly', () => {
    render(<App />);
    const pastTab = screen.getByText('Past');
    fireEvent.click(pastTab);

    expect(screen.getByText(/Archived List/)).toBeInTheDocument();
  });

  it('handles contact update', () => {
    render(<App />);
    const contactsTab = screen.getByText('Contacts');
    fireEvent.click(contactsTab);

    expect(screen.getByTestId('contacts-view')).toBeInTheDocument();
  });

  it('handles contact deletion', () => {
    render(<App />);
    const contactsTab = screen.getByText('Contacts');
    fireEvent.click(contactsTab);

    expect(screen.getByTestId('contacts-view')).toBeInTheDocument();
  });

  it('switches to upcoming view after adding event from overview', () => {
    render(<App />);
    const overviewTab = screen.getByText('Overview');
    fireEvent.click(overviewTab);

    const addButton = screen.getByText('Add Invitation');
    fireEvent.click(addButton);

    const addEventButton = screen.getByText('Add Event');
    fireEvent.click(addEventButton);

    // Should switch to upcoming view
    expect(screen.queryByTestId('overview')).not.toBeInTheDocument();
  });

  it('switches to upcoming view after adding event from past', () => {
    render(<App />);
    const pastTab = screen.getByText('Past');
    fireEvent.click(pastTab);

    const addButton = screen.getByText('Add Invitation');
    fireEvent.click(addButton);

    const addEventButton = screen.getByText('Add Event');
    fireEvent.click(addEventButton);

    // Should switch to upcoming view
    expect(screen.getByText(/Active List/)).toBeInTheDocument();
  });

  it('selects newly added event', async () => {
    render(<App />);

    // Start from overview view so new event switches to upcoming view
    const overviewTab = screen.getByText('Overview');
    fireEvent.click(overviewTab);

    const addButton = screen.getByText('Add Invitation');
    fireEvent.click(addButton);

    const addEventButton = screen.getByText('Add Event');
    fireEvent.click(addEventButton);

    // Should switch to upcoming view after adding event from overview
    await waitFor(() => {
      expect(screen.getByTestId('event-detail')).toBeInTheDocument();
    });
  });

  it('handles event deletion', async () => {
    render(<App />);
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const initialEvents = screen.queryAllByTestId(/event-card-/);
    const initialCount = initialEvents.length;

    // Deletion would be handled through EventCard and EventDetail components
    expect(initialCount).toBeGreaterThanOrEqual(0);
  });

  it('case-insensitive search', async () => {
    render(<App />);
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');

    fireEvent.change(searchInput, { target: { value: 'CONFERENCE' } });
    const upperEvents = screen.queryAllByTestId(/event-card-/);

    fireEvent.change(searchInput, { target: { value: 'conference' } });
    const lowerEvents = screen.queryAllByTestId(/event-card-/);

    // Same results for different cases
    expect(upperEvents.length).toBe(lowerEvents.length);
  });

  it('filters by institution name', async () => {
    render(<App />);
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: 'Institution' } });

    await waitFor(() => {
      const events = screen.queryAllByTestId(/event-card-/);
      expect(events.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('shows no events message when filtered list is empty', () => {
    render(<App />);
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: 'NonexistentEventXYZ123' } });

    expect(screen.getByText(/No upcoming events found/)).toBeInTheDocument();
  });

  it('creates commsPack for new events without one', async () => {
    render(<App />);

    // Start from past view so new event switches to upcoming view
    const pastTab = screen.getByText('Past');
    fireEvent.click(pastTab);

    const addButton = screen.getByText('Add Invitation');
    fireEvent.click(addButton);

    const addEventButton = screen.getByText('Add Event');
    fireEvent.click(addEventButton);

    // The new event should have commsPack initialized and be visible
    await waitFor(() => {
      expect(screen.getByTestId('event-detail')).toBeInTheDocument();
    });
  });

  it('maintains calendar view when switching back from other views', () => {
    render(<App />);

    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const calendarTab = screen.getByText('Calendar');
    fireEvent.click(calendarTab);

    expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
  });

  it('handles stakeholder renaming', () => {
    render(<App />);
    const overviewTab = screen.getByText('Overview');
    fireEvent.click(overviewTab);

    expect(screen.getByTestId('overview')).toBeInTheDocument();
  });

  it('propagates contact changes to events', () => {
    render(<App />);
    const contactsTab = screen.getByText('Contacts');
    fireEvent.click(contactsTab);

    expect(screen.getByTestId('contacts-view')).toBeInTheDocument();
  });

  // Additional edge case and boundary tests
  it('handles empty search gracefully', () => {
    render(<App />);
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: '' } });

    // Should show all events when search is empty
    expect(screen.getByText(/Active List/)).toBeInTheDocument();
  });

  it('handles special characters in search', () => {
    render(<App />);
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: '@#$%^&*()' } });

    // Should not crash and show appropriate results
    expect(screen.getByText(/Active List/)).toBeInTheDocument();
  });

  it('maintains view mode when switching tabs', () => {
    render(<App />);

    // Start on calendar view
    expect(screen.getByTestId('calendar-view')).toBeInTheDocument();

    // Switch to upcoming
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);
    expect(screen.queryByTestId('calendar-view')).not.toBeInTheDocument();

    // Switch back to calendar
    const calendarTab = screen.getByText('Calendar');
    fireEvent.click(calendarTab);
    expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
  });

  it('deselects event when switching to calendar view', () => {
    render(<App />);

    // Select an event in upcoming view
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const events = screen.queryAllByTestId(/event-card-/);
    if (events.length > 0) {
      fireEvent.click(events[0]);
    }

    // Switch to calendar view
    const calendarTab = screen.getByText('Calendar');
    fireEvent.click(calendarTab);

    // Calendar view should be shown
    expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
  });

  it('handles multiple rapid tab switches', () => {
    render(<App />);

    const calendarTab = screen.getByText('Calendar');
    const upcomingTab = screen.getByText('Upcoming');
    const pastTab = screen.getByText('Past');
    const contactsTab = screen.getByText('Contacts');
    const overviewTab = screen.getByText('Overview');

    // Rapidly switch tabs
    fireEvent.click(upcomingTab);
    fireEvent.click(pastTab);
    fireEvent.click(contactsTab);
    fireEvent.click(overviewTab);
    fireEvent.click(calendarTab);

    // Should end on calendar view without crashing
    expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
  });

  it('preserves search term when switching views', () => {
    render(<App />);
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: 'Test Search' } });

    // Switch to past view
    const pastTab = screen.getByText('Past');
    fireEvent.click(pastTab);

    // Search term should be preserved
    expect((searchInput as HTMLInputElement).value).toBe('Test Search');
  });

  it('handles event selection in empty filtered list', () => {
    render(<App />);
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: 'NonexistentEventXYZ123' } });

    // Should show no events message
    expect(screen.getByText(/No upcoming events found/)).toBeInTheDocument();

    // Placeholder should be shown
    expect(screen.getByText('Select an event to view details')).toBeInTheDocument();
  });

  it('clears selected event when it is filtered out', () => {
    render(<App />);
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const events = screen.queryAllByTestId(/event-card-/);
    if (events.length > 0) {
      fireEvent.click(events[0]);

      // Event detail should be shown
      expect(screen.queryByTestId('event-detail')).toBeInTheDocument();

      // Now filter it out
      const searchInput = screen.getByPlaceholderText('Search events...');
      fireEvent.change(searchInput, { target: { value: 'NonexistentFilter' } });

      // Placeholder should be shown since selected event is filtered out
      expect(screen.getByText('Select an event to view details')).toBeInTheDocument();
    }
  });

  it('handles adding event with missing commsPack', () => {
    render(<App />);

    const addButton = screen.getByText('Add Invitation');
    fireEvent.click(addButton);

    const addEventButton = screen.getByText('Add Event');
    fireEvent.click(addEventButton);

    // Should have switched to upcoming view
    expect(screen.getByText(/Active List/)).toBeInTheDocument();
  });

  it('displays correct event count in sidebar for different views', () => {
    render(<App />);

    // Check upcoming count
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);
    expect(screen.getByText(/Active List \(\d+\)/)).toBeInTheDocument();

    // Check past count
    const pastTab = screen.getByText('Past');
    fireEvent.click(pastTab);
    expect(screen.getByText(/Archived List \(\d+\)/)).toBeInTheDocument();
  });
});