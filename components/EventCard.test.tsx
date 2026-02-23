import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { EventCard } from './EventCard';
import { EventData, Priority, RepresentativeRole } from '../types';

const mockAnalysis = {
  sender: 'John Doe',
  senderEmail: 'john@example.com',
  subject: 'Invitation',
  institution: 'Test Institution',
  eventName: 'Test Event',
  theme: 'Education',
  description: 'Test Description',
  priority: Priority.High,
  priorityScore: 80,
  priorityReasoning: 'Important',
  date: '2023-10-27',
  venue: 'Test Venue',
  initialDeadline: '2023-10-20',
  finalDeadline: '2023-10-25',
  linkedActivities: ['Activity 1'],
  registrationLink: 'https://example.com/register',
  programmeLink: 'https://example.com/programme'
};

const mockContact = {
  id: 'c1',
  polContact: 'Jane Doe',
  name: 'Jane Doe',
  email: 'jane@example.com',
  role: 'Manager',
  organization: 'Test Org',
  repRole: 'Speaker' as RepresentativeRole,
  notes: 'None'
};

const mockFollowUp = {
  prepResources: 'Resources',
  briefing: 'Briefing',
  commsPack: {
    remarks: 'Remarks',
    representative: 'Rep',
    datePlace: 'DatePlace',
    additionalInfo: 'Info'
  },
  postEventNotes: 'Notes',
  status: 'To Respond' as const
};

const mockEvent: EventData = {
  id: 'e1',
  createdAt: 1234567890,
  originalText: 'Original Text',
  analysis: mockAnalysis,
  contact: mockContact,
  followUp: mockFollowUp
};

describe('EventCard Component', () => {
  it('renders event details correctly', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(
      <EventCard
        event={mockEvent}
        onSelect={onSelect}
        onDelete={onDelete}
        isSelected={false}
      />
    );

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Test Institution')).toBeInTheDocument();
    expect(screen.getByText('2023-10-27')).toBeInTheDocument();
    expect(screen.getByText('Test Venue')).toBeInTheDocument();
    expect(screen.getByText(/Contact: Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument(); // Assuming PriorityBadge renders "High Priority"
    expect(screen.getByText('To Respond')).toBeInTheDocument();
    expect(screen.getByText('To Respond')).toHaveClass('text-blue-600');
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(
      <EventCard
        event={mockEvent}
        onSelect={onSelect}
        onDelete={onDelete}
        isSelected={false}
      />
    );

    fireEvent.click(screen.getByLabelText(/View details for Test Event/));
    expect(onSelect).toHaveBeenCalledWith('e1');
  });

  it('supports keyboard selection (Enter)', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(
      <EventCard
        event={mockEvent}
        onSelect={onSelect}
        onDelete={onDelete}
        isSelected={false}
      />
    );

    const card = screen.getByLabelText(/View details for Test Event/);
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('e1');
  });

  it('supports keyboard selection (Space)', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(
      <EventCard
        event={mockEvent}
        onSelect={onSelect}
        onDelete={onDelete}
        isSelected={false}
      />
    );

    const card = screen.getByLabelText(/View details for Test Event/);
    fireEvent.keyDown(card, { key: ' ', code: 'Space' });
    expect(onSelect).toHaveBeenCalledWith('e1');
  });

  it('handles delete flow correctly', async () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(
      <EventCard
        event={mockEvent}
        onSelect={onSelect}
        onDelete={onDelete}
        isSelected={false}
      />
    );

    // Initial state: Modal should not be visible
    expect(screen.queryByText('Delete Invitation?')).not.toBeInTheDocument();

    // Click delete button
    const deleteButton = screen.getByLabelText('Delete Event');
    fireEvent.click(deleteButton);

    // Modal should appear
    expect(screen.getByText('Delete Invitation?')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete "Test Event"/)).toBeInTheDocument();

    // Click Delete Permanently
    const confirmButton = screen.getByText('Delete Permanently');
    fireEvent.click(confirmButton);

    expect(onDelete).toHaveBeenCalledWith('e1');
  });

  it('cancels delete flow correctly', async () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(
      <EventCard
        event={mockEvent}
        onSelect={onSelect}
        onDelete={onDelete}
        isSelected={false}
      />
    );

    // Click delete button
    fireEvent.click(screen.getByLabelText('Delete Event'));

    // Modal appears
    expect(screen.getByText('Delete Invitation?')).toBeInTheDocument();

    // Click Cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Modal disappears
    await waitFor(() => {
        expect(screen.queryByText('Delete Invitation?')).not.toBeInTheDocument();
    });

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('applies selected styling', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    const { rerender } = render(
      <EventCard
        event={mockEvent}
        onSelect={onSelect}
        onDelete={onDelete}
        isSelected={true}
      />
    );

    const card = screen.getByLabelText(/View details for Test Event/);
    expect(card).toHaveClass('border-blue-500');
    expect(card).toHaveClass('bg-blue-50');
    expect(card).toHaveClass('ring-1');
    expect(card).toHaveClass('ring-blue-500');

    rerender(
      <EventCard
        event={mockEvent}
        onSelect={onSelect}
        onDelete={onDelete}
        isSelected={false}
      />
    );

    expect(card).toHaveClass('border-slate-200');
    expect(card).toHaveClass('bg-white');
    expect(card).not.toHaveClass('border-blue-500');
  });

  it('applies correct status colors', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    const completedEvent = {
      ...mockEvent,
      followUp: { ...mockFollowUp, status: 'Completed - No follow up' as const }
    };

    const { rerender } = render(
      <EventCard
        event={completedEvent}
        onSelect={onSelect}
        onDelete={onDelete}
        isSelected={false}
      />
    );
    expect(screen.getByText('Completed - No follow up')).toHaveClass('text-green-600');

    const irrelevantEvent = {
        ...mockEvent,
        followUp: { ...mockFollowUp, status: 'Not Relevant' as const }
    };
    rerender(
        <EventCard
          event={irrelevantEvent}
          onSelect={onSelect}
          onDelete={onDelete}
          isSelected={false}
        />
    );
    expect(screen.getByText('Not Relevant')).toHaveClass('text-gray-400');
  });
});
