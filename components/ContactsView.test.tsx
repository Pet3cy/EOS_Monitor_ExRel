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

  it('shows all contacts when search term is empty', () => {
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

  it('shows no contacts when search matches nothing', () => {
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
    fireEvent.change(input, { target: { value: 'xyznotfound' } });

    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
    expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument();
  });
});

describe('ContactsView — directory count', () => {
  it('shows contacts.length total count in directory header, not filtered count', () => {
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

    // Header always shows the total (3), not the filtered count
    expect(screen.getByText(/directory \(3\)/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'Alice' } });

    // Total count stays at 3 even though only 1 is visible
    expect(screen.getByText(/directory \(3\)/i)).toBeInTheDocument();
  });
});

describe('ContactsView — add contact form', () => {
  it('shows the add contact form when the Add Contact button is clicked', () => {
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

  it('hides the add contact form when Cancel is clicked', () => {
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

    fireEvent.click(screen.getByTitle('Add Contact'));
    expect(screen.getByText('Create New Profile')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText('Create New Profile')).not.toBeInTheDocument();
  });

  it('calls onUpdateContact when a new contact form is submitted', () => {
    const onUpdateContact = vi.fn();
    render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={onUpdateContact}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTitle('Add Contact'));

    // The form renders inputs without explicit accessible names (no htmlFor/id).
    // getAllByRole('textbox') returns: [0] search input, [1] name, [2] email, [3] role, [4] org
    const allTextboxes = screen.getAllByRole('textbox');
    const nameInput = allTextboxes[1];
    const emailInput = allTextboxes[2];
    fireEvent.change(nameInput, { target: { value: 'New Person' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(onUpdateContact).toHaveBeenCalledTimes(1);
    expect(onUpdateContact).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Person', email: 'new@example.com' })
    );
  });
});

describe('ContactsView — contact selection', () => {
  it('calls setSelectedContactId when a contact card is clicked', () => {
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

    fireEvent.click(screen.getByText('Alice Smith'));
    expect(setSelectedContactId).toHaveBeenCalledWith('c1');
  });

  it('highlights the selected contact', () => {
    const { container } = render(
      <ContactsView
        contacts={mockContacts}
        events={mockEvents}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId="c2"
        setSelectedContactId={vi.fn()}
      />
    );

    // The selected card has a blue border class
    const selectedCard = container.querySelector('.border-blue-500');
    expect(selectedCard).not.toBeNull();
    expect(selectedCard?.textContent).toContain('Bob Jones');
  });
});

describe('ContactsView — prop interface (onUpdateEvent removed)', () => {
  it('renders without error when onUpdateEvent prop is not provided (removed prop)', () => {
    // This test confirms the component no longer requires the onUpdateEvent prop
    // that was removed in this PR. It should mount cleanly without it.
    expect(() => render(
      <ContactsView
        contacts={[]}
        events={[]}
        onUpdateContact={vi.fn()}
        onDeleteContact={vi.fn()}
        selectedContactId={null}
        setSelectedContactId={vi.fn()}
      />
    )).not.toThrow();
  });
});