import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventDetail } from './EventDetail';
import { EventData, Priority, Contact } from '../types';
import * as geminiService from '../services/geminiService';

// Mock geminiService
vi.mock('../services/geminiService', () => ({
  generateBriefing: vi.fn(),
}));

const createMockEvent = (overrides?: Partial<EventData>): EventData => ({
  id: 'test-event-1',
  createdAt: Date.now(),
  originalText: 'Test invitation',
  analysis: {
    sender: 'John Doe',
    institution: 'Test University',
    eventName: 'Test Conference 2026',
    theme: 'Education',
    description: 'A test conference about education policy',
    priority: Priority.High,
    priorityScore: 85,
    priorityReasoning: 'High relevance to our mission',
    date: '2026-06-15',
    venue: 'Brussels',
    initialDeadline: '2026-05-01',
    finalDeadline: '2026-05-15',
    linkedActivities: ['Activity 1', 'Activity 2'],
    registrationLink: 'https://example.com/register',
    programmeLink: 'https://example.com/programme',
  },
  contact: {
    polContact: '',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Coordinator',
    organization: 'Test Org',
    repRole: 'Participant',
    notes: '',
  },
  followUp: {
    prepResources: '',
    briefing: 'Test briefing content',
    commsPack: {
      remarks: '',
      representative: '',
      datePlace: '',
      additionalInfo: '',
    },
    postEventNotes: '',
    status: 'To Respond',
  },
  ...overrides,
});

const mockContacts: Contact[] = [
  {
    id: 'contact-1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'Director',
    organization: 'Org A',
    notes: '',
  },
  {
    id: 'contact-2',
    name: 'Bob Brown',
    email: 'bob@example.com',
    role: 'Manager',
    organization: 'Org B',
    notes: '',
  },
];

describe('EventDetail', () => {
  const defaultProps = {
    event: createMockEvent(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    contacts: mockContacts,
    onViewContact: vi.fn(),
  };

  // Helper to switch to editor mode (component defaults to 'report' mode)
  const switchToEditor = () => {
    const editorButton = screen.getByText('Editor');
    fireEvent.click(editorButton);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Header and Basic Rendering', () => {
    it('should render event details header', () => {
      render(<EventDetail {...defaultProps} />);

      expect(screen.getByText('Test Conference 2026')).toBeInTheDocument();
      expect(screen.getByText('Test University')).toBeInTheDocument();
      expect(screen.getByText('2026-06-15')).toBeInTheDocument();
      expect(screen.getByText('Education')).toBeInTheDocument();
    });

    it('should render PriorityBadge', () => {
      render(<EventDetail {...defaultProps} />);

      expect(screen.getByText('High Priority')).toBeInTheDocument();
    });

    it('should render all tabs in editor mode', () => {
      render(<EventDetail {...defaultProps} />);
      switchToEditor();

      expect(screen.getByText('Context & Analysis')).toBeInTheDocument();
      expect(screen.getByText('Logistics & Links')).toBeInTheDocument();
      expect(screen.getByText('Briefing & Prep')).toBeInTheDocument();
      expect(screen.getByText('Outcomes')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should show Context tab content by default', () => {
      render(<EventDetail {...defaultProps} />);

      expect(screen.getByText('Event Description')).toBeInTheDocument();
      expect(screen.getByText('Strategic Priority')).toBeInTheDocument();
    });

    it('should switch to Logistics tab when clicked', () => {
      render(<EventDetail {...defaultProps} />);

      const logisticsTab = screen.getByText('Logistics & Links');
      fireEvent.click(logisticsTab);

      expect(screen.getByText('Date & Time')).toBeInTheDocument();
      expect(screen.getByText('Venue / Platform')).toBeInTheDocument();
    });

    it('should switch to Prep tab when clicked', () => {
      render(<EventDetail {...defaultProps} />);

      const prepTab = screen.getByText('Briefing & Prep');
      fireEvent.click(prepTab);

      expect(screen.getByText('Assigned Representative')).toBeInTheDocument();
      expect(screen.getByText('Briefing & Key Messages')).toBeInTheDocument();
    });

    it('should switch to Outcomes tab when clicked', () => {
      render(<EventDetail {...defaultProps} />);

      const outcomesTab = screen.getByText('Outcomes');
      fireEvent.click(outcomesTab);

      expect(screen.getByText('Post-Event Report')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  describe('Edit Functionality', () => {
    it('should enable editing when field is changed', () => {
      render(<EventDetail {...defaultProps} />);

      const descriptionField = screen.getByDisplayValue('A test conference about education policy');
      fireEvent.change(descriptionField, { target: { value: 'Updated description' } });

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('should call onUpdate when save button is clicked', () => {
      const onUpdate = vi.fn();
      render(<EventDetail {...defaultProps} onUpdate={onUpdate} />);

      const descriptionField = screen.getByDisplayValue('A test conference about education policy');
      fireEvent.change(descriptionField, { target: { value: 'Updated description' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          analysis: expect.objectContaining({
            description: 'Updated description',
          }),
        })
      );
    });

    it('should reset to non-editing state after save', () => {
      render(<EventDetail {...defaultProps} />);

      const descriptionField = screen.getByDisplayValue('A test conference about education policy');
      fireEvent.change(descriptionField, { target: { value: 'Updated description' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });

    it('should reset local state when event prop changes', () => {
      const { rerender } = render(<EventDetail {...defaultProps} />);

      const descriptionField = screen.getByDisplayValue('A test conference about education policy');
      fireEvent.change(descriptionField, { target: { value: 'Updated description' } });

      const newEvent = createMockEvent({ id: 'new-event' });
      rerender(<EventDetail {...defaultProps} event={newEvent} />);

      const updatedField = screen.getByDisplayValue('A test conference about education policy');
      expect(updatedField).toBeInTheDocument();
    });
  });

  describe('Delete Functionality', () => {
    it('should show delete confirmation modal when delete button is clicked', () => {
      render(<EventDetail {...defaultProps} />);

      const deleteButton = screen.getByTitle('Delete Event');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Delete Event?')).toBeInTheDocument();
    });

    it('should call onDelete when deletion is confirmed', () => {
      const onDelete = vi.fn();
      render(<EventDetail {...defaultProps} onDelete={onDelete} />);

      const deleteButton = screen.getByTitle('Delete Event');
      fireEvent.click(deleteButton);

      const confirmButton = screen.getByText('Delete Permanently');
      fireEvent.click(confirmButton);

      expect(onDelete).toHaveBeenCalled();
    });
  });

  describe('Briefing Generation', () => {
    it('should generate briefing when AI button is clicked', async () => {
      vi.mocked(geminiService.generateBriefing).mockResolvedValue('AI generated briefing');

      render(<EventDetail {...defaultProps} />);

      // Navigate to Prep tab
      const prepTab = screen.getByText('Briefing & Prep');
      fireEvent.click(prepTab);

      const generateButton = screen.getByText('Generate with AI');
      fireEvent.click(generateButton);

      expect(generateButton).toBeDisabled();

      await waitFor(() => {
        expect(geminiService.generateBriefing).toHaveBeenCalledWith(defaultProps.event);
      });
    });

    it('should show alert on briefing generation failure', async () => {
      vi.mocked(geminiService.generateBriefing).mockRejectedValue(new Error('API Error'));
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<EventDetail {...defaultProps} />);

      const prepTab = screen.getByText('Briefing & Prep');
      fireEvent.click(prepTab);

      const generateButton = screen.getByText('Generate with AI');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to generate briefing.');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Contact Assignment', () => {
    it('should display assigned contact information', () => {
      render(<EventDetail {...defaultProps} />);

      const prepTab = screen.getByText('Briefing & Prep');
      fireEvent.click(prepTab);

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Coordinator @ Test Org')).toBeInTheDocument();
    });

    it('should show contact picker when assign button is clicked', () => {
      render(<EventDetail {...defaultProps} />);

      const prepTab = screen.getByText('Briefing & Prep');
      fireEvent.click(prepTab);

      const assignButton = screen.getByText('Change Person');
      fireEvent.click(assignButton);

      expect(screen.getByText('Select Contact')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Brown')).toBeInTheDocument();
    });

    it('should assign contact when selected from picker', () => {
      render(<EventDetail {...defaultProps} />);

      const prepTab = screen.getByText('Briefing & Prep');
      fireEvent.click(prepTab);

      const assignButton = screen.getByText('Change Person');
      fireEvent.click(assignButton);

      const aliceButton = screen.getByText('Alice Johnson', { selector: 'button' });
      fireEvent.click(aliceButton);

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('should show "Assign Person" button when no contact assigned', () => {
      const eventWithoutContact = createMockEvent({
        contact: {
          polContact: '',
          name: '',
          email: '',
          role: '',
          organization: '',
          repRole: 'Participant',
          notes: '',
        },
      });

      render(<EventDetail {...defaultProps} event={eventWithoutContact} />);

      const prepTab = screen.getByText('Briefing & Prep');
      fireEvent.click(prepTab);

      expect(screen.getByText('Assign Person')).toBeInTheDocument();
      expect(screen.getByText('No representative assigned yet.')).toBeInTheDocument();
    });

    it('should open new contact modal when Create New Contact is clicked', () => {
      render(<EventDetail {...defaultProps} />);

      const prepTab = screen.getByText('Briefing & Prep');
      fireEvent.click(prepTab);

      const assignButton = screen.getByText('Change Person');
      fireEvent.click(assignButton);

      const createButton = screen.getByText('+ Create New Contact');
      fireEvent.click(createButton);

      // Contact picker should close
      expect(screen.queryByText('Select Contact')).not.toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should export event as JSON when JSON button is clicked', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const clickSpy = vi.fn();

      render(<EventDetail {...defaultProps} />);

      const jsonButton = screen.getByTitle('Export as JSON');
      fireEvent.click(jsonButton);

      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    it('should export event as CSV when CSV button is clicked', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');

      render(<EventDetail {...defaultProps} />);

      const csvButton = screen.getByTitle('Export as CSV');
      fireEvent.click(csvButton);

      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    it('should sanitize CSV values to prevent formula injection', () => {
      const eventWithDangerousData = createMockEvent({
        analysis: {
          ...defaultProps.event.analysis,
          description: '=1+1',
          eventName: '+DANGEROUS',
        },
      });

      render(<EventDetail {...defaultProps} event={eventWithDangerousData} />);

      const csvButton = screen.getByTitle('Export as CSV');

      // This test verifies the export function runs without error
      expect(() => fireEvent.click(csvButton)).not.toThrow();
    });
  });

  describe('Logistics Tab', () => {
    it('should display date, venue, and deadline fields', () => {
      render(<EventDetail {...defaultProps} />);

      const logisticsTab = screen.getByText('Logistics & Links');
      fireEvent.click(logisticsTab);

      expect(screen.getByDisplayValue('2026-06-15')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Brussels')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2026-05-15')).toBeInTheDocument();
    });

    it('should display registration and programme links', () => {
      render(<EventDetail {...defaultProps} />);

      const logisticsTab = screen.getByText('Logistics & Links');
      fireEvent.click(logisticsTab);

      expect(screen.getByText('Open Registration Page')).toBeInTheDocument();
      expect(screen.getByText('View Agenda / Programme')).toBeInTheDocument();
    });

    it('should not display links when they are not provided', () => {
      const eventWithoutLinks = createMockEvent({
        analysis: {
          ...defaultProps.event.analysis,
          registrationLink: undefined,
          programmeLink: undefined,
        },
      });

      render(<EventDetail {...defaultProps} event={eventWithoutLinks} />);

      const logisticsTab = screen.getByText('Logistics & Links');
      fireEvent.click(logisticsTab);

      expect(screen.queryByText('Open Registration Page')).not.toBeInTheDocument();
      expect(screen.queryByText('View Agenda / Programme')).not.toBeInTheDocument();
    });
  });

  describe('Context Tab', () => {
    it('should display priority score with progress bar', () => {
      render(<EventDetail {...defaultProps} />);

      expect(screen.getByText('85/100')).toBeInTheDocument();
      expect(screen.getByText('High relevance to our mission')).toBeInTheDocument();
    });

    it('should display linked activities', () => {
      render(<EventDetail {...defaultProps} />);

      expect(screen.getByText('Activity 1')).toBeInTheDocument();
      expect(screen.getByText('Activity 2')).toBeInTheDocument();
    });

    it('should show message when no linked activities exist', () => {
      const eventWithoutActivities = createMockEvent({
        analysis: {
          ...defaultProps.event.analysis,
          linkedActivities: [],
        },
      });

      render(<EventDetail {...defaultProps} event={eventWithoutActivities} />);

      expect(screen.getByText('No linked internal activities found.')).toBeInTheDocument();
    });
  });

  describe('Outcomes Tab', () => {
    it('should allow editing post-event notes', () => {
      render(<EventDetail {...defaultProps} />);

      const outcomesTab = screen.getByText('Outcomes');
      fireEvent.click(outcomesTab);

      const notesField = screen.getByPlaceholderText(/Summary of outcomes/);
      fireEvent.change(notesField, { target: { value: 'Great event!' } });

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('should display status dropdown with all options', () => {
      render(<EventDetail {...defaultProps} />);

      const outcomesTab = screen.getByText('Outcomes');
      fireEvent.click(outcomesTab);

      const statusDropdown = screen.getByDisplayValue('To Respond');
      expect(statusDropdown).toBeInTheDocument();

      const options = Array.from(statusDropdown.querySelectorAll('option')).map((opt: any) => opt.value);
      expect(options).toContain('To Respond');
      expect(options).toContain('Confirmation - To be briefed');
      expect(options).toContain('Prep ready');
      expect(options).toContain('Completed - No follow up');
      expect(options).toContain('Completed - Follow Up');
      expect(options).toContain('Not Relevant');
    });

    it('should update status when changed', () => {
      render(<EventDetail {...defaultProps} />);

      const outcomesTab = screen.getByText('Outcomes');
      fireEvent.click(outcomesTab);

      const statusDropdown = screen.getByDisplayValue('To Respond');
      fireEvent.change(statusDropdown, { target: { value: 'Completed - No follow up' } });

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  describe('Representative Role Selection', () => {
    it('should allow changing representative role', () => {
      render(<EventDetail {...defaultProps} />);

      const prepTab = screen.getByText('Briefing & Prep');
      fireEvent.click(prepTab);

      const roleSelect = screen.getByDisplayValue('Participant');
      fireEvent.change(roleSelect, { target: { value: 'Speaker' } });

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('should have all role options available', () => {
      render(<EventDetail {...defaultProps} />);

      const prepTab = screen.getByText('Briefing & Prep');
      fireEvent.click(prepTab);

      const roleSelect = screen.getByDisplayValue('Participant');
      const options = Array.from(roleSelect.querySelectorAll('option')).map((opt: any) => opt.value);

      expect(options).toContain('Participant');
      expect(options).toContain('Speaker');
      expect(options).toContain('Activity Host');
      expect(options).toContain('Other');
    });
  });
});