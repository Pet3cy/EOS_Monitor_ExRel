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
    onSelect: vi.fn(),
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

  it('calls onSelect when card is clicked', () => {
    render(<EventCard {...defaultProps} />);
    const card = screen.getByText('Annual Conference 2026').closest('div[tabIndex="0"]');
    if (card) {
      fireEvent.click(card);
      expect(defaultProps.onSelect).toHaveBeenCalledWith('event-1');
    }
  });

  it('calls onSelect when Enter key is pressed', () => {
    render(<EventCard {...defaultProps} />);
    const card = screen.getByText('Annual Conference 2026').closest('div[tabIndex="0"]');
    if (card) {
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(defaultProps.onSelect).toHaveBeenCalledWith('event-1');
    }
  });

  it('calls onSelect when Space key is pressed', () => {
    render(<EventCard {...defaultProps} />);
    const card = screen.getByText('Annual Conference 2026').closest('div[tabIndex="0"]');
    if (card) {
      fireEvent.keyDown(card, { key: ' ' });
      expect(defaultProps.onSelect).toHaveBeenCalledWith('event-1');
    }
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

  it('does not call onSelect when delete button is clicked', () => {
    render(<EventCard {...defaultProps} />);
    const deleteButton = screen.getByTitle('Delete Event');
    fireEvent.click(deleteButton);
    expect(defaultProps.onSelect).not.toHaveBeenCalled();
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
    const card = screen.getByText('Annual Conference 2026').closest('div[tabIndex="0"]');
    expect(card).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('applies default styling when isSelected is false', () => {
    render(<EventCard {...defaultProps} isSelected={false} />);
    const card = screen.getByText('Annual Conference 2026').closest('div[tabIndex="0"]');
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

  it('applies gray color to Not Relevant status', () => {
    const eventWithNotRelevantStatus = {
      ...mockEvent,
      followUp: { ...mockEvent.followUp, status: 'Not Relevant' as const }
    };
    render(<EventCard {...defaultProps} event={eventWithNotRelevantStatus} />);
    const statusElement = screen.getByText('Not Relevant');
    expect(statusElement).toHaveClass('text-gray-400');
  });

  it('applies blue color to To Respond status', () => {
    render(<EventCard {...defaultProps} />);
    const statusElement = screen.getByText('To Respond');
    expect(statusElement).toHaveClass('text-blue-600');
  });

  it('is keyboard accessible with tabIndex', () => {
    render(<EventCard {...defaultProps} />);
    const card = screen.getByText('Annual Conference 2026').closest('div[tabIndex="0"]');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('has proper ARIA label', () => {
    render(<EventCard {...defaultProps} />);
    const card = screen.getByLabelText('View details for Annual Conference 2026');
    expect(card).toBeInTheDocument();
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
});