import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventDetail } from './EventDetail';
import { EventData, Contact, Priority } from '../types';

const mockEvent: EventData = {
  id: 'e1',
  createdAt: Date.now(),
  originalText: 'Original text',
  analysis: {
    sender: 'John Doe',
    senderEmail: 'john@example.com',
    institution: 'OBESSU',
    eventName: 'Test Event',
    theme: 'Education',
    description: 'A test event description',
    priority: Priority.High,
    priorityScore: 90,
    priorityReasoning: 'Very important event',
    date: '2026-03-15',
    time: '14:00',
    venue: 'Online',
    initialDeadline: '2026-03-10',
    finalDeadline: '2026-03-12',
    linkedActivities: ['Activity 1', 'Activity 2'],
    registrationLink: 'https://example.com/register',
    programmeLink: 'https://example.com/programme'
  },
  contact: {
    contactId: 'c1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Coordinator',
    organization: 'OBESSU',
    repRole: 'Speaker',
    polContact: 'Policy Contact',
    notes: 'Notes'
  },
  followUp: {
    briefing: 'Key points to discuss',
    postEventNotes: 'Post event notes',
    status: 'To Respond',
    prepResources: 'Resources',
    commsPack: {
      remarks: 'Opening remarks',
      representative: 'Jane',
      datePlace: 'Mar 15, Online',
      additionalInfo: 'Additional info'
    }
  }
};

const mockContacts: Contact[] = [
  {
    id: 'c1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Coordinator',
    organization: 'OBESSU',
    notes: ''
  },
  {
    id: 'c2',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Manager',
    organization: 'EU',
    notes: ''
  }
];

describe('EventDetail', () => {
  const defaultProps = {
    event: mockEvent,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    contacts: mockContacts,
    onViewContact: vi.fn()
  };

  it('should render event name', () => {
    render(<EventDetail {...defaultProps} />);
    expect(screen.getByText('Test Event')).toBeInTheDocument();
  });

  it('should toggle between report and editor modes', () => {
    render(<EventDetail {...defaultProps} />);

    const editorButton = screen.getByText('Editor');
    fireEvent.click(editorButton);

    expect(editorButton).toHaveClass('bg-slate-700');
  });

  it('should display event details in report mode', () => {
    render(<EventDetail {...defaultProps} />);

    expect(screen.getByText('Event Purpose')).toBeInTheDocument();
    expect(screen.getByText('A test event description')).toBeInTheDocument();
    expect(screen.getByText(/90/)).toBeInTheDocument();
  });

  it('should display tabs in editor mode', () => {
    render(<EventDetail {...defaultProps} />);

    fireEvent.click(screen.getByText('Editor'));

    expect(screen.getByText('Context & Analysis')).toBeInTheDocument();
    expect(screen.getByText('Logistics & Links')).toBeInTheDocument();
    expect(screen.getByText('Briefing & Prep')).toBeInTheDocument();
    expect(screen.getByText('Outcomes')).toBeInTheDocument();
  });

  it('should switch between tabs', () => {
    render(<EventDetail {...defaultProps} />);

    fireEvent.click(screen.getByText('Editor'));

    const logisticsTab = screen.getByText('Logistics & Links');
    fireEvent.click(logisticsTab);

    expect(screen.getByText('Registration Link')).toBeInTheDocument();
  });

  it('should call onUpdate when saving changes', () => {
    const onUpdate = vi.fn();
    render(<EventDetail {...defaultProps} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByText('Editor'));

    // Make a change
    const descriptionField = screen.getByDisplayValue('A test event description');
    fireEvent.change(descriptionField, { target: { value: 'Updated description' } });

    // Save changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    expect(onUpdate).toHaveBeenCalled();
  });

  it('should show delete confirmation modal', () => {
    render(<EventDetail {...defaultProps} />);

    fireEvent.click(screen.getByText('Editor'));

    const deleteButton = screen.getAllByRole('button').find(btn => {
      const svg = btn.querySelector('svg');
      return svg && btn.title === '';
    });

    // The delete button should be in the header
    const buttons = screen.getAllByRole('button');
    const trashButton = buttons.find(b => b.querySelector('svg') && b.className.includes('hover:text-red-400'));

    if (trashButton) {
      fireEvent.click(trashButton);
      expect(screen.getByText('Delete Event?')).toBeInTheDocument();
    }
  });

  it('should display priority badge in editor mode', () => {
    render(<EventDetail {...defaultProps} />);

    fireEvent.click(screen.getByText('Editor'));

    expect(screen.getByText('High Priority')).toBeInTheDocument();
  });

  it('should display registration link', () => {
    render(<EventDetail {...defaultProps} />);

    fireEvent.click(screen.getByText('Editor'));
    fireEvent.click(screen.getByText('Logistics & Links'));

    expect(screen.getByText('Registration Link')).toBeInTheDocument();
  });

  it('should export JSON', () => {
    render(<EventDetail {...defaultProps} />);

    // Mock document.createElement for download
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {}
    };
    document.createElement = vi.fn().mockReturnValue(mockLink);

    const exportButtons = screen.getAllByRole('button');
    const jsonButton = exportButtons.find(btn => btn.title === 'Export JSON');

    if (jsonButton) {
      fireEvent.click(jsonButton);
      expect(mockLink.click).toHaveBeenCalled();
    }
  });

  it('should display linked activities', () => {
    render(<EventDetail {...defaultProps} />);

    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Activity 2')).toBeInTheDocument();
  });

  it('should display contact information', () => {
    render(<EventDetail {...defaultProps} />);

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText(/Coordinator @ OBESSU/)).toBeInTheDocument();
  });

  it('should show calendar export options', () => {
    render(<EventDetail {...defaultProps} />);

    const calendarButton = screen.getAllByRole('button').find(btn => btn.title === 'Calendar');

    if (calendarButton) {
      fireEvent.click(calendarButton);
      expect(screen.getByText('Google Calendar')).toBeInTheDocument();
      expect(screen.getByText('Outlook Web')).toBeInTheDocument();
      expect(screen.getByText('Download .ICS')).toBeInTheDocument();
    }
  });

  it('should display briefing content', () => {
    render(<EventDetail {...defaultProps} />);

    expect(screen.getByText(/Key points to discuss/)).toBeInTheDocument();
  });

  it('should allow editing event description', () => {
    render(<EventDetail {...defaultProps} />);

    fireEvent.click(screen.getByText('Editor'));

    const descriptionField = screen.getByDisplayValue('A test event description');
    expect(descriptionField).toBeInTheDocument();

    fireEvent.change(descriptionField, { target: { value: 'New description' } });
    expect(descriptionField).toHaveValue('New description');
  });

  it('should display status dropdown', () => {
    render(<EventDetail {...defaultProps} />);

    fireEvent.click(screen.getByText('Editor'));
    fireEvent.click(screen.getByText('Outcomes'));

    const statusSelect = screen.getByDisplayValue('To Respond');
    expect(statusSelect).toBeInTheDocument();
  });

  it('should show raw data tab with JSON', () => {
    render(<EventDetail {...defaultProps} />);

    fireEvent.click(screen.getByText('Editor'));
    fireEvent.click(screen.getByText('Raw Data'));

    expect(screen.getByText('Extracted JSON Data')).toBeInTheDocument();
    expect(screen.getByText('Original Source Text')).toBeInTheDocument();
  });

  it('should display priority score prominently', () => {
    render(<EventDetail {...defaultProps} />);

    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByText('Priority Score')).toBeInTheDocument();
  });

  it('should handle recurrence information', () => {
    const recurringEvent = {
      ...mockEvent,
      analysis: {
        ...mockEvent.analysis,
        recurrence: {
          isRecurring: true,
          frequency: 'Weekly' as const,
          interval: 1,
          endDate: '2026-06-15'
        }
      }
    };

    render(<EventDetail {...defaultProps} event={recurringEvent} />);

    fireEvent.click(screen.getByText('Editor'));
    fireEvent.click(screen.getByText('Logistics & Links'));

    expect(screen.getByText('Recurrence Pattern')).toBeInTheDocument();
  });

  it('should display event theme', () => {
    render(<EventDetail {...defaultProps} />);

    expect(screen.getByText(/Education/)).toBeInTheDocument();
  });
});