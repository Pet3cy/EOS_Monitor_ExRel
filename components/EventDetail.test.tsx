import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EventDetail } from './EventDetail';
import { EventData, Priority } from '../types';

// Mock Lucide icons to avoid rendering issues
vi.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="icon-calendar" />,
  MapPin: () => <div data-testid="icon-map-pin" />,
  Building2: () => <div data-testid="icon-building" />,
  AlertCircle: () => <div data-testid="icon-alert" />,
  FileText: () => <div data-testid="icon-file-text" />,
  CheckCircle: () => <div data-testid="icon-check-circle" />,
  Save: () => <div data-testid="icon-save" />,
  Loader2: () => <div data-testid="icon-loader" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
  ExternalLink: () => <div data-testid="icon-external-link" />,
  Briefcase: () => <div data-testid="icon-briefcase" />,
  Trash2: () => <div data-testid="icon-trash" />,
  Users: () => <div data-testid="icon-users" />,
  User: () => <div data-testid="icon-user" />,
  FileJson: () => <div data-testid="icon-file-json" />,
  FileSpreadsheet: () => <div data-testid="icon-file-spreadsheet" />,
}));

// Mock child components
vi.mock('./PriorityBadge', () => ({
  PriorityBadge: ({ priority }: { priority: string }) => <div>Priority: {priority}</div>
}));

vi.mock('./ConfirmDeleteModal', () => ({
  ConfirmDeleteModal: () => <div data-testid="confirm-delete-modal" />
}));

vi.mock('./NewContactModal', () => ({
  NewContactModal: () => <div data-testid="new-contact-modal" />
}));

const mockEvent1: EventData = {
  id: '1',
  createdAt: 1234567890,
  originalText: 'Test Event 1',
  analysis: {
    eventName: 'Event One',
    institution: 'Institution A',
    date: '2024-01-01',
    venue: 'Venue A',
    priority: Priority.High,
    priorityScore: 90,
    priorityReasoning: 'Important',
    theme: 'Theme A',
    description: 'Description A',
    initialDeadline: '2024-01-01',
    finalDeadline: '2024-01-01',
    linkedActivities: [],
    sender: 'Sender A'
  },
  contact: {
    polContact: 'Contact A',
    name: 'Contact A',
    email: 'a@example.com',
    role: 'Role A',
    organization: 'Org A',
    repRole: 'Participant',
    notes: ''
  },
  followUp: {
    status: 'To Respond',
    briefing: '',
    prepResources: '',
    postEventNotes: '',
    commsPack: {
      remarks: '',
      representative: '',
      datePlace: '',
      additionalInfo: ''
    }
  }
};

const mockEvent2: EventData = {
  ...mockEvent1,
  id: '2',
  analysis: {
    ...mockEvent1.analysis,
    eventName: 'Event Two',
    institution: 'Institution B'
  }
};

describe('EventDetail', () => {
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  it('updates displayed event when key prop changes', () => {
    const { rerender } = render(
      <EventDetail
        key={mockEvent1.id}
        event={mockEvent1}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Event One')).toBeInTheDocument();
    expect(screen.getByText('Institution A')).toBeInTheDocument();

    // Rerender with new event AND new key to simulate App.tsx behavior
    rerender(
      <EventDetail
        key={mockEvent2.id}
        event={mockEvent2}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Event Two')).toBeInTheDocument();
    expect(screen.getByText('Institution B')).toBeInTheDocument();
    expect(screen.queryByText('Event One')).not.toBeInTheDocument();
  });

  it('updates displayed event when same key but event prop data changes', () => {
    const updatedEvent1: EventData = {
      ...mockEvent1,
      analysis: {
        ...mockEvent1.analysis,
        eventName: 'Updated Event One',
        institution: 'Updated Institution A'
      }
    };

    const { rerender } = render(
      <EventDetail
        key={mockEvent1.id}
        event={mockEvent1}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Event One')).toBeInTheDocument();
    expect(screen.getByText('Institution A')).toBeInTheDocument();

    // Rerender with same key but updated data to simulate external mutation
    // (e.g., contact propagation or stakeholder rename)
    rerender(
      <EventDetail
        key={mockEvent1.id}
        event={updatedEvent1}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Updated Event One')).toBeInTheDocument();
    expect(screen.getByText('Updated Institution A')).toBeInTheDocument();
    expect(screen.queryByText('Event One')).not.toBeInTheDocument();
  });
});
