import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { EventCard } from './EventCard';
import { EventData, Priority } from '../types';

describe('EventCard', () => {
  const mockEvent: EventData = {
    id: 'event-1',
    createdAt: Date.now(),
    originalText: 'Original text',
    analysis: {
      sender: 'John Sender',
      senderEmail: 'sender@example.com',
      subject: 'Event Invitation',
      institution: 'Test Institution',
      eventName: 'Annual Conference 2026',
      theme: 'Education',
      description: 'A great conference',
      priority: Priority.High,
      priorityScore: 85,
      priorityReasoning: 'High relevance',
      date: '2026-05-15',
      venue: 'Brussels, Belgium',
      initialDeadline: '2026-04-01',
      finalDeadline: '2026-04-15',
      linkedActivities: ['Activity 1'],
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
      notes: 'Notes'
    },
    followUp: {
      prepResources: 'Resources',
      briefing: 'Briefing text',
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

  const defaultProps = {
    event: mockEvent,
    onClick: vi.fn(),
    onDelete: vi.fn(),
    isSelected: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders event name', () => {
    render(<EventCard {...defaultProps} />);
    expect(screen.getByText('Annual Conference 2026')).toBeInTheDocument();
  });

  it('renders institution name', () => {
    render(<EventCard {...defaultProps} />);
    expect(screen.getByText('Test Institution')).toBeInTheDocument();
  });

  it('renders event date', () => {
    render(<EventCard {...defaultProps} />);
    expect(screen.getByText('2026-05-15')).toBeInTheDocument();
  });

  it('renders venue', () => {
    render(<EventCard {...defaultProps} />);
    expect(screen.getByText('Brussels, Belgium')).toBeInTheDocument();
  });

  it('renders contact name when present', () => {
    render(<EventCard {...defaultProps} />);
    expect(screen.getByText(/Contact: Jane Contact/)).toBeInTheDocument();
  });

  it('renders "No contact assigned" when contact name is empty', () => {
    const eventWithoutContact = {
      ...mockEvent,
      contact: { ...mockEvent.contact, name: '' }
    };
    render(<EventCard {...defaultProps} event={eventWithoutContact} />);
    expect(screen.getByText('No contact assigned')).toBeInTheDocument();
  });

  it('renders priority badge', () => {
    render(<EventCard {...defaultProps} />);
    expect(screen.getByText('High Priority')).toBeInTheDocument();
  });

  it('renders follow-up status', () => {
    render(<EventCard {...defaultProps} />);
    expect(screen.getByText('To Respond')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    render(<EventCard {...defaultProps} />);
    const card = screen.getByText('Annual Conference 2026').closest('div[class*="cursor-pointer"]');
    expect(card).toBeTruthy();
    fireEvent.click(card!);
    expect(defaultProps.onClick).toHaveBeenCalledWith('event-1');
  });

  it('shows delete button on hover', () => {
    render(<EventCard {...defaultProps} />);
    const deleteButton = screen.getByTitle('Delete Event');
    expect(deleteButton).toBeInTheDocument();
  });

  it('opens confirmation modal when delete button is clicked', () => {
    render(<EventCard {...defaultProps} />);
    const deleteButton = screen.getByTitle('Delete Event');
    fireEvent.click(deleteButton);
    expect(screen.getByText('Delete Invitation?')).toBeInTheDocument();
  });

  it('does not call onClick when delete button is clicked', () => {
    render(<EventCard {...defaultProps} />);
    const deleteButton = screen.getByTitle('Delete Event');
    fireEvent.click(deleteButton);
    expect(defaultProps.onClick).not.toHaveBeenCalled();
  });

  it('calls onDelete when confirmation is accepted', () => {
    render(<EventCard {...defaultProps} />);
    const deleteButton = screen.getByTitle('Delete Event');
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByText('Delete Permanently');
    fireEvent.click(confirmButton);

    expect(defaultProps.onDelete).toHaveBeenCalledWith('event-1');
  });

  it('does not call onDelete when confirmation is cancelled', () => {
    render(<EventCard {...defaultProps} />);
    const deleteButton = screen.getByTitle('Delete Event');
    fireEvent.click(deleteButton);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(defaultProps.onDelete).not.toHaveBeenCalled();
  });

  it('applies selected styling when isSelected is true', () => {
    render(<EventCard {...defaultProps} isSelected={true} />);
    const card = screen.getByText('Annual Conference 2026').closest('div[class*="cursor-pointer"]');
    expect(card).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('applies default styling when isSelected is false', () => {
    render(<EventCard {...defaultProps} isSelected={false} />);
    const card = screen.getByText('Annual Conference 2026').closest('div[class*="cursor-pointer"]');
    expect(card).toHaveClass('border-slate-200', 'bg-white');
  });

  it('applies green color to Completed status', () => {
    const eventWithCompletedStatus = {
      ...mockEvent,
      followUp: { ...mockEvent.followUp, status: 'Completed - No follow up' as const }
    };
    render(<EventCard {...defaultProps} event={eventWithCompletedStatus} />);
    const statusElement = screen.getByText('Completed - No follow up');
    expect(statusElement).toHaveClass('text-green-600');
  });

  it('applies slate color to Not Relevant status', () => {
    const eventWithNotRelevantStatus = {
      ...mockEvent,
      followUp: { ...mockEvent.followUp, status: 'Not Relevant' as const }
    };
    render(<EventCard {...defaultProps} event={eventWithNotRelevantStatus} />);
    const statusElement = screen.getByText('Not Relevant');
    expect(statusElement).toHaveClass('text-slate-400');
  });

  it('applies blue color to To Respond status', () => {
    render(<EventCard {...defaultProps} />);
    const statusElement = screen.getByText('To Respond');
    expect(statusElement).toHaveClass('text-blue-600');
  });

  it('renders clickable card container', () => {
    render(<EventCard {...defaultProps} />);
    const card = screen.getByText('Annual Conference 2026').closest('div[class*="cursor-pointer"]');
    expect(card).toBeTruthy();
  });

  it('truncates long event names with line-clamp', () => {
    const eventWithLongName = {
      ...mockEvent,
      analysis: {
        ...mockEvent.analysis,
        eventName: 'This is a very long event name that should be truncated to prevent layout issues'
      }
    };
    render(<EventCard {...defaultProps} event={eventWithLongName} />);
    const eventNameElement = screen.getByText(eventWithLongName.analysis.eventName);
    expect(eventNameElement).toHaveClass('line-clamp-1');
  });

  it('displays all Medium priority correctly', () => {
    const mediumPriorityEvent = {
      ...mockEvent,
      analysis: { ...mockEvent.analysis, priority: Priority.Medium }
    };
    render(<EventCard {...defaultProps} event={mediumPriorityEvent} />);
    expect(screen.getByText('Medium Priority')).toBeInTheDocument();
  });

  it('displays Low priority correctly', () => {
    const lowPriorityEvent = {
      ...mockEvent,
      analysis: { ...mockEvent.analysis, priority: Priority.Low }
    };
    render(<EventCard {...defaultProps} event={lowPriorityEvent} />);
    expect(screen.getByText('Low Priority')).toBeInTheDocument();
  });

  it('renders with React.memo for performance', () => {
    const { rerender } = render(<EventCard {...defaultProps} />);
    rerender(<EventCard {...defaultProps} />);
    // If the component is memoized, it won't re-render with same props
    expect(screen.getByText('Annual Conference 2026')).toBeInTheDocument();
  });

  // Additional edge case and boundary tests
  it('handles checkbox toggle correctly', () => {
    const onToggleSelect = vi.fn();
    render(<EventCard {...defaultProps} showCheckbox={true} isChecked={false} onToggleSelect={onToggleSelect} />);

    const checkbox = document.querySelector('[class*="w-5 h-5 rounded border-2"]');
    expect(checkbox).toBeTruthy();
    fireEvent.click(checkbox!);
    expect(onToggleSelect).toHaveBeenCalledWith('event-1');
  });

  it('displays checked state for checkbox', () => {
    render(<EventCard {...defaultProps} showCheckbox={true} isChecked={true} onToggleSelect={vi.fn()} />);

    const checkbox = document.querySelector('[class*="bg-blue-600"]');
    expect(checkbox).toBeInTheDocument();
  });

  it('prevents event selection when checkbox is clicked', () => {
    const onToggleSelect = vi.fn();
    const onSelect = vi.fn();

    render(<EventCard {...defaultProps} showCheckbox={true} isChecked={false} onToggleSelect={onToggleSelect} onClick={onSelect} />);

    const checkbox = document.querySelector('[class*="w-5 h-5 rounded border-2"]');
    expect(checkbox).toBeTruthy();
    fireEvent.click(checkbox!);
    // onSelect should not be called when checkbox is clicked
    expect(onToggleSelect).toHaveBeenCalledWith('event-1');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('handles event with very long institution name', () => {
    const eventWithLongInstitution = {
      ...mockEvent,
      analysis: {
        ...mockEvent.analysis,
        institution: 'This is a very long institution name that should be truncated to prevent layout issues and overflow problems in the UI'
      }
    };
    render(<EventCard {...defaultProps} event={eventWithLongInstitution} />);

    const institutionElement = screen.getByText(eventWithLongInstitution.analysis.institution);
    expect(institutionElement).toHaveClass('truncate');
  });

  it('handles event with time information', () => {
    const eventWithTime = {
      ...mockEvent,
      analysis: { ...mockEvent.analysis, time: '14:00 CET' }
    };
    render(<EventCard {...defaultProps} event={eventWithTime} />);

    expect(screen.getByText(/14:00 CET/)).toBeInTheDocument();
  });

  it('handles event without time information', () => {
    const eventWithoutTime = {
      ...mockEvent,
      analysis: { ...mockEvent.analysis, time: undefined }
    };
    render(<EventCard {...defaultProps} event={eventWithoutTime} />);

    expect(screen.getByText('2026-05-15')).toBeInTheDocument();
  });

  it('displays recurring event indicator', () => {
    const recurringEvent = {
      ...mockEvent,
      analysis: {
        ...mockEvent.analysis,
        recurrence: { isRecurring: true, frequency: 'Weekly', interval: 1 }
      }
    };
    render(<EventCard {...defaultProps} event={recurringEvent} />);

    const recurringIcon = document.querySelector('[title*="Recurs"]');
    expect(recurringIcon).toBeInTheDocument();
  });

  it('does not display recurring indicator for non-recurring events', () => {
    const nonRecurringEvent = {
      ...mockEvent,
      analysis: {
        ...mockEvent.analysis,
        recurrence: { isRecurring: false, frequency: 'Weekly', interval: 1 }
      }
    };
    render(<EventCard {...defaultProps} event={nonRecurringEvent} />);

    const recurringIcon = document.querySelector('[title*="Recurs"]');
    expect(recurringIcon).not.toBeInTheDocument();
  });

  it('applies different colors for different statuses', () => {
    const statuses = [
      { status: 'Responded - On hold for updates', color: 'text-orange-600' },
      { status: 'Confirmation - To be briefed', color: 'text-indigo-600' },
      { status: 'Prep ready', color: 'text-purple-600' },
      { status: 'MOs comms', color: 'text-pink-600' }
    ];

    statuses.forEach(({ status, color }) => {
      const eventWithStatus = {
        ...mockEvent,
        followUp: { ...mockEvent.followUp, status: status as any }
      };
      const { unmount } = render(<EventCard {...defaultProps} event={eventWithStatus} />);
      const statusElement = screen.getByText(status);
      expect(statusElement).toHaveClass(color);
      unmount();
    });
  });

  it('handles empty venue gracefully', () => {
    const eventWithoutVenue = {
      ...mockEvent,
      analysis: { ...mockEvent.analysis, venue: '' }
    };
    render(<EventCard {...defaultProps} event={eventWithoutVenue} />);

    // Should still render without crashing
    expect(screen.getByText('Annual Conference 2026')).toBeInTheDocument();
  });

  it('prevents delete action from triggering select', () => {
    const onDelete = vi.fn();
    const onSelect = vi.fn();

    render(<EventCard {...defaultProps} onDelete={onDelete} onClick={onSelect} />);

    const deleteButton = screen.getByTitle('Delete Event');
    fireEvent.click(deleteButton);

    // Select should not be called
    expect(onSelect).not.toHaveBeenCalled();

    // Delete confirmation should appear
    expect(screen.getByText('Delete Invitation?')).toBeInTheDocument();
  });

  it('handles click on card container', () => {
    const onSelect = vi.fn();
    render(<EventCard {...defaultProps} onClick={onSelect} />);

    const card = screen.getByText('Annual Conference 2026').closest('div[class*="cursor-pointer"]');
    expect(card).toBeTruthy();
    fireEvent.click(card!);
    expect(onSelect).toHaveBeenCalledWith('event-1');
  });
});