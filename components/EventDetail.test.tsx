import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventDetail } from './EventDetail';
import { EventData, Priority, Contact } from '../types';
import { vi, describe, it, expect } from 'vitest';
import React from 'react';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  User: () => <div data-testid="icon-user" />,
  Users: () => <div data-testid="icon-users" />,
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
  FileJson: () => <div data-testid="icon-file-json" />,
  FileSpreadsheet: () => <div data-testid="icon-file-spreadsheet" />,
}));

// Mock child components
vi.mock('./PriorityBadge', () => ({
  PriorityBadge: () => <div data-testid="priority-badge" />
}));
vi.mock('./ConfirmDeleteModal', () => ({
  ConfirmDeleteModal: () => <div data-testid="confirm-delete-modal" />
}));
vi.mock('./NewContactModal', () => ({
  NewContactModal: ({ isOpen, onSave }: any) => isOpen ? (
    <div data-testid="new-contact-modal">
      <button onClick={() => onSave({
        id: 'new-contact',
        name: 'New Person',
        email: 'new@example.com',
        role: 'CEO',
        organization: 'New Org',
        notes: ''
      })}>Save Contact</button>
    </div>
  ) : null
}));
vi.mock('../services/geminiService', () => ({
  generateBriefing: vi.fn().mockResolvedValue('Generated Briefing')
}));

const mockEvent: EventData = {
  id: '1',
  createdAt: Date.now(),
  originalText: 'Test Event',
  analysis: {
    sender: 'Sender',
    institution: 'Institution',
    eventName: 'Test Event',
    theme: 'Theme',
    description: 'Description',
    priority: Priority.High,
    priorityScore: 80,
    priorityReasoning: 'Reason',
    date: '2023-01-01',
    venue: 'Venue',
    initialDeadline: '2023-01-01',
    finalDeadline: '2023-01-01',
    linkedActivities: [],
  },
  contact: {
    polContact: 'Pol',
    name: '',
    email: '',
    role: '',
    organization: '',
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
  }
};

describe('EventDetail', () => {
  it('updates assigned person when a new contact is created', async () => {
    const onUpdate = vi.fn();
    const onAddContact = vi.fn();

    render(
      <EventDetail
        event={mockEvent}
        onUpdate={onUpdate}
        onDelete={() => {}}
        contacts={[]}
        onAddContact={onAddContact}
      />
    );

    // Switch to 'Prep' tab where contact assignment is
    // Wait for tab to be available
    const prepTab = await screen.findByText(/Prep/i);
    fireEvent.click(prepTab);

    // Click 'Assign Person'
    const assignBtn = await screen.findByText(/Assign Person/i);
    fireEvent.click(assignBtn);

    // Click '+ Create New Contact'
    const createBtn = await screen.findByText(/\+ Create New Contact/i);
    fireEvent.click(createBtn);

    // Find modal and save
    const saveBtn = await screen.findByText('Save Contact');
    fireEvent.click(saveBtn);

    // Verify 'New Person' is displayed in the UI (meaning localEvent was updated)
    await waitFor(() => {
      expect(screen.getByText('New Person')).toBeInTheDocument();
      expect(screen.getByText(/CEO @ New Org/i)).toBeInTheDocument();
    });

    // Verify onAddContact was called
    expect(onAddContact).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Person'
    }));
  });
});
