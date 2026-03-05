import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventCard } from './EventCard';
import { EventData, Priority } from '../types';

const createMockEvent = (overrides?: Partial<EventData>): EventData => ({
  id: 'test-event-1',
  createdAt: Date.now(),
  originalText: 'Test invitation text',
  analysis: {
    sender: 'John Doe',
    institution: 'Test University',
    eventName: 'Test Conference 2026',
    theme: 'Education',
    description: 'A test conference about education',
    priority: Priority.High,
    priorityScore: 85,
    priorityReasoning: 'High relevance to our mission',
    date: '2026-06-15',
    venue: 'Brussels',
    initialDeadline: '2026-05-01',
    finalDeadline: '2026-05-15',
    linkedActivities: ['Activity 1'],
  },
  contact: {
    polContact: '',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Coordinator',
    organization: 'Test Org',
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
  ...overrides,
});

describe('EventCard', () => {
  const defaultProps = {
    event: createMockEvent(),
    onSelect: vi.fn(),
    onDelete: vi.fn(),
    isSelected: false,
  };

  it('should render event card with basic information', () => {
    render(<EventCard {...defaultProps} />);

    expect(screen.getByText('Test Conference 2026')).toBeInTheDocument();
    expect(screen.getByText('Test University')).toBeInTheDocument();
    expect(screen.getByText('2026-06-15')).toBeInTheDocument();
    expect(screen.getByText('Brussels')).toBeInTheDocument();
  });

  it('should display contact information when contact exists', () => {
    render(<EventCard {...defaultProps} />);

    expect(screen.getByText('Contact: Jane Smith')).toBeInTheDocument();
  });

  it('should display "No contact assigned" when contact name is empty', () => {
    const eventWithoutContact = createMockEvent({
      contact: {
        polContact: '',
        name: '',
        email: '',
        role: '',
        organization: '',
        repRole: 'Participant',
        notes: '',
      },
    });

    render(<EventCard {...defaultProps} event={eventWithoutContact} />);

    expect(screen.getByText('No contact assigned')).toBeInTheDocument();
  });

  it('should call onSelect when card is clicked', () => {
    const onSelect = vi.fn();
    render(<EventCard {...defaultProps} onSelect={onSelect} />);

    const card = screen.getByLabelText('View details for Test Conference 2026');
    fireEvent.click(card);

    expect(onSelect).toHaveBeenCalledWith('test-event-1');
  });

  it('should call onSelect when Enter key is pressed', () => {
    const onSelect = vi.fn();
    render(<EventCard {...defaultProps} onSelect={onSelect} />);

    const card = screen.getByLabelText('View details for Test Conference 2026');
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith('test-event-1');
  });

  it('should call onSelect when Space key is pressed', () => {
    const onSelect = vi.fn();
    render(<EventCard {...defaultProps} onSelect={onSelect} />);

    const card = screen.getByLabelText('View details for Test Conference 2026');
    fireEvent.keyDown(card, { key: ' ' });

    expect(onSelect).toHaveBeenCalledWith('test-event-1');
  });

  it('should apply selected styles when isSelected is true', () => {
    render(<EventCard {...defaultProps} isSelected={true} />);

    const card = screen.getByLabelText('View details for Test Conference 2026');
    expect(card).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('should apply unselected styles when isSelected is false', () => {
    render(<EventCard {...defaultProps} isSelected={false} />);

    const card = screen.getByLabelText('View details for Test Conference 2026');
    expect(card).toHaveClass('border-slate-200', 'bg-white');
  });

  it('should show delete confirmation modal when delete button is clicked', () => {
    render(<EventCard {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: 'Delete Event' });
    fireEvent.click(deleteButton);

    expect(screen.getByText('Delete Invitation?')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete "Test Conference 2026"/)).toBeInTheDocument();
  });

  it('should call onDelete when delete is confirmed', () => {
    const onDelete = vi.fn();
    render(<EventCard {...defaultProps} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: 'Delete Event' });
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByText('Delete Permanently');
    fireEvent.click(confirmButton);

    expect(onDelete).toHaveBeenCalledWith('test-event-1');
  });

  it('should not call onSelect when delete button is clicked', () => {
    const onSelect = vi.fn();
    render(<EventCard {...defaultProps} onSelect={onSelect} />);

    const deleteButton = screen.getByRole('button', { name: 'Delete Event' });
    fireEvent.click(deleteButton);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('should render PriorityBadge component', () => {
    render(<EventCard {...defaultProps} />);

    expect(screen.getByText('High Priority')).toBeInTheDocument();
  });

  describe('Status colors', () => {
    it('should apply green color for Completed status', () => {
      const event = createMockEvent({
        followUp: {
          ...defaultProps.event.followUp,
          status: 'Completed - No follow up',
        },
      });

      render(<EventCard {...defaultProps} event={event} />);

      const statusElement = screen.getByText('Completed - No follow up');
      expect(statusElement).toHaveClass('text-green-600');
    });

    it('should apply gray color for Not Relevant status', () => {
      const event = createMockEvent({
        followUp: {
          ...defaultProps.event.followUp,
          status: 'Not Relevant',
        },
      });

      render(<EventCard {...defaultProps} event={event} />);

      const statusElement = screen.getByText('Not Relevant');
      expect(statusElement).toHaveClass('text-slate-400');
    });

    it('should apply blue color for To Respond status', () => {
      const event = createMockEvent({
        followUp: {
          ...defaultProps.event.followUp,
          status: 'To Respond',
        },
      });

      render(<EventCard {...defaultProps} event={event} />);

      const statusElement = screen.getByText('To Respond');
      expect(statusElement).toHaveClass('text-blue-600');
    });

    it('should apply default color for other statuses', () => {
      const event = createMockEvent({
        followUp: {
          ...defaultProps.event.followUp,
          status: 'Prep ready',
        },
      });

      render(<EventCard {...defaultProps} event={event} />);

      const statusElement = screen.getByText('Prep ready');
      expect(statusElement).toHaveClass('text-slate-500');
    });
  });

  it('should have proper accessibility attributes', () => {
    render(<EventCard {...defaultProps} />);

    const card = screen.getByLabelText('View details for Test Conference 2026');
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-label', 'View details for Test Conference 2026');
  });

  it('should truncate long text with line-clamp', () => {
    const longNameEvent = createMockEvent({
      analysis: {
        ...defaultProps.event.analysis,
        eventName: 'This is a very long event name that should be truncated with line-clamp-1',
      },
    });

    render(<EventCard {...defaultProps} event={longNameEvent} />);

    const eventName = screen.getByText(/This is a very long event name/);
    expect(eventName).toHaveClass('line-clamp-1');
  });

  it('should close delete modal when Cancel is clicked', () => {
    render(<EventCard {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: 'Delete Event' });
    fireEvent.click(deleteButton);

    expect(screen.getByText('Delete Invitation?')).toBeInTheDocument();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Delete Invitation?')).not.toBeInTheDocument();
  });
});