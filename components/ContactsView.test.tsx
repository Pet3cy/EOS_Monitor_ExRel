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
});
