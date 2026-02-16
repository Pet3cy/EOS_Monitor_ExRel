// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ContactsView } from './ContactsView';
import { Contact, EventData } from '../types';
import { describe, it, expect, vi } from 'vitest';

const mockContacts: Contact[] = [
  { id: 'c1', name: 'Alice Smith', email: 'alice@example.com', role: 'Dev', organization: 'TechCorp', notes: '' },
  { id: 'c2', name: 'Bob Jones', email: 'bob@example.com', role: 'Manager', organization: 'BizInc', notes: '' },
  { id: 'c3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'Tester', organization: 'TechCorp', notes: '' },
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

    const searchInputs = screen.getAllByPlaceholderText('Search people...');
    searchInputs.forEach(input => fireEvent.change(input, { target: { value: 'Alice' } }));

    expect(screen.getAllByText('Alice Smith')[0]).toBeInTheDocument();
    expect(screen.queryAllByText('Bob Jones')).toHaveLength(0);
    expect(screen.queryAllByText('Charlie Brown')).toHaveLength(0);
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

    const searchInputs = screen.getAllByPlaceholderText('Search people...');
    searchInputs.forEach(input => fireEvent.change(input, { target: { value: 'TechCorp' } }));

    expect(screen.getAllByText('Alice Smith')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Charlie Brown')[0]).toBeInTheDocument();
    expect(screen.queryAllByText('Bob Jones')).toHaveLength(0);
  });
});
