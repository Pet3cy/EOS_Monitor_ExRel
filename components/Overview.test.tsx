import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Overview } from './Overview';
import { aggregateStakeholders } from '../services/stakeholderUtils';
import type { EventData } from '../types';

// Mock the aggregation utility
vi.mock('../services/stakeholderUtils', () => ({
  aggregateStakeholders: vi.fn(),
}));

describe('Overview Component', () => {
  const mockEvents: EventData[] = []; // The component passes this to the hook, but we mock the hook result

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no stakeholders are returned', () => {
    vi.mocked(aggregateStakeholders).mockReturnValue([]);

    render(<Overview events={mockEvents} />);

    expect(screen.getByText('No stakeholder engagement tracked.')).toBeInTheDocument();
    expect(screen.getByText('New invitations will populate this strategic dashboard automatically.')).toBeInTheDocument();
  });

  it('renders stakeholder rows with correct data', () => {
    const mockStakeholders = [
      {
        name: 'Test Institution',
        allEvents: [{ id: '1' }, { id: '2' }] as EventData[],
        completedEvents: [
            {
                id: '1',
                analysis: {
                    eventName: 'Completed Event Name',
                    date: '2023-05-20',
                    venue: 'Brussels'
                }
            }
        ] as EventData[],
        themes: ['Theme A', 'Theme B'],
        papers: ['Paper X']
      }
    ];
    vi.mocked(aggregateStakeholders).mockReturnValue(mockStakeholders);

    render(<Overview events={mockEvents} />);

    // Check header
    expect(screen.getByText('Stakeholder Overview')).toBeInTheDocument();

    // Check Stakeholder info
    expect(screen.getByText('Test Institution')).toBeInTheDocument();
    expect(screen.getByText('2 total invitations')).toBeInTheDocument();

    // Check Completed Events
    expect(screen.getByText('Completed Event Name')).toBeInTheDocument();
    expect(screen.getByText('2023-05-20')).toBeInTheDocument();
    expect(screen.getByText('Brussels')).toBeInTheDocument();

    // Check Metrics
    // 2 total, 2 themes, 1 paper
    // Note: The component renders these numbers.
    // We can search for the numbers, but they might be ambiguous.
    // "2" appears in total events count and themes count.

    // Check Themes
    expect(screen.getByText('Theme A')).toBeInTheDocument();
    expect(screen.getByText('Theme B')).toBeInTheDocument();

    // Check Papers
    expect(screen.getByText('Paper X')).toBeInTheDocument();
  });

  it('handles renaming interaction correctly', () => {
    const onRenameMock = vi.fn();
    const mockStakeholders = [
      {
        name: 'Old Name',
        allEvents: [],
        completedEvents: [],
        themes: [],
        papers: []
      }
    ];
    vi.mocked(aggregateStakeholders).mockReturnValue(mockStakeholders as any);

    render(<Overview events={mockEvents} onRenameStakeholder={onRenameMock} />);

    // Find and click the name (it has an onClick handler)
    const nameElement = screen.getByText('Old Name');
    fireEvent.click(nameElement);

    // Should now be in edit mode
    const input = screen.getByDisplayValue('Old Name');
    expect(input).toBeInTheDocument();

    // Change value
    fireEvent.change(input, { target: { value: 'New Name' } });

    // Save
    const saveButton = screen.getByTitle('Save');
    fireEvent.click(saveButton);

    expect(onRenameMock).toHaveBeenCalledWith('Old Name', 'New Name');
  });

  it('cancels renaming when cancel button is clicked', () => {
    const onRenameMock = vi.fn();
    const mockStakeholders = [
      {
        name: 'Old Name',
        allEvents: [],
        completedEvents: [],
        themes: [],
        papers: []
      }
    ];
    vi.mocked(aggregateStakeholders).mockReturnValue(mockStakeholders as any);

    render(<Overview events={mockEvents} onRenameStakeholder={onRenameMock} />);

    fireEvent.click(screen.getByText('Old Name'));

    const input = screen.getByDisplayValue('Old Name');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const cancelButton = screen.getByTitle('Cancel');
    fireEvent.click(cancelButton);

    expect(onRenameMock).not.toHaveBeenCalled();
    expect(screen.queryByDisplayValue('Old Name')).not.toBeInTheDocument(); // Input should be gone
    expect(screen.getByText('Old Name')).toBeInTheDocument(); // Text should be back
  });
});
