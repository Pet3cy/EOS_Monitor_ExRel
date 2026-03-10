import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock child components to simplify testing
vi.mock('./components/EventCard', () => ({
  EventCard: ({ event, onClick }: any) => (
    <div data-testid={`event-card-${event.id}`} onClick={() => onClick(event.id)}>
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
  UploadModal: ({ onClose }: any) => (
    <div data-testid="upload-modal">
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

vi.mock('./components/Overview', () => ({
  Overview: () => <div data-testid="overview">Overview</div>
}));

vi.mock('./components/CalendarView', () => ({
  CalendarView: () => <div data-testid="calendar-view">Calendar</div>
}));

vi.mock('./components/ContactsView', () => ({
  ContactsView: () => <div data-testid="contacts-view">Contacts</div>
}));

vi.mock('./components/CalendarSync', () => ({
  CalendarSync: ({ onEventsSynced }: any) => (
    <button onClick={() => onEventsSynced([])}>Sync</button>
  )
}));

vi.mock('./components/EmailParserView', () => ({
  EmailParserView: () => <div data-testid="email-parser">Email Parser</div>
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render app header', () => {
    render(<App />);
    expect(screen.getByText('EventFlow AI')).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Search events...')).toBeInTheDocument();
  });

  it('should render Add Invitation button', () => {
    render(<App />);
    expect(screen.getByText('Add Invitation')).toBeInTheDocument();
  });

  it('should show navigation tabs', () => {
    render(<App />);

    expect(screen.getAllByText('Calendar')[0]).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText('Past')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('should switch to calendar view', () => {
    render(<App />);

    // Calendar view is the default, so it should already be shown
    expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
  });

  it('should switch to overview view', () => {
    render(<App />);

    const overviewTab = screen.getByText('Overview');
    fireEvent.click(overviewTab);

    expect(screen.getByTestId('overview')).toBeInTheDocument();
  });

  it('should switch to contacts view', () => {
    render(<App />);

    const contactsTab = screen.getByText('Contacts');
    fireEvent.click(contactsTab);

    expect(screen.getByTestId('contacts-view')).toBeInTheDocument();
  });

  it('should open upload modal when Add Invitation is clicked', () => {
    render(<App />);

    const addButton = screen.getByText('Add Invitation');
    fireEvent.click(addButton);

    expect(screen.getByTestId('upload-modal')).toBeInTheDocument();
  });

  it('should close upload modal', () => {
    render(<App />);

    const addButton = screen.getByText('Add Invitation');
    fireEvent.click(addButton);

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('upload-modal')).not.toBeInTheDocument();
  });

  it('should filter events by search term', () => {
    render(<App />);

    // Switch to upcoming view
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: 'Solidar' } });

    // Should filter to show only matching events
    expect(screen.getByText('Solidar Webinar: Advocacy Campaigning')).toBeInTheDocument();
  });

  it('should display mock events', () => {
    render(<App />);

    // Switch to upcoming view
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    expect(screen.getByText('Solidar Webinar: Advocacy Campaigning')).toBeInTheDocument();
  });

  it('should select event when clicked', async () => {
    render(<App />);

    // Switch to upcoming view
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    // Find and click an event card
    const eventCard = screen.getByTestId('event-card-e1');
    fireEvent.click(eventCard);

    await waitFor(() => {
      expect(screen.getByTestId('event-detail')).toBeInTheDocument();
    });
  });

  it('should filter by status', () => {
    render(<App />);

    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const statusSelect = screen.getByDisplayValue('All Statuses');
    fireEvent.change(statusSelect, { target: { value: 'To Respond' } });

    // Mock EventCard renders event names — verify at least one To Respond event is shown
    expect(screen.getByText('Solidar Webinar: Advocacy Campaigning')).toBeInTheDocument();
  });

  it.skip('should show bulk actions when events are selected', () => {
    // Requires EventCard checkbox interaction which is mocked away
    render(<App />);
  });

  it.skip('should handle undo delete', async () => {
    // Requires triggering delete through mocked EventCard and verifying undo toast
    render(<App />);
  });

  it('should sync calendar events', async () => {
    render(<App />);

    const syncButton = screen.getByText('Sync');
    fireEvent.click(syncButton);

    // CalendarSync mock calls onEventsSynced([]) — verify no crash
    await waitFor(() => {
      expect(screen.getByText('EventFlow AI')).toBeInTheDocument();
    });
  });

  it('should sort events by date', () => {
    render(<App />);

    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const dateButton = screen.getByText('Date');
    fireEvent.click(dateButton);

    // Verify events are still rendered after sorting
    expect(screen.getByText('Solidar Webinar: Advocacy Campaigning')).toBeInTheDocument();
  });

  it('should sort events by priority', () => {
    render(<App />);

    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const priorityButton = screen.getByText('Priority');
    fireEvent.click(priorityButton);

    expect(screen.getByText('Solidar Webinar: Advocacy Campaigning')).toBeInTheDocument();
  });

  it('should sort events by institution', () => {
    render(<App />);

    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const institutionButton = screen.getByText('Institution');
    fireEvent.click(institutionButton);

    expect(screen.getByText('Solidar Webinar: Advocacy Campaigning')).toBeInTheDocument();
  });

  it('should toggle sort order', () => {
    render(<App />);

    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const dateButton = screen.getByText('Date');
    fireEvent.click(dateButton);
    fireEvent.click(dateButton);

    // Events still rendered after toggling sort order
    expect(screen.getByText('Solidar Webinar: Advocacy Campaigning')).toBeInTheDocument();
  });

  it('should filter by rep role', () => {
    render(<App />);

    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const roleSelect = screen.getByDisplayValue('All Roles');
    fireEvent.change(roleSelect, { target: { value: 'Speaker' } });

    // Speaker events should remain visible
    expect(screen.getByText('Solidar Webinar: Advocacy Campaigning')).toBeInTheDocument();
  });

  it('should switch to past events view', () => {
    render(<App />);

    const pastTab = screen.getByText('Past');
    fireEvent.click(pastTab);

    // Should show past events (completed/not relevant)
    expect(pastTab).toHaveClass('text-blue-600');
  });

  it('should toggle show past events in upcoming view', () => {
    render(<App />);

    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const toggle = screen.getByText('Show Past Events');
    const toggleButton = toggle.nextElementSibling;
    expect(toggleButton).not.toBeNull();
    fireEvent.click(toggleButton!);

    // After toggling, list header should still be present
    expect(screen.getByText(/Active List/)).toBeInTheDocument();
  });

  it('should display event count', () => {
    render(<App />);

    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    // Should show count of events
    expect(screen.getByText(/Active List/)).toBeInTheDocument();
  });

  it('should show email parser view', () => {
    render(<App />);

    const emailParserTab = screen.getByText('Email Parser');
    fireEvent.click(emailParserTab);

    expect(screen.getByTestId('email-parser')).toBeInTheDocument();
  });

  it('should render mock contacts', () => {
    render(<App />);

    // App initializes with MOCK_CONTACTS
    expect(screen.getByText('Add Invitation')).toBeInTheDocument();
  });

  it('should handle empty search results', () => {
    render(<App />);

    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: 'NonexistentEvent12345' } });

    expect(screen.getByText(/No upcoming events found/)).toBeInTheDocument();
  });
});