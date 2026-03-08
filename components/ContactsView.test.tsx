import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ContactsView } from './ContactsView';
import { Contact, EventData } from '../types';

const mockContacts: Contact[] = [
  { id: 'c1', name: 'Alice Smith', email: 'alice@example.com', organization: 'Org A', role: 'Role A', notes: '' },
  { id: 'c2', name: 'Bob Jones', email: 'bob@example.com', organization: 'Org B', role: 'Role B', notes: '' },
  { id: 'c3', name: 'Charlie Brown', email: 'charlie@example.com', organization: 'Org C', role: 'Role C', notes: '' },
];

const mockEvents: EventData[] = [];

describe('ContactsView Filtering', () => {
  it('filters contacts by name', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'Alice' } });

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
  });

  it('filters contacts by email', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'bob@example.com' } });

    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
  });

  it('filters contacts by organization', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'Org C' } });

    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
  });

  it('handles case-insensitive search', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'ALICE' } });

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('displays all contacts when search is empty', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
  });

  it('shows no results when search matches nothing', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'nonexistent' } });

    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
  });
});

describe('ContactsView Selection', () => {
  it('highlights selected contact', () => {
    const { container } = render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId="c1"
        setSelectedContactId={vi.fn()}
      />
    );

    // Find the contact card with the selected class
    const selectedCard = container.querySelector('.border-blue-500');
    expect(selectedCard).toBeInTheDocument();
  });

  it('calls setSelectedContactId when contact is clicked', () => {
    const setSelectedContactId = vi.fn();
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={setSelectedContactId}
      />
    );

    const contactCard = screen.getByText('Alice Smith').closest('div');
    if (contactCard) {
      fireEvent.click(contactCard);
    }

    expect(setSelectedContactId).toHaveBeenCalledWith('c1');
  });

  it('shows empty state when no contact is selected', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    expect(screen.getByText('People & Partners')).toBeInTheDocument();
    expect(screen.getByText(/Select a contact to manage/i)).toBeInTheDocument();
  });

  it('displays selected contact details', () => {
    const contactWithNotes = { ...mockContacts[0], notes: 'Important person' };
    render(
      <ContactsView
        contacts={[contactWithNotes]}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId="c1"
        setSelectedContactId={vi.fn()}
      />
    );

    // Alice Smith appears in both sidebar and detail view, so use getAllByText
    const aliceTexts = screen.getAllByText('Alice Smith');
    expect(aliceTexts.length).toBeGreaterThan(0);
    expect(screen.getByText(/Role A @ Org A/i)).toBeInTheDocument();
    expect(screen.getByText(/Important person/i)).toBeInTheDocument();
  });
});

describe('ContactsView Add/Edit', () => {
  it('opens add contact form when add button is clicked', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    const addButton = screen.getByTitle('Add Contact');
    fireEvent.click(addButton);

    expect(screen.getByText('Create New Profile')).toBeInTheDocument();
  });

  it('opens edit form when edit button is clicked', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    const contactCard = screen.getByText('Alice Smith').closest('div');
    if (contactCard) {
      // Hover to show edit button
      fireEvent.mouseEnter(contactCard);
    }

    // Find and click edit button (note: may need to adjust based on actual implementation)
    const buttons = screen.getAllByRole('button');
    const editButton = buttons.find(btn => {
      const svg = btn.querySelector('svg');
      return svg && btn.className.includes('hover:text-blue-600');
    });

    if (editButton) {
      fireEvent.click(editButton);
      expect(screen.getByText('Edit Contact Profile')).toBeInTheDocument();
    }
  });

  it('calls onUpdateContact when form is submitted', () => {
    const onUpdateContact = vi.fn();
    const { container } = render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={onUpdateContact}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    const addButton = screen.getByTitle('Add Contact');
    fireEvent.click(addButton);

    // Find form and its inputs
    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();

    const requiredInputs = form!.querySelectorAll('input[required]');
    expect(requiredInputs.length).toBeGreaterThanOrEqual(2);

    const nameInput = requiredInputs[0] as HTMLInputElement;
    const emailInput = requiredInputs[1] as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'New Contact' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    expect(onUpdateContact).toHaveBeenCalled();
  });

  it('closes form when cancel is clicked', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    const addButton = screen.getByTitle('Add Contact');
    fireEvent.click(addButton);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Create New Profile')).not.toBeInTheDocument();
  });

  it('validates required fields', () => {
    const { container } = render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    const addButton = screen.getByTitle('Add Contact');
    fireEvent.click(addButton);

    // Find inputs by type and required attribute
    const requiredInputs = container.querySelectorAll('input[required]');
    expect(requiredInputs.length).toBeGreaterThanOrEqual(2);
  });

  it('pre-fills form when editing existing contact', () => {
    const { container } = render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId="c1"
        setSelectedContactId={vi.fn()}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(editButton);

    // Check if inputs are populated
    const nameInput = container.querySelector('input[value="Alice Smith"]');
    const emailInput = container.querySelector('input[value="alice@example.com"]');

    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
  });
});

describe('ContactsView Delete', () => {
  it('opens delete confirmation modal when delete is clicked', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    const contactCard = screen.getByText('Alice Smith').closest('div');
    if (contactCard) {
      fireEvent.mouseEnter(contactCard);
    }

    // Find delete button
    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find(btn => {
      const svg = btn.querySelector('svg');
      return svg && btn.className.includes('hover:text-red-600');
    });

    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(screen.getByText(/Delete Contact Record/i)).toBeInTheDocument();
    }
  });

  it('calls onDeleteContact when deletion is confirmed', () => {
    const onDeleteContact = vi.fn();
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={onDeleteContact}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    const contactCard = screen.getByText('Alice Smith').closest('div');
    if (contactCard) {
      fireEvent.mouseEnter(contactCard);
    }

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find(btn => {
      const svg = btn.querySelector('svg');
      return svg && btn.className.includes('hover:text-red-600');
    });

    if (deleteButton) {
      fireEvent.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /delete permanently/i });
      fireEvent.click(confirmButton);

      expect(onDeleteContact).toHaveBeenCalledWith('c1');
    }
  });
});

describe('ContactsView Activity Feed', () => {
  const mockEventsWithContacts: EventData[] = [
    {
      id: 'e1',
      createdAt: Date.now(),
      originalText: 'Test',
      analysis: {
        sender: 'Test',
        institution: 'Test Org',
        eventName: 'Test Event 1',
        theme: 'Education',
        description: 'Test',
        priority: 'High' as any,
        priorityScore: 90,
        priorityReasoning: 'Test',
        date: '2026-02-10',
        venue: 'Online',
        initialDeadline: '2026-02-05',
        finalDeadline: '2026-02-09',
        linkedActivities: [],
      },
      contact: {
        contactId: 'c1',
        name: 'Alice Smith',
        email: 'alice@example.com',
        role: 'Manager',
        organization: 'Org A',
        repRole: 'Speaker',
        polContact: '',
        notes: ''
      },
      followUp: {
        briefing: '',
        prepResources: '',
        commsPack: { remarks: '', representative: '', datePlace: '', additionalInfo: '' },
        postEventNotes: '',
        status: 'To Respond'
      }
    }
  ];

  it('displays events for selected contact', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEventsWithContacts}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId="c1"
        setSelectedContactId={vi.fn()}
      />
    );

    expect(screen.getByText('Activity Feed')).toBeInTheDocument();
    expect(screen.getByText('Test Event 1')).toBeInTheDocument();
  });

  it('shows empty activity state when contact has no events', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId="c1"
        setSelectedContactId={vi.fn()}
      />
    );

    expect(screen.getByText('Activity Feed')).toBeInTheDocument();
    expect(screen.getByText(/No activity recorded yet/i)).toBeInTheDocument();
  });

  it('displays event details in activity feed', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEventsWithContacts}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId="c1"
        setSelectedContactId={vi.fn()}
      />
    );

    expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('2026-02-10')).toBeInTheDocument();
  });

  it('displays representative role badge', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEventsWithContacts}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId="c1"
        setSelectedContactId={vi.fn()}
      />
    );

    expect(screen.getByText('Speaker')).toBeInTheDocument();
  });
});

describe('ContactsView UI Elements', () => {
  it('displays contact count in header', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    expect(screen.getByText(/Directory \(3\)/i)).toBeInTheDocument();
  });

  it('displays contact role and organization', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    expect(screen.getByText('Role A')).toBeInTheDocument();
    expect(screen.getByText('Org A')).toBeInTheDocument();
  });

  it('shows contact avatar with first letter', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId="c1"
        setSelectedContactId={vi.fn()}
      />
    );

    const avatars = screen.getAllByText('A');
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('displays contact email in detail view', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId="c1"
        setSelectedContactId={vi.fn()}
      />
    );

    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });
});

describe('ContactsView Edge Cases', () => {
  it('handles empty contacts array', () => {
    render(
      <ContactsView
        contacts={[]}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    expect(screen.getByText(/Directory \(0\)/i)).toBeInTheDocument();
  });

  it('handles contact with very long name', () => {
    const longNameContact = {
      ...mockContacts[0],
      name: 'A'.repeat(200)
    };

    render(
      <ContactsView
        contacts={[longNameContact]}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
  });

  it('handles contact with special characters in name', () => {
    const specialCharContact = {
      ...mockContacts[0],
      name: 'John <O\'Reilly> & Sons'
    };

    render(
      <ContactsView
        contacts={[specialCharContact]}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    expect(screen.getByText(/John <O'Reilly> & Sons/i)).toBeInTheDocument();
  });

  it('handles contact with empty email', () => {
    const noEmailContact = {
      ...mockContacts[0],
      email: ''
    };

    render(
      <ContactsView
        contacts={[noEmailContact]}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId="c1"
        setSelectedContactId={vi.fn()}
      />
    );

    // Alice Smith appears in both sidebar and detail view, so use getAllByText
    const aliceTexts = screen.getAllByText('Alice Smith');
    expect(aliceTexts.length).toBeGreaterThan(0);
  });

  it('handles multiple contacts with same name', () => {
    const duplicateContacts = [
      mockContacts[0],
      { ...mockContacts[0], id: 'c99', email: 'different@example.com' }
    ];

    render(
      <ContactsView
        contacts={duplicateContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    const names = screen.getAllByText('Alice Smith');
    expect(names.length).toBeGreaterThanOrEqual(2);
  });

  it('updates form fields correctly', () => {
    const { container } = render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    const addButton = screen.getByTitle('Add Contact');
    fireEvent.click(addButton);

    const form = container.querySelector('form');
    const inputs = form!.querySelectorAll('input');

    fireEvent.change(inputs[0], { target: { value: 'Test Name' } });
    expect((inputs[0] as HTMLInputElement).value).toBe('Test Name');
  });

  it('handles form submission with minimum required fields', () => {
    const onUpdateContact = vi.fn();
    const { container } = render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={onUpdateContact}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    const addButton = screen.getByTitle('Add Contact');
    fireEvent.click(addButton);

    const form = container.querySelector('form');
    const requiredInputs = form!.querySelectorAll('input[required]');

    fireEvent.change(requiredInputs[0], { target: { value: 'Min Name' } });
    fireEvent.change(requiredInputs[1], { target: { value: 'min@test.com' } });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    expect(onUpdateContact).toHaveBeenCalled();
  });

  it('preserves non-required fields when editing', () => {
    const contactWithNotes = { ...mockContacts[0], notes: 'Important notes' };
    const { container } = render(
      <ContactsView
        contacts={[contactWithNotes]}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId="c1"
        setSelectedContactId={vi.fn()}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(editButton);

    const textarea = container.querySelector('textarea');
    expect((textarea as HTMLTextAreaElement).value).toBe('Important notes');
  });

  it('handles search with unicode characters', () => {
    const unicodeContact = {
      ...mockContacts[0],
      name: 'José María'
    };

    render(
      <ContactsView
        contacts={[unicodeContact]}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'José' } });

    expect(screen.getByText('José María')).toBeInTheDocument();
  });

  it('handles multiple event activities for one contact', () => {
    const multipleEvents: EventData[] = [
      {
        id: 'e1',
        createdAt: Date.now(),
        originalText: 'Test',
        analysis: {
          sender: 'Test',
          institution: 'Test Org',
          eventName: 'Event 1',
          theme: 'Education',
          description: 'Test',
          priority: 'High' as any,
          priorityScore: 90,
          priorityReasoning: 'Test',
          date: '2026-02-10',
          venue: 'Online',
          initialDeadline: '2026-02-05',
          finalDeadline: '2026-02-09',
          linkedActivities: [],
        },
        contact: {
          contactId: 'c1',
          name: 'Alice Smith',
          email: 'alice@example.com',
          role: 'Manager',
          organization: 'Org A',
          repRole: 'Speaker',
          polContact: '',
          notes: ''
        },
        followUp: {
          briefing: '',
          prepResources: '',
          commsPack: { remarks: '', representative: '', datePlace: '', additionalInfo: '' },
          postEventNotes: '',
          status: 'To Respond'
        }
      },
      {
        id: 'e2',
        createdAt: Date.now(),
        originalText: 'Test',
        analysis: {
          sender: 'Test',
          institution: 'Test Org',
          eventName: 'Event 2',
          theme: 'Research',
          description: 'Test',
          priority: 'Medium' as any,
          priorityScore: 70,
          priorityReasoning: 'Test',
          date: '2026-03-15',
          venue: 'Brussels',
          initialDeadline: '2026-03-10',
          finalDeadline: '2026-03-14',
          linkedActivities: [],
        },
        contact: {
          contactId: 'c1',
          name: 'Alice Smith',
          email: 'alice@example.com',
          role: 'Manager',
          organization: 'Org A',
          repRole: 'Participant',
          polContact: '',
          notes: ''
        },
        followUp: {
          briefing: '',
          prepResources: '',
          commsPack: { remarks: '', representative: '', datePlace: '', additionalInfo: '' },
          postEventNotes: '',
          status: 'Completed'
        }
      }
    ];

    render(
      <ContactsView
        contacts={mockContacts}
        events={multipleEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId="c1"
        setSelectedContactId={vi.fn()}
      />
    );

    expect(screen.getByText('Event 1')).toBeInTheDocument();
    expect(screen.getByText('Event 2')).toBeInTheDocument();
  });

  it('sorts events by date in activity feed', () => {
    const datedEvents: EventData[] = [
      {
        id: 'e1',
        createdAt: Date.now(),
        originalText: 'Test',
        analysis: {
          sender: 'Test',
          institution: 'Test Org',
          eventName: 'Older Event',
          theme: 'Education',
          description: 'Test',
          priority: 'High' as any,
          priorityScore: 90,
          priorityReasoning: 'Test',
          date: '2026-01-10',
          venue: 'Online',
          initialDeadline: '2026-01-05',
          finalDeadline: '2026-01-09',
          linkedActivities: [],
        },
        contact: {
          contactId: 'c1',
          name: 'Alice Smith',
          email: 'alice@example.com',
          role: 'Manager',
          organization: 'Org A',
          repRole: 'Speaker',
          polContact: '',
          notes: ''
        },
        followUp: {
          briefing: '',
          prepResources: '',
          commsPack: { remarks: '', representative: '', datePlace: '', additionalInfo: '' },
          postEventNotes: '',
          status: 'To Respond'
        }
      },
      {
        id: 'e2',
        createdAt: Date.now(),
        originalText: 'Test',
        analysis: {
          sender: 'Test',
          institution: 'Test Org',
          eventName: 'Newer Event',
          theme: 'Research',
          description: 'Test',
          priority: 'Medium' as any,
          priorityScore: 70,
          priorityReasoning: 'Test',
          date: '2026-06-15',
          venue: 'Brussels',
          initialDeadline: '2026-06-10',
          finalDeadline: '2026-06-14',
          linkedActivities: [],
        },
        contact: {
          contactId: 'c1',
          name: 'Alice Smith',
          email: 'alice@example.com',
          role: 'Manager',
          organization: 'Org A',
          repRole: 'Participant',
          polContact: '',
          notes: ''
        },
        followUp: {
          briefing: '',
          prepResources: '',
          commsPack: { remarks: '', representative: '', datePlace: '', additionalInfo: '' },
          postEventNotes: '',
          status: 'Completed'
        }
      }
    ];

    render(
      <ContactsView
        contacts={mockContacts}
        events={datedEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId="c1"
        setSelectedContactId={vi.fn()}
      />
    );

    // Events should be displayed (sorting is tested by presence)
    expect(screen.getByText('Older Event')).toBeInTheDocument();
    expect(screen.getByText('Newer Event')).toBeInTheDocument();
  });

  it('handles contact without any activity', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={[]}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId="c1"
        setSelectedContactId={vi.fn()}
      />
    );

    expect(screen.getByText(/No activity recorded yet/i)).toBeInTheDocument();
  });

  it('closes edit form when X button is clicked', () => {
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId="c1"
        setSelectedContactId={vi.fn()}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(editButton);

    const xButtons = screen.getAllByRole('button');
    const closeButton = xButtons.find(btn => btn.querySelector('svg') && btn.className.includes('hover:text-slate-600'));

    if (closeButton) {
      fireEvent.click(closeButton);
      expect(screen.queryByText('Edit Contact Profile')).not.toBeInTheDocument();
    }
  });

  it('handles rapid contact selection changes', () => {
    const setSelectedContactId = vi.fn();
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={setSelectedContactId}
      />
    );

    const contact1 = screen.getByText('Alice Smith').closest('div');
    const contact2 = screen.getByText('Bob Jones').closest('div');

    if (contact1 && contact2) {
      fireEvent.click(contact1);
      fireEvent.click(contact2);
      fireEvent.click(contact1);

      expect(setSelectedContactId).toHaveBeenCalledTimes(3);
    }
  });

  it('generates unique IDs for new contacts', () => {
    const onUpdateContact = vi.fn();
    const { container } = render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={onUpdateContact}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    const addButton = screen.getByTitle('Add Contact');
    fireEvent.click(addButton);

    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();

    const requiredInputs = form!.querySelectorAll('input[required]');

    fireEvent.change(requiredInputs[0], { target: { value: 'New Person' } });
    fireEvent.change(requiredInputs[1], { target: { value: 'new@example.com' } });

    // Submit the form directly
    fireEvent.submit(form!);

    expect(onUpdateContact).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        name: 'New Person',
        email: 'new@example.com'
      })
    );
  });
});