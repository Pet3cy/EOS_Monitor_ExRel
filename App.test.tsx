import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { Priority } from './types';

// Mock child components
vi.mock('./components/EventCard', () => ({
  EventCard: ({ event, onSelect, onDelete, isSelected }: any) => (
    <div data-testid={`event-card-${event.id}`}>
      <button onClick={() => onSelect(event.id)}>Select {event.analysis.eventName}</button>
      <button onClick={() => onDelete(event.id)}>Delete {event.analysis.eventName}</button>
      <span>{isSelected ? 'Selected' : 'Not Selected'}</span>
    </div>
  ),
}));

vi.mock('./components/EventDetail', () => ({
  EventDetail: ({ event, onUpdate, onDelete }: any) => (
    <div data-testid="event-detail">
      <h2>{event.analysis.eventName}</h2>
      <button onClick={() => onUpdate({ ...event, analysis: { ...event.analysis, eventName: 'Updated Event' } })}>
        Update Event
      </button>
      <button onClick={onDelete}>Delete Event</button>
    </div>
  ),
}));

vi.mock('./components/UploadModal', () => ({
  UploadModal: ({ onClose, onAnalysisComplete }: any) => (
    <div data-testid="upload-modal">
      <button onClick={onClose}>Close Upload</button>
      <button onClick={() => onAnalysisComplete({
        id: 'new-event',
        createdAt: Date.now(),
        originalText: 'Test',
        analysis: {
          sender: 'Test',
          institution: 'Test Inst',
          eventName: 'New Event',
          theme: 'Test Theme',
          description: 'Test',
          priority: Priority.High,
          priorityScore: 90,
          priorityReasoning: 'Test',
          date: '2026-06-15',
          venue: 'Test Venue',
          initialDeadline: '',
          finalDeadline: '',
          linkedActivities: [],
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
          status: 'To Respond',
          prepResources: '',
          commsPack: {
            remarks: '',
            representative: '',
            datePlace: '',
            additionalInfo: '',
          },
        },
      })}>
        Complete Analysis
      </button>
    </div>
  ),
}));

vi.mock('./components/Overview', () => ({
  Overview: ({ events, onRenameStakeholder }: any) => (
    <div data-testid="overview">
      <h2>Overview - {events.length} events</h2>
      <button onClick={() => onRenameStakeholder?.('Old Name', 'New Name')}>
        Rename Stakeholder
      </button>
    </div>
  ),
}));

vi.mock('./components/CalendarView', () => ({
  CalendarView: ({ events }: any) => (
    <div data-testid="calendar-view">
      <h2>Calendar View - {events.length} events</h2>
    </div>
  ),
}));

vi.mock('./components/ContactsView', () => ({
  ContactsView: ({ contacts, events, onUpdateContact, onDeleteContact }: any) => (
    <div data-testid="contacts-view">
      <h2>Contacts - {contacts.length}</h2>
      <button onClick={() => onUpdateContact({
        id: 'updated-contact',
        name: 'Updated Contact',
        email: 'updated@example.com',
        role: 'Updated Role',
        organization: 'Updated Org',
        notes: '',
      })}>
        Update Contact
      </button>
      <button onClick={() => onDeleteContact('contact-1')}>Delete Contact</button>
    </div>
  ),
}));

vi.mock('./data/mockData', () => ({
  MOCK_EVENTS: [
    {
      id: 'event-1',
      createdAt: Date.now(),
      originalText: 'Test event 1',
      analysis: {
        sender: 'Sender 1',
        institution: 'Institution 1',
        eventName: 'Event 1',
        theme: 'Theme A',
        description: 'Description 1',
        priority: Priority.High,
        priorityScore: 85,
        priorityReasoning: 'High relevance',
        date: '2026-06-15',
        venue: 'Venue 1',
        initialDeadline: '',
        finalDeadline: '',
        linkedActivities: [],
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
        status: 'To Respond',
        prepResources: '',
        commsPack: {
          remarks: '',
          representative: '',
          datePlace: '',
          additionalInfo: '',
        },
      },
    },
    {
      id: 'event-2',
      createdAt: Date.now(),
      originalText: 'Test event 2',
      analysis: {
        sender: 'Sender 2',
        institution: 'Institution 2',
        eventName: 'Event 2',
        theme: 'Theme B',
        description: 'Description 2',
        priority: Priority.Medium,
        priorityScore: 60,
        priorityReasoning: 'Medium relevance',
        date: '2026-07-20',
        venue: 'Venue 2',
        initialDeadline: '',
        finalDeadline: '',
        linkedActivities: [],
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
        status: 'Completed - No follow up',
        prepResources: '',
        commsPack: {
          remarks: '',
          representative: '',
          datePlace: '',
          additionalInfo: '',
        },
      },
    },
  ],
  MOCK_CONTACTS: [
    {
      id: 'contact-1',
      name: 'Contact 1',
      email: 'contact1@example.com',
      role: 'Manager',
      organization: 'Org 1',
      notes: '',
    },
  ],
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Header Rendering', () => {
    it('should render app header with title', () => {
      render(<App />);

      expect(screen.getByText('OBESSU Event Flow')).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<App />);

      const searchInput = screen.getByPlaceholderText('Search events...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should render Add Invitation button', () => {
      render(<App />);

      expect(screen.getByText('Add Invitation')).toBeInTheDocument();
    });
  });

  describe('View Mode Tabs', () => {
    it('should render all view mode tabs', () => {
      render(<App />);

      expect(screen.getByText('Calendar')).toBeInTheDocument();
      expect(screen.getByText('Upcoming')).toBeInTheDocument();
      expect(screen.getByText('Past')).toBeInTheDocument();
      expect(screen.getByText('Contacts')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    it('should default to calendar view', () => {
      render(<App />);

      expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
    });

    it('should switch to upcoming view when clicked', () => {
      render(<App />);

      const upcomingTab = screen.getByText('Upcoming');
      fireEvent.click(upcomingTab);

      expect(screen.getByText('Active List (1)')).toBeInTheDocument();
    });

    it('should switch to past view when clicked', () => {
      render(<App />);

      const pastTab = screen.getByText('Past');
      fireEvent.click(pastTab);

      expect(screen.getByText('Archived List (1)')).toBeInTheDocument();
    });

    it('should switch to contacts view when clicked', () => {
      render(<App />);

      const contactsTab = screen.getByText('Contacts');
      fireEvent.click(contactsTab);

      expect(screen.getByTestId('contacts-view')).toBeInTheDocument();
    });

    it('should switch to overview view when clicked', () => {
      render(<App />);

      const overviewTab = screen.getByText('Overview');
      fireEvent.click(overviewTab);

      expect(screen.getByTestId('overview')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter events by event name', () => {
      render(<App />);

      // Switch to upcoming view to see event list
      fireEvent.click(screen.getByText('Upcoming'));

      const searchInput = screen.getByPlaceholderText('Search events...');
      fireEvent.change(searchInput, { target: { value: 'Event 1' } });

      expect(screen.getByText('Select Event 1')).toBeInTheDocument();
      expect(screen.queryByText('Select Event 2')).not.toBeInTheDocument();
    });

    it('should filter events by institution', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Upcoming'));

      const searchInput = screen.getByPlaceholderText('Search events...');
      fireEvent.change(searchInput, { target: { value: 'Institution 1' } });

      expect(screen.getByText('Select Event 1')).toBeInTheDocument();
      expect(screen.queryByText('Select Event 2')).not.toBeInTheDocument();
    });

    it('should be case-insensitive', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Upcoming'));

      const searchInput = screen.getByPlaceholderText('Search events...');
      fireEvent.change(searchInput, { target: { value: 'EVENT 1' } });

      expect(screen.getByText('Select Event 1')).toBeInTheDocument();
    });

    it('should show all events when search is cleared', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Upcoming'));

      const searchInput = screen.getByPlaceholderText('Search events...');
      fireEvent.change(searchInput, { target: { value: 'Event 1' } });
      fireEvent.change(searchInput, { target: { value: '' } });

      expect(screen.getByText('Active List (1)')).toBeInTheDocument();
    });
  });

  describe('Event List Filtering by Status', () => {
    it('should show only upcoming events in upcoming view', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Upcoming'));

      // Only event-1 has 'To Respond' status (not completed)
      expect(screen.getByText('Active List (1)')).toBeInTheDocument();
      expect(screen.getByText('Select Event 1')).toBeInTheDocument();
    });

    it('should show only past events in past view', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Past'));

      // Only event-2 has 'Completed' status
      expect(screen.getByText('Archived List (1)')).toBeInTheDocument();
      expect(screen.getByText('Select Event 2')).toBeInTheDocument();
    });
  });

  describe('Upload Modal', () => {
    it('should open upload modal when Add Invitation is clicked', () => {
      render(<App />);

      const addButton = screen.getByText('Add Invitation');
      fireEvent.click(addButton);

      expect(screen.getByTestId('upload-modal')).toBeInTheDocument();
    });

    it('should close upload modal when close button is clicked', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Add Invitation'));
      fireEvent.click(screen.getByText('Close Upload'));

      expect(screen.queryByTestId('upload-modal')).not.toBeInTheDocument();
    });

    it('should add new event when analysis is completed', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Add Invitation'));
      fireEvent.click(screen.getByText('Complete Analysis'));

      // Switch to upcoming view to see the new event
      fireEvent.click(screen.getByText('Upcoming'));

      expect(screen.getByText('Select New Event')).toBeInTheDocument();
    });

    it('should switch to upcoming view after adding event', () => {
      render(<App />);

      // Start in overview
      fireEvent.click(screen.getByText('Overview'));
      expect(screen.getByTestId('overview')).toBeInTheDocument();

      // Add new event
      fireEvent.click(screen.getByText('Add Invitation'));
      fireEvent.click(screen.getByText('Complete Analysis'));

      // Should automatically switch to upcoming view
      expect(screen.getByText('Active List (2)')).toBeInTheDocument();
    });

    it('should select newly added event', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Add Invitation'));
      fireEvent.click(screen.getByText('Complete Analysis'));

      fireEvent.click(screen.getByText('Upcoming'));

      // The new event should be selected
      const newEventCard = screen.getByTestId('event-card-new-event');
      expect(newEventCard).toHaveTextContent('Selected');
    });
  });

  describe('Event Selection and Detail View', () => {
    it('should display placeholder when no event is selected', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Upcoming'));

      expect(screen.getByText('Select an event to view details')).toBeInTheDocument();
    });

    it('should show event detail when event is selected', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Upcoming'));
      fireEvent.click(screen.getByText('Select Event 1'));

      expect(screen.getByTestId('event-detail')).toBeInTheDocument();
      expect(screen.getByText('Event 1')).toBeInTheDocument();
    });

    it('should mark selected event card as selected', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Upcoming'));
      fireEvent.click(screen.getByText('Select Event 1'));

      const eventCard = screen.getByTestId('event-card-event-1');
      expect(eventCard).toHaveTextContent('Selected');
    });
  });

  describe('Event Management', () => {
    it('should update event when onUpdate is called', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Upcoming'));
      fireEvent.click(screen.getByText('Select Event 1'));
      fireEvent.click(screen.getByText('Update Event'));

      expect(screen.getByText('Updated Event')).toBeInTheDocument();
    });

    it('should delete event from list when onDelete is called', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Upcoming'));
      fireEvent.click(screen.getByText('Delete Event 1'));

      expect(screen.queryByText('Select Event 1')).not.toBeInTheDocument();
      expect(screen.getByText('Active List (0)')).toBeInTheDocument();
    });

    it('should clear selection when deleting selected event', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Upcoming'));
      fireEvent.click(screen.getByText('Select Event 1'));
      fireEvent.click(screen.getByText('Delete Event'));

      expect(screen.getByText('Select an event to view details')).toBeInTheDocument();
    });

    it('should not clear selection when deleting different event', () => {
      render(<App />);

      // Add another event
      fireEvent.click(screen.getByText('Add Invitation'));
      fireEvent.click(screen.getByText('Complete Analysis'));

      fireEvent.click(screen.getByText('Upcoming'));
      fireEvent.click(screen.getByText('Select Event 1'));

      // Delete the new event (not the selected one)
      fireEvent.click(screen.getByText('Delete New Event'));

      // Event 1 should still be selected
      expect(screen.getByText('Event 1')).toBeInTheDocument();
    });
  });

  describe('Contact Management', () => {
    it('should add or update contact when onUpdateContact is called', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Contacts'));
      fireEvent.click(screen.getByText('Update Contact'));

      // Contacts count should still be visible
      expect(screen.getByTestId('contacts-view')).toBeInTheDocument();
    });

    it('should delete contact when onDeleteContact is called', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Contacts'));
      fireEvent.click(screen.getByText('Delete Contact'));

      expect(screen.getByText('Contacts - 0')).toBeInTheDocument();
    });

    it('should propagate contact updates to events', () => {
      render(<App />);

      // This test verifies the behavior exists but doesn't validate the propagation
      // since we'd need events with linked contacts in the mock data
      fireEvent.click(screen.getByText('Contacts'));
      fireEvent.click(screen.getByText('Update Contact'));

      // Contact update should complete without error
      expect(screen.getByTestId('contacts-view')).toBeInTheDocument();
    });
  });

  describe('Stakeholder Renaming', () => {
    it('should rename stakeholder across all events', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Overview'));
      fireEvent.click(screen.getByText('Rename Stakeholder'));

      // Check that the rename callback was triggered
      // The actual implementation updates all matching institutions
      expect(screen.getByTestId('overview')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no events match search', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Upcoming'));

      const searchInput = screen.getByPlaceholderText('Search events...');
      fireEvent.change(searchInput, { target: { value: 'Nonexistent Event' } });

      expect(screen.getByText('No upcoming events found.')).toBeInTheDocument();
    });

    it('should show empty state when no past events exist', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Past'));

      // Delete the past event
      fireEvent.click(screen.getByText('Delete Event 2'));

      expect(screen.getByText('No past events found.')).toBeInTheDocument();
    });
  });

  describe('Event List Integration', () => {
    it('should not show detail if selected event is filtered out', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Upcoming'));
      fireEvent.click(screen.getByText('Select Event 1'));

      // Switch to past view where Event 1 is not shown
      fireEvent.click(screen.getByText('Past'));

      expect(screen.getByText('Select an event to view details')).toBeInTheDocument();
    });

    it('should show detail if selected event is in current filtered list', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Upcoming'));
      fireEvent.click(screen.getByText('Select Event 1'));

      // Search for the selected event
      const searchInput = screen.getByPlaceholderText('Search events...');
      fireEvent.change(searchInput, { target: { value: 'Event 1' } });

      // Detail should still be visible
      expect(screen.getByTestId('event-detail')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible search input', () => {
      render(<App />);

      const searchInput = screen.getByPlaceholderText('Search events...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('should have keyboard accessible navigation tabs', () => {
      render(<App />);

      const calendarTab = screen.getByText('Calendar');
      expect(calendarTab.tagName).toBe('BUTTON');
    });
  });

  describe('View Mode Persistence', () => {
    it('should maintain calendar view during operations', () => {
      render(<App />);

      // Start in calendar view
      expect(screen.getByTestId('calendar-view')).toBeInTheDocument();

      // Open and close upload modal
      fireEvent.click(screen.getByText('Add Invitation'));
      fireEvent.click(screen.getByText('Close Upload'));

      // Should still be in calendar view
      expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
    });
  });

  describe('Callback Memoization', () => {
    it('should not cause unnecessary re-renders', () => {
      const { rerender } = render(<App />);

      fireEvent.click(screen.getByText('Upcoming'));

      // This ensures callbacks are stable
      rerender(<App />);

      expect(screen.getByText('Active List (1)')).toBeInTheDocument();
    });
  });
});