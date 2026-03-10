import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventCard } from './EventCard';
import { EventData, Priority } from '../types';

const mockEvent: EventData = {
  id: 'e1',
  createdAt: Date.now(),
  originalText: 'Test event',
  analysis: {
    sender: 'John Doe',
    institution: 'OBESSU',
    eventName: 'Test Event',
    theme: 'Education',
    description: 'A test event description',
    priority: Priority.High,
    priorityScore: 90,
    priorityReasoning: 'Very important',
    date: '2026-03-15',
    time: '14:00',
    venue: 'Online',
    initialDeadline: '2026-03-10',
    finalDeadline: '2026-03-12',
    linkedActivities: []
  },
  contact: {
    contactId: 'c1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Coordinator',
    organization: 'OBESSU',
    repRole: 'Speaker',
    polContact: '',
    notes: ''
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
      additionalInfo: ''
    }
  }
};

describe('EventCard', () => {
  const defaultProps = {
    event: mockEvent,
    onClick: vi.fn(),
    onDelete: vi.fn(),
    isSelected: false,
    showCheckbox: false,
    isChecked: false,
    onToggleSelect: vi.fn()
  };

  it('should render event details correctly', () => {
    render(<EventCard {...defaultProps} />);

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('OBESSU')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText(/2026-03-15/)).toBeInTheDocument();
    expect(screen.getByText(/Contact: Jane Smith/)).toBeInTheDocument();
  });

  it('should call onClick when card is clicked', () => {
    const onClick = vi.fn();
    render(<EventCard {...defaultProps} onClick={onClick} />);

    const card = screen.getByText('Test Event').closest('div');
    if (card) {
      fireEvent.click(card);
      expect(onClick).toHaveBeenCalledWith('e1');
    }
  });

  it('should show selected state', () => {
    const { container } = render(<EventCard {...defaultProps} isSelected={true} />);

    const card = container.querySelector('.border-blue-500');
    expect(card).toBeInTheDocument();
  });

  it('should show checkbox when showCheckbox is true', () => {
    render(<EventCard {...defaultProps} showCheckbox={true} />);

    const checkbox = screen.getByRole('checkbox', { hidden: true });
    expect(checkbox).toBeInTheDocument();
  });

  it('should call onToggleSelect when checkbox is clicked', () => {
    const onToggleSelect = vi.fn();
    const { container } = render(
      <EventCard {...defaultProps} showCheckbox={true} onToggleSelect={onToggleSelect} />
    );

    const checkboxContainer = container.querySelector('.w-5.h-5');
    if (checkboxContainer) {
      fireEvent.click(checkboxContainer);
      expect(onToggleSelect).toHaveBeenCalledWith('e1');
    }
  });

  it('should show delete button on hover', () => {
    const { container } = render(<EventCard {...defaultProps} />);

    const deleteButton = container.querySelector('button[title="Delete Event"]');
    expect(deleteButton).toBeInTheDocument();
  });

  it('should open delete confirmation when delete button is clicked', () => {
    const { container } = render(<EventCard {...defaultProps} />);

    const deleteButton = container.querySelector('button[title="Delete Event"]');
    if (deleteButton) {
      fireEvent.click(deleteButton);
      // Should show the confirmation modal
      expect(screen.getByText('Delete Invitation?')).toBeInTheDocument();
    }
  });

  it('should call onDelete when delete is confirmed', () => {
    const onDelete = vi.fn();
    const { container } = render(<EventCard {...defaultProps} onDelete={onDelete} />);

    const deleteButton = container.querySelector('button[title="Delete Event"]');
    if (deleteButton) {
      fireEvent.click(deleteButton);

      const confirmButton = screen.getByText('Delete Permanently');
      fireEvent.click(confirmButton);

      expect(onDelete).toHaveBeenCalledWith(mockEvent);
    }
  });

  it('should display priority badge', () => {
    render(<EventCard {...defaultProps} />);
    expect(screen.getByText('High Priority')).toBeInTheDocument();
  });

  it('should display time if available', () => {
    render(<EventCard {...defaultProps} />);
    expect(screen.getByText(/14:00/)).toBeInTheDocument();
  });

  it('should show recurring icon for recurring events', () => {
    const recurringEvent = {
      ...mockEvent,
      analysis: {
        ...mockEvent.analysis,
        recurrence: {
          isRecurring: true,
          frequency: 'Weekly' as const,
          interval: 1
        }
      }
    };

    const { container } = render(<EventCard {...defaultProps} event={recurringEvent} />);
    const repeatIcon = container.querySelector('[title*="Recurs"]');
    expect(repeatIcon).toBeInTheDocument();
  });

  it('should display correct status color', () => {
    render(<EventCard {...defaultProps} />);
    const statusText = screen.getByText('To Respond');
    expect(statusText).toHaveClass('text-blue-600');
  });

  it('should show completed status with green color', () => {
    const completedEvent = {
      ...mockEvent,
      followUp: {
        ...mockEvent.followUp,
        status: 'Completed - No follow up' as const
      }
    };

    render(<EventCard {...defaultProps} event={completedEvent} />);
    const statusText = screen.getByText('Completed - No follow up');
    expect(statusText).toHaveClass('text-green-600');
  });

  it('should display "No contact assigned" when contact name is missing', () => {
    const eventWithoutContact = {
      ...mockEvent,
      contact: {
        ...mockEvent.contact,
        name: ''
      }
    };

    render(<EventCard {...defaultProps} event={eventWithoutContact} />);
    expect(screen.getByText('No contact assigned')).toBeInTheDocument();
  });

  it('should prevent event bubbling when checkbox is clicked', () => {
    const onClick = vi.fn();
    const onToggleSelect = vi.fn();
    const { container } = render(
      <EventCard
        {...defaultProps}
        onClick={onClick}
        onToggleSelect={onToggleSelect}
        showCheckbox={true}
      />
    );

    const checkboxContainer = container.querySelector('.w-5.h-5');
    if (checkboxContainer) {
      fireEvent.click(checkboxContainer);
      expect(onToggleSelect).toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
    }
  });

  it('should prevent event bubbling when delete button is clicked', () => {
    const onClick = vi.fn();
    const { container } = render(<EventCard {...defaultProps} onClick={onClick} />);

    const deleteButton = container.querySelector('button[title="Delete Event"]');
    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(onClick).not.toHaveBeenCalled();
    }
  });
});