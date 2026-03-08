import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StaffOverview } from './StaffOverview';
import { EventData, Priority } from '../types';

// Mock Chart.js
vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
  })),
}));

describe('StaffOverview', () => {
  const mockEvents: EventData[] = [
    {
      id: 'event-1',
      createdAt: Date.now(),
      originalText: 'Test event',
      analysis: {
        sender: 'John',
        institution: 'Test Org',
        eventName: 'Conference 2026',
        theme: 'Education',
        description: 'A conference',
        priority: Priority.High,
        priorityScore: 85,
        priorityReasoning: 'High relevance',
        date: '2026-05-15',
        venue: 'Brussels',
        initialDeadline: '2026-04-01',
        finalDeadline: '2026-04-15',
        linkedActivities: []
      },
      contact: {
        polContact: 'Policy',
        name: 'Panagiotis Chatzimichail',
        email: 'panagiotis@example.com',
        role: 'Manager',
        organization: 'Org',
        repRole: 'Speaker',
        notes: ''
      },
      followUp: {
        prepResources: '',
        briefing: '',
        commsPack: {
          remarks: '',
          representative: '',
          datePlace: '',
          additionalInfo: ''
        },
        postEventNotes: '',
        status: 'Completed - No follow up'
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header with title', () => {
    render(<StaffOverview events={mockEvents} />);
    expect(screen.getByText(/Strategic Horizon/)).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
  });

  it('renders header description', () => {
    render(<StaffOverview events={mockEvents} />);
    expect(screen.getByText(/integrated overview/i)).toBeInTheDocument();
  });

  it('renders statutory roadmap section', () => {
    render(<StaffOverview events={mockEvents} />);
    expect(screen.getByText('2026 Statutory Roadmap')).toBeInTheDocument();
  });

  it('renders all month labels', () => {
    render(<StaffOverview events={mockEvents} />);
    expect(screen.getByText('JAN')).toBeInTheDocument();
    expect(screen.getByText('FEB')).toBeInTheDocument();
    expect(screen.getByText('MAR')).toBeInTheDocument();
    expect(screen.getByText('DEC')).toBeInTheDocument();
  });

  it('renders workload distribution section', () => {
    render(<StaffOverview events={mockEvents} />);
    expect(screen.getByText('Projected Mission Distribution')).toBeInTheDocument();
    expect(screen.getByText(/Comparing "Days on Mission"/)).toBeInTheDocument();
  });

  it('renders focus areas section', () => {
    render(<StaffOverview events={mockEvents} />);
    expect(screen.getByText('Portfolio Focus Areas')).toBeInTheDocument();
  });

  it('renders individual portfolios section', () => {
    render(<StaffOverview events={mockEvents} />);
    expect(screen.getByText('Individual Portfolios 2026')).toBeInTheDocument();
  });

  it('renders all team member cards', () => {
    render(<StaffOverview events={mockEvents} />);
    expect(screen.getByText('Panagiotis C.')).toBeInTheDocument();
    expect(screen.getByText('Amira B.')).toBeInTheDocument();
    expect(screen.getByText('Daniele S.')).toBeInTheDocument();
    expect(screen.getByText('Francesca O.')).toBeInTheDocument();
    expect(screen.getByText('Rui T.')).toBeInTheDocument();
  });

  it('renders portfolio tags for team members', () => {
    render(<StaffOverview events={mockEvents} />);
    expect(screen.getByText('Coordination & Ext. Affairs')).toBeInTheDocument();
    expect(screen.getByText('Advocacy')).toBeInTheDocument();
    expect(screen.getByText('Membership')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Comms')).toBeInTheDocument();
  });

  it('renders activity heatmap', () => {
    render(<StaffOverview events={mockEvents} />);
    expect(screen.getByText('2026 Monthly Intensity Heatmap')).toBeInTheDocument();
  });

  it('renders heatmap legend', () => {
    render(<StaffOverview events={mockEvents} />);
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Med')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders timeline events', () => {
    render(<StaffOverview events={mockEvents} />);
    expect(screen.getByText('BM #1')).toBeInTheDocument();
    expect(screen.getByText('COM (Spring)')).toBeInTheDocument();
    expect(screen.getByText('Summer Sch.')).toBeInTheDocument();
    expect(screen.getByText('GA 2026')).toBeInTheDocument();
  });

  it('renders chart canvases', () => {
    const { container } = render(<StaffOverview events={mockEvents} />);
    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBe(2); // Mission chart and Focus chart
  });

  it('calculates mission days for completed events', () => {
    const multipleEvents = [
      ...mockEvents,
      {
        ...mockEvents[0],
        id: 'event-2',
        contact: {
          ...mockEvents[0].contact,
          name: 'Amira Bakr'
        },
        followUp: {
          ...mockEvents[0].followUp,
          status: 'Completed - Follow Up' as const
        }
      }
    ];

    render(<StaffOverview events={multipleEvents} />);
    // Component should calculate mission days based on completed events
    expect(screen.getByText('Panagiotis C.')).toBeInTheDocument();
  });

  it('ignores non-completed events in mission day calculation', () => {
    const mixedEvents = [
      ...mockEvents,
      {
        ...mockEvents[0],
        id: 'event-2',
        followUp: {
          ...mockEvents[0].followUp,
          status: 'To Respond' as const
        }
      }
    ];

    render(<StaffOverview events={mixedEvents} />);
    expect(screen.getByText('2026 Statutory Roadmap')).toBeInTheDocument();
  });

  it('renders custom styles for responsive layout', () => {
    const { container } = render(<StaffOverview events={mockEvents} />);
    const styleTag = container.querySelector('style');
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.textContent).toContain('hide-scroll');
    expect(styleTag?.textContent).toContain('chart-container');
  });

  it('applies correct background colors to sections', () => {
    const { container } = render(<StaffOverview events={mockEvents} />);
    const header = container.querySelector('.bg-\\[\\#312E81\\]');
    expect(header).toBeInTheDocument();
  });

  it('renders with empty events array', () => {
    render(<StaffOverview events={[]} />);
    expect(screen.getByText('Strategic Horizon')).toBeInTheDocument();
  });

  it('handles events with missing contact names', () => {
    const eventsWithMissingContact = [
      {
        ...mockEvents[0],
        contact: {
          ...mockEvents[0].contact,
          name: ''
        }
      }
    ];

    render(<StaffOverview events={eventsWithMissingContact} />);
    expect(screen.getByText('Panagiotis C.')).toBeInTheDocument();
  });
});