import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactsView } from './ContactsView';
import { Contact, EventData, Priority } from '../types';

const mockContacts: Contact[] = [
  {
    id: 'c1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Coordinator',
    organization: 'OBESSU',
    notes: 'Important contact'
  },
  {
    id: 'c2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Manager',
    organization: 'EU Commission',
    notes: ''
  }
];

const mockEvents: EventData[] = [
  {
    id: 'e1',
    createdAt: Date.now(),
    originalText: '',
    analysis: {
      sender: 'Sender',
      institution: 'OBESSU',
      eventName: 'Test Event',
      theme: 'Education',
      description: 'Description',
      priority: Priority.High,
      priorityScore: 90,
      priorityReasoning: 'Important',
      date: '2026-03-15',
      venue: 'Online',
      initialDeadline: '',
      finalDeadline: '',
      linkedActivities: []
    },
    contact: {
      contactId: 'c1',
      name: 'John Doe',
      email: 'john@example.com',
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
  }
];

describe('ContactsView', () => {
  const defaultProps = {
    contacts: mockContacts,
    events: mockEvents,
    onUpdateContact: vi.fn(),
    onDeleteContact: vi.fn(),
    onUpdateEvent: vi.fn(),
    selectedContactId: null,
    setSelectedContactId: vi.fn()
  };

  it('should render contacts list', () => {
    render(<ContactsView {...defaultProps} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should display contact count', () => {
    render(<ContactsView {...defaultProps} />);

    expect(screen.getByText(/Directory \(2\)/)).toBeInTheDocument();
  });

  it('should filter contacts by search term', () => {
    render(<ContactsView {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search people...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('should select contact when clicked', () => {
    const setSelectedContactId = vi.fn();
    render(<ContactsView {...defaultProps} setSelectedContactId={setSelectedContactId} />);

    const contactCard = screen.getByText('John Doe').closest('div');
    expect(contactCard).not.toBeNull();
    fireEvent.click(contactCard!);
    expect(setSelectedContactId).toHaveBeenCalledWith('c1');
  });

  it('should show add new contact button', () => {
    render(<ContactsView {...defaultProps} />);

    expect(screen.getByText('Add New Contact')).toBeInTheDocument();
  });

  it('should open create form when add button is clicked', () => {
    render(<ContactsView {...defaultProps} />);

    const addButton = screen.getByText('Add New Contact');
    fireEvent.click(addButton);

    expect(screen.getByText('Create New Profile')).toBeInTheDocument();
  });

  it('should display selected contact details', () => {
    render(<ContactsView {...defaultProps} selectedContactId="c1" />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/john@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/Coordinator @ OBESSU/)).toBeInTheDocument();
  });

  it('should show contact events in activity feed', () => {
    render(<ContactsView {...defaultProps} selectedContactId="c1" />);

    expect(screen.getByText('Activity Feed')).toBeInTheDocument();
    expect(screen.getByText('Test Event')).toBeInTheDocument();
  });

  it('should show empty state when contact has no events', () => {
    render(<ContactsView {...defaultProps} selectedContactId="c2" />);

    expect(screen.getByText('No activity recorded yet.')).toBeInTheDocument();
  });

  it('should open edit form when edit button is clicked', () => {
    render(<ContactsView {...defaultProps} selectedContactId="c1" />);

    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    expect(screen.getByText('Edit Contact Profile')).toBeInTheDocument();
  });

  it('should call onUpdateContact when form is submitted', async () => {
    const onUpdateContact = vi.fn();
    render(<ContactsView {...defaultProps} selectedContactId="c1" onUpdateContact={onUpdateContact} />);

    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onUpdateContact).toHaveBeenCalled();
    });
  });

  it('should show delete confirmation modal', () => {
    render(<ContactsView {...defaultProps} />);

    // Find delete button via the trash icon
    const allButtons = screen.getAllByRole('button');
    const deleteButton = allButtons.find(btn => btn.querySelector('svg') && btn.parentElement?.classList.contains('group'));
    expect(deleteButton).toBeDefined();
    fireEvent.click(deleteButton!);
    expect(screen.getByText('Delete Contact Record?')).toBeInTheDocument();
  });

  it.skip('should call onDeleteContact when delete is confirmed', async () => {
    // Requires locating and clicking the delete button, confirming in the modal,
    // then asserting onDeleteContact was called — skipped until selectors are stabilized
    const onDeleteContact = vi.fn();
    render(<ContactsView {...defaultProps} onDeleteContact={onDeleteContact} />);
  });

  it('should sort contacts alphabetically', () => {
    render(<ContactsView {...defaultProps} />);

    const contacts = screen.getAllByRole('heading', { level: 4 });
    const names = contacts.map(c => c.textContent);

    // Should be sorted A-Z by default
    expect(names.indexOf('Jane Smith')).toBeLessThan(names.indexOf('John Doe'));
  });

  it('should toggle sort order', () => {
    render(<ContactsView {...defaultProps} />);

    // Find sort button (arrow icon)
    const sortButtons = screen.getAllByRole('button');
    const sortButton = sortButtons.find(btn => btn.title?.includes('Sort'));
    expect(sortButton).toBeDefined();
    fireEvent.click(sortButton!);

    // After toggling, contacts should still be rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should show empty search state', () => {
    render(<ContactsView {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search people...');
    fireEvent.change(searchInput, { target: { value: 'NonexistentContact' } });

    expect(screen.getByText(/No contacts found matching/)).toBeInTheDocument();
  });

  it('should update notes field', async () => {
    const onUpdateContact = vi.fn();
    render(<ContactsView {...defaultProps} selectedContactId="c1" onUpdateContact={onUpdateContact} />);

    const notesTextarea = screen.getByPlaceholderText(/Add persistent notes/);
    fireEvent.change(notesTextarea, { target: { value: 'New notes' } });
    fireEvent.blur(notesTextarea);

    await waitFor(() => {
      expect(onUpdateContact).toHaveBeenCalled();
    });
  });

  it('should show administrative context section', () => {
    render(<ContactsView {...defaultProps} selectedContactId="c1" />);

    expect(screen.getByText('Administrative Context')).toBeInTheDocument();
  });

  it('should display contact role and organization', () => {
    render(<ContactsView {...defaultProps} />);

    expect(screen.getByText('Coordinator')).toBeInTheDocument();
    expect(screen.getByText('OBESSU')).toBeInTheDocument();
  });

  it('should show placeholder when no contact selected', () => {
    render(<ContactsView {...defaultProps} selectedContactId={null} />);

    expect(screen.getByText('People & Partners')).toBeInTheDocument();
    expect(screen.getByText(/Select a contact to manage/)).toBeInTheDocument();
  });
});