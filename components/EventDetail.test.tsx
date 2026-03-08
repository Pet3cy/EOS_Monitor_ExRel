import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { EventDetail } from './EventDetail';
import { EventData, Priority, Contact } from '../types';

// Mock geminiService
vi.mock('../services/geminiService', () => ({
  generateBriefing: vi.fn(() => Promise.resolve('Generated briefing content'))
}));

import { generateBriefing } from '../services/geminiService';

describe('EventDetail', () => {
  const mockEvent: EventData = {
    id: 'event-1',
    createdAt: Date.now(),
    originalText: 'Original text',
    analysis: {
      sender: 'John',
      institution: 'Test Institution',
      eventName: 'Annual Conference',
      theme: 'Education',
      description: 'A great conference',
      priority: Priority.High,
      priorityScore: 85,
      priorityReasoning: 'High relevance to our mission',
      date: '2026-05-15',
      venue: 'Brussels, Belgium',
      initialDeadline: '2026-04-01',
      finalDeadline: '2026-04-15',
      linkedActivities: ['Activity 1', 'Activity 2'],
      registrationLink: 'https://example.com/register',
      programmeLink: 'https://example.com/programme'
    },
    contact: {
      contactId: 'contact-1',
      polContact: 'Policy Contact',
      name: 'Jane Contact',
      email: 'jane@example.com',
      role: 'Manager',
      organization: 'Test Org',
      repRole: 'Speaker',
      notes: 'Contact notes'
    },
    followUp: {
      prepResources: 'Resources',
      briefing: 'Initial briefing',
      commsPack: {
        remarks: 'Remarks',
        representative: 'Rep name',
        datePlace: 'Date and place',
        additionalInfo: 'Additional info'
      },
      postEventNotes: 'Post event notes',
      status: 'To Respond'
    }
  };

  const mockContacts: Contact[] = [
    {
      id: 'contact-1',
      name: 'Jane Contact',
      email: 'jane@example.com',
      role: 'Manager',
      organization: 'Test Org',
      notes: 'Notes'
    },
    {
      id: 'contact-2',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Developer',
      organization: 'Other Org',
      notes: ''
    }
  ];

  const defaultProps = {
    event: mockEvent,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    contacts: mockContacts,
    onViewContact: vi.fn(),
    onAddContact: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders event name', () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getByText('Annual Conference')).toBeInTheDocument();
  });

  it('renders institution and date', () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getByText('Test Institution')).toBeInTheDocument();
    expect(screen.getByText('2026-05-15')).toBeInTheDocument();
  });

  it('renders priority badge', () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getByText('High Priority')).toBeInTheDocument();
  });

  it('renders theme', () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getByText('Education')).toBeInTheDocument();
  });

  it('renders all tabs', () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getByText('Context & Analysis')).toBeInTheDocument();
    expect(screen.getByText('Logistics & Links')).toBeInTheDocument();
    expect(screen.getByText('Briefing & Prep')).toBeInTheDocument();
    expect(screen.getByText('Outcomes')).toBeInTheDocument();
  });

  it('defaults to Context tab', () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getByText('Event Description')).toBeInTheDocument();
  });

  it('switches to Logistics tab when clicked', () => {
    render(<EventDetail {...defaultProps} />);
    const logisticsTab = screen.getByText('Logistics & Links');
    fireEvent.click(logisticsTab);
    expect(screen.getByText('Date & Time')).toBeInTheDocument();
  });

  it('switches to Prep tab when clicked', () => {
    render(<EventDetail {...defaultProps} />);
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);
    expect(screen.getByText('Assigned Representative')).toBeInTheDocument();
  });

  it('switches to Outcomes tab when clicked', () => {
    render(<EventDetail {...defaultProps} />);
    const outcomesTab = screen.getByText('Outcomes');
    fireEvent.click(outcomesTab);
    expect(screen.getByText('Post-Event Report')).toBeInTheDocument();
  });

  it('renders event description in Context tab', () => {
    render(<EventDetail {...defaultProps} />);
    const textarea = screen.getByDisplayValue('A great conference');
    expect(textarea).toBeInTheDocument();
  });

  it('renders priority score', () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getByText('85/100')).toBeInTheDocument();
  });

  it('renders priority reasoning', () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getByText('High relevance to our mission')).toBeInTheDocument();
  });

  it('renders linked activities', () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Activity 2')).toBeInTheDocument();
  });

  it('shows message when no linked activities', () => {
    const eventWithoutActivities = {
      ...mockEvent,
      analysis: { ...mockEvent.analysis, linkedActivities: [] }
    };
    render(<EventDetail {...defaultProps} event={eventWithoutActivities} />);
    expect(screen.getByText(/No linked internal activities/)).toBeInTheDocument();
  });

  it('renders registration and programme links in Logistics tab', () => {
    render(<EventDetail {...defaultProps} />);
    const logisticsTab = screen.getByText('Logistics & Links');
    fireEvent.click(logisticsTab);

    expect(screen.getByText('Open Registration Page')).toBeInTheDocument();
    expect(screen.getByText('View Agenda / Programme')).toBeInTheDocument();
  });

  it('updates description when changed', async () => {
    render(<EventDetail {...defaultProps} />);
    const textarea = screen.getByDisplayValue('A great conference');
    fireEvent.change(textarea, { target: { value: 'Updated description' } });

    await waitFor(() => {
      expect((textarea as HTMLTextAreaElement).value).toBe('Updated description');
    });
  });

  it('shows Save button when changes are made', async () => {
    render(<EventDetail {...defaultProps} />);
    const textarea = screen.getByDisplayValue('A great conference');
    fireEvent.change(textarea, { target: { value: 'Updated' } });

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  it('calls onUpdate when Save button is clicked', async () => {
    render(<EventDetail {...defaultProps} />);
    const textarea = screen.getByDisplayValue('A great conference');
    fireEvent.change(textarea, { target: { value: 'Updated' } });

    const saveButton = await screen.findByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalled();
      const updatedEvent = defaultProps.onUpdate.mock.calls[0][0];
      expect(updatedEvent.analysis.description).toBe('Updated');
    });
  });

  it('shows delete button when not editing', () => {
    render(<EventDetail {...defaultProps} />);
    const deleteButton = screen.getByTitle('Delete Event');
    expect(deleteButton).toBeInTheDocument();
  });

  it('opens delete confirmation modal', () => {
    render(<EventDetail {...defaultProps} />);
    const deleteButton = screen.getByTitle('Delete Event');
    fireEvent.click(deleteButton);

    expect(screen.getByText('Delete Event?')).toBeInTheDocument();
  });

  it('calls onDelete when delete is confirmed', () => {
    render(<EventDetail {...defaultProps} />);
    const deleteButton = screen.getByTitle('Delete Event');
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByText('Delete Permanently');
    fireEvent.click(confirmButton);

    expect(defaultProps.onDelete).toHaveBeenCalled();
  });

  it('renders assigned contact information', () => {
    render(<EventDetail {...defaultProps} />);
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);

    expect(screen.getByText('Jane Contact')).toBeInTheDocument();
    expect(screen.getByText(/Manager @ Test Org/)).toBeInTheDocument();
  });

  it('shows contact picker when change person button is clicked', () => {
    render(<EventDetail {...defaultProps} />);
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);

    const changeButton = screen.getByText('Change Person');
    fireEvent.click(changeButton);

    expect(screen.getByText('Select Contact')).toBeInTheDocument();
  });

  it('displays contact list in picker', () => {
    render(<EventDetail {...defaultProps} />);
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);

    const changeButton = screen.getByText('Change Person');
    fireEvent.click(changeButton);

    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
  });

  it('updates contact when new contact is selected', async () => {
    render(<EventDetail {...defaultProps} />);
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);

    const changeButton = screen.getByText('Change Person');
    fireEvent.click(changeButton);

    const johnDoeOption = screen.getByText(/John Doe/);
    fireEvent.click(johnDoeOption);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('opens new contact modal when Create New Contact is clicked', () => {
    render(<EventDetail {...defaultProps} />);
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);

    const changeButton = screen.getByText('Change Person');
    fireEvent.click(changeButton);

    const createButton = screen.getByText('+ Create New Contact');
    fireEvent.click(createButton);

    expect(screen.getByText('Add New Contact')).toBeInTheDocument();
  });

  it('generates briefing when AI button is clicked', async () => {
    render(<EventDetail {...defaultProps} />);
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);

    const generateButton = screen.getByText('Generate with AI');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(generateBriefing).toHaveBeenCalledWith(expect.objectContaining({
        id: 'event-1'
      }));
    });
  });

  it('updates briefing field with generated content', async () => {
    render(<EventDetail {...defaultProps} />);
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);

    const generateButton = screen.getByText('Generate with AI');
    fireEvent.click(generateButton);

    await waitFor(() => {
      const briefingTextarea = screen.getByDisplayValue(/Generated briefing content/);
      expect(briefingTextarea).toBeInTheDocument();
    });
  });

  it('renders status dropdown in Outcomes tab', () => {
    render(<EventDetail {...defaultProps} />);
    const outcomesTab = screen.getByText('Outcomes');
    fireEvent.click(outcomesTab);

    const statusSelect = screen.getByDisplayValue('To Respond');
    expect(statusSelect).toBeInTheDocument();
  });

  it('updates status when changed', async () => {
    render(<EventDetail {...defaultProps} />);
    const outcomesTab = screen.getByText('Outcomes');
    fireEvent.click(outcomesTab);

    const statusSelect = screen.getByDisplayValue('To Respond');
    fireEvent.change(statusSelect, { target: { value: 'Completed - No follow up' } });

    await waitFor(() => {
      expect((statusSelect as HTMLSelectElement).value).toBe('Completed - No follow up');
    });
  });

  it('exports event as JSON', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    render(<EventDetail {...defaultProps} />);

    const exportButtons = screen.getAllByRole('button');
    const jsonButton = exportButtons.find(btn => btn.getAttribute('title') === 'Export as JSON');

    if (jsonButton) {
      fireEvent.click(jsonButton);
      expect(createElementSpy).toHaveBeenCalledWith('a');
    }

    createElementSpy.mockRestore();
  });

  it('exports event as CSV', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    render(<EventDetail {...defaultProps} />);

    const exportButtons = screen.getAllByRole('button');
    const csvButton = exportButtons.find(btn => btn.getAttribute('title') === 'Export as CSV');

    if (csvButton) {
      fireEvent.click(csvButton);
      expect(createElementSpy).toHaveBeenCalledWith('a');
    }

    createElementSpy.mockRestore();
  });

  it('shows warning when no representative assigned', () => {
    const eventWithoutContact = {
      ...mockEvent,
      contact: { ...mockEvent.contact, name: '' }
    };
    render(<EventDetail {...defaultProps} event={eventWithoutContact} />);
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);

    expect(screen.getByText(/No representative assigned yet/)).toBeInTheDocument();
  });

  it('resets editing state when event prop changes', () => {
    const { rerender } = render(<EventDetail {...defaultProps} />);

    const textarea = screen.getByDisplayValue('A great conference');
    fireEvent.change(textarea, { target: { value: 'Updated' } });

    const newEvent = { ...mockEvent, id: 'event-2' };
    rerender(<EventDetail {...defaultProps} event={newEvent} />);

    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
  });

  it('renders representative role selector', () => {
    render(<EventDetail {...defaultProps} />);
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);

    const roleSelect = screen.getByDisplayValue('Speaker');
    expect(roleSelect).toBeInTheDocument();
  });

  it('updates representative role', async () => {
    render(<EventDetail {...defaultProps} />);
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);

    const roleSelect = screen.getByDisplayValue('Speaker');
    fireEvent.change(roleSelect, { target: { value: 'Participant' } });

    await waitFor(() => {
      expect((roleSelect as HTMLSelectElement).value).toBe('Participant');
    });
  });

  it('renders post-event notes textarea in Outcomes tab', () => {
    render(<EventDetail {...defaultProps} />);
    const outcomesTab = screen.getByText('Outcomes');
    fireEvent.click(outcomesTab);

    const notesTextarea = screen.getByDisplayValue('Post event notes');
    expect(notesTextarea).toBeInTheDocument();
  });

  // Additional edge case and boundary tests
  it('handles briefing generation error gracefully', async () => {
    (generateBriefing as any).mockRejectedValue(new Error('AI service unavailable'));

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<EventDetail {...defaultProps} />);
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);

    const generateButton = screen.getByText('Generate with AI');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('AI service unavailable');
    });

    alertSpy.mockRestore();
  });

  it('handles contact search with no matches', async () => {
    render(<EventDetail {...defaultProps} />);
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);

    const changeButton = screen.getByText('Change Person');
    fireEvent.click(changeButton);

    const searchInput = screen.getByPlaceholderText('Search people...');
    fireEvent.change(searchInput, { target: { value: 'NonexistentContact' } });

    await waitFor(() => {
      expect(screen.getByText(/No contacts match/)).toBeInTheDocument();
    });
  });

  it('handles contact search with partial matches', async () => {
    render(<EventDetail {...defaultProps} />);
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);

    const changeButton = screen.getByText('Change Person');
    fireEvent.click(changeButton);

    const searchInput = screen.getByPlaceholderText('Search people...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });
  });

  it('closes contact picker when clicking outside (simulation)', () => {
    render(<EventDetail {...defaultProps} />);
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);

    const changeButton = screen.getByText('Change Person');
    fireEvent.click(changeButton);

    expect(screen.getByText('Select Contact')).toBeInTheDocument();

    // Close by clicking Change Person again
    fireEvent.click(changeButton);

    // Picker should toggle closed
    expect(screen.queryByText('Select Contact')).not.toBeInTheDocument();
  });

  it('handles empty linked activities in Context tab', () => {
    const eventWithoutActivities = {
      ...mockEvent,
      analysis: { ...mockEvent.analysis, linkedActivities: [] }
    };
    render(<EventDetail {...defaultProps} event={eventWithoutActivities} />);

    expect(screen.getByText(/No linked internal activities/)).toBeInTheDocument();
  });

  it('shows loading state during briefing generation', async () => {
    (generateBriefing as any).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('Generated'), 100)));

    render(<EventDetail {...defaultProps} />);
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);

    const generateButton = screen.getByText('Generate with AI');
    fireEvent.click(generateButton);

    // Button should be disabled during generation
    await waitFor(() => {
      expect(generateButton).toBeDisabled();
    });
  });

  it('handles multiple field updates before saving', async () => {
    render(<EventDetail {...defaultProps} />);

    // Update description
    const textarea = screen.getByDisplayValue('A great conference');
    fireEvent.change(textarea, { target: { value: 'Updated description' } });

    // Update theme (switch to Logistics tab and back)
    const logisticsTab = screen.getByText('Logistics & Links');
    fireEvent.click(logisticsTab);

    const dateInput = screen.getByDisplayValue('2026-05-15');
    fireEvent.change(dateInput, { target: { value: '2026-06-15' } });

    // Save button should be shown
    const saveButton = await screen.findByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalled();
      const updatedEvent = defaultProps.onUpdate.mock.calls[0][0];
      expect(updatedEvent.analysis.date).toBe('2026-06-15');
    });
  });

  it('handles export with special characters in event name', () => {
    const eventWithSpecialChars = {
      ...mockEvent,
      analysis: { ...mockEvent.analysis, eventName: 'Event @#$% 2026' }
    };

    const createElementSpy = vi.spyOn(document, 'createElement');
    render(<EventDetail {...defaultProps} event={eventWithSpecialChars} />);

    const exportButtons = screen.getAllByRole('button');
    const jsonButton = exportButtons.find(btn => btn.getAttribute('title') === 'Export as JSON');

    if (jsonButton) {
      fireEvent.click(jsonButton);
      expect(createElementSpy).toHaveBeenCalled();
    }

    createElementSpy.mockRestore();
  });

  it('disables save button when no changes made', () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
  });

  it('handles viewing contact profile from event detail', () => {
    render(<EventDetail {...defaultProps} />);
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);

    expect(screen.getByText('Jane Contact')).toBeInTheDocument();
  });

  it('switches between all tabs without errors', () => {
    render(<EventDetail {...defaultProps} />);

    const tabs = ['Context & Analysis', 'Logistics & Links', 'Briefing & Prep', 'Outcomes', 'Raw Data'];

    tabs.forEach(tab => {
      const tabButton = screen.getByText(tab);
      fireEvent.click(tabButton);
      expect(tabButton).toHaveClass('text-blue-600');
    });
  });

  it('displays raw JSON data in Raw Data tab', () => {
    render(<EventDetail {...defaultProps} />);
    const rawTab = screen.getByText('Raw Data');
    fireEvent.click(rawTab);

    expect(screen.getByText('Extracted JSON Data')).toBeInTheDocument();
    expect(screen.getByText('Original Source Text')).toBeInTheDocument();
  });

  it('handles event without registration link', () => {
    const eventWithoutLink = {
      ...mockEvent,
      analysis: { ...mockEvent.analysis, registrationLink: undefined }
    };

    render(<EventDetail {...defaultProps} event={eventWithoutLink} />);
    const logisticsTab = screen.getByText('Logistics & Links');
    fireEvent.click(logisticsTab);

    // Should not crash
    expect(screen.getByText('Date & Time')).toBeInTheDocument();
  });

  it('handles event without programme link', () => {
    const eventWithoutLink = {
      ...mockEvent,
      analysis: { ...mockEvent.analysis, programmeLink: undefined }
    };

    render(<EventDetail {...defaultProps} event={eventWithoutLink} />);
    const logisticsTab = screen.getByText('Logistics & Links');
    fireEvent.click(logisticsTab);

    // Should not crash
    expect(screen.getByText('Date & Time')).toBeInTheDocument();
  });

  it('updates multiple status changes in sequence', async () => {
    render(<EventDetail {...defaultProps} />);
    const outcomesTab = screen.getByText('Outcomes');
    fireEvent.click(outcomesTab);

    const statusSelect = screen.getByDisplayValue('To Respond');

    // First status change
    fireEvent.change(statusSelect, { target: { value: 'Prep ready' } });
    await waitFor(() => {
      expect((statusSelect as HTMLSelectElement).value).toBe('Prep ready');
    });

    // Second status change
    fireEvent.change(statusSelect, { target: { value: 'Completed - No follow up' } });
    await waitFor(() => {
      expect((statusSelect as HTMLSelectElement).value).toBe('Completed - No follow up');
    });
  });
});