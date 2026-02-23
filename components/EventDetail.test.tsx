import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { EventDetail } from './EventDetail';
import { EventData, Contact, Priority } from '../types';
import '@testing-library/jest-dom/vitest';

// Mock data
const mockContact: Contact = {
  id: 'c1',
  name: 'Existing Contact',
  email: 'existing@example.com',
  role: 'Manager',
  organization: 'Org A',
  notes: ''
};

const mockEvent: EventData = {
  id: '1',
  createdAt: Date.now(),
  originalText: '',
  analysis: {
    sender: 'Sender',
    eventName: 'Test Event',
    priority: Priority.High,
    theme: 'Theme A',
    institution: 'Institution A',
    date: '2024-01-01',
    description: 'Test Description',
    priorityScore: 80,
    priorityReasoning: 'Reason',
    linkedActivities: [],
    venue: 'Venue A',
    initialDeadline: '2024-01-05',
    finalDeadline: '2024-01-10'
  },
  contact: {
    contactId: 'c1',
    name: 'Existing Contact',
    email: 'existing@example.com',
    role: 'Manager',
    organization: 'Org A',
    repRole: 'Participant',
    polContact: 'Pol Contact',
    notes: ''
  },
  followUp: {
    status: 'To Respond',
    prepResources: '',
    briefing: '',
    postEventNotes: '',
    commsPack: {
        remarks: '',
        representative: '',
        datePlace: '',
        additionalInfo: ''
    }
  }
};

describe('EventDetail', () => {
  const defaultProps = {
    event: mockEvent,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    contacts: [mockContact],
    onViewContact: vi.fn(),
    onAddContact: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock crypto.randomUUID
    if (!global.crypto) {
      Object.defineProperty(global, 'crypto', {
        value: {
          randomUUID: () => 'new-uuid'
        },
        writable: true
      });
    } else {
        // If it exists but randomUUID is missing (common in some JSDOM versions)
        if (!global.crypto.randomUUID) {
            Object.defineProperty(global.crypto, 'randomUUID', {
                value: () => 'new-uuid',
                writable: true
            });
        }
    }
  });

  it('opens the new contact modal when "+ Create New Contact" is clicked', () => {
    render(<EventDetail {...defaultProps} />);

    // Switch to 'prep' tab where the contact picker is
    const prepTab = screen.getByText('Briefing & Prep');
    fireEvent.click(prepTab);

    // Open contact picker
    // Depending on state, button might say "Change Person" or "Assign Person"
    const changePersonButton = screen.getByText('Change Person');
    fireEvent.click(changePersonButton);

    // Click "+ Create New Contact"
    const createContactButton = screen.getByText('+ Create New Contact');
    fireEvent.click(createContactButton);

    // Verify modal opens
    expect(screen.getByText('Add New Contact')).toBeInTheDocument();
  });

  it('calls onAddContact and updates event when a new contact is saved', () => {
    render(<EventDetail {...defaultProps} />);

    // Navigate to modal
    fireEvent.click(screen.getByText('Briefing & Prep'));
    fireEvent.click(screen.getByText('Change Person'));
    fireEvent.click(screen.getByText('+ Create New Contact'));

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('e.g. Jane Doe'), { target: { value: 'New Person' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. jane@example.com'), { target: { value: 'new@example.com' } });

    // Save
    fireEvent.click(screen.getByText('Save Contact'));

    // Verify onAddContact called
    expect(defaultProps.onAddContact).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Person',
      email: 'new@example.com'
    }));

    // Verify UI updated to show new contact name
    // It replaces "Existing Contact" with "New Person" in the display
    expect(screen.getByText('New Person')).toBeInTheDocument();
  });
});
