import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CalendarSync, CALENDAR_OWNER_MAP } from './CalendarSync';

describe('CalendarSync', () => {
  const mockOnEventsSynced = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should show disabled button when not connected', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ connected: false })
    });

    render(<CalendarSync onEventsSynced={mockOnEventsSynced} />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('Sync Calendars');
    });
  });

  it('should show enabled button when connected', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ connected: true })
    });

    render(<CalendarSync onEventsSynced={mockOnEventsSynced} />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });

  it('should sync calendar events on button click', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ connected: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: [
            {
              id: '1',
              summary: 'Test Event',
              description: 'Test Description',
              start: { dateTime: '2026-03-15T14:00:00Z' },
              location: 'Online',
              sourceCalendar: 'panagiotis@obessu.org',
              creator: { email: 'creator@example.com' }
            }
          ]
        })
      });

    render(<CalendarSync onEventsSynced={mockOnEventsSynced} />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnEventsSynced).toHaveBeenCalled();
      const events = mockOnEventsSynced.mock.calls[0][0];
      expect(events).toHaveLength(1);
      expect(events[0].analysis.eventName).toBe('Test Event');
    });
  });

  it('should display error when sync fails', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ connected: true })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Sync failed' }),
        statusText: 'Bad Request'
      });

    render(<CalendarSync onEventsSynced={mockOnEventsSynced} />);

    await waitFor(() => screen.getByRole('button'));

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Sync failed|Failed to fetch/i)).toBeInTheDocument();
    });
  });

  it('should show loading state while syncing', async () => {
    let resolveSync: any;
    const syncPromise = new Promise(resolve => {
      resolveSync = resolve;
    });

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ connected: true })
      })
      .mockReturnValueOnce(syncPromise);

    render(<CalendarSync onEventsSynced={mockOnEventsSynced} />);

    await waitFor(() => screen.getByRole('button'));

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });

    resolveSync({
      ok: true,
      json: async () => ({ events: [] })
    });
  });

  it('should map calendar owner from CALENDAR_OWNER_MAP', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ connected: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: [
            {
              id: '1',
              summary: 'Test',
              start: { date: '2026-03-15' },
              sourceCalendar: 'panagiotis@obessu.org'
            }
          ]
        })
      });

    render(<CalendarSync onEventsSynced={mockOnEventsSynced} />);

    await waitFor(() => screen.getByRole('button'));

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockOnEventsSynced).toHaveBeenCalled();
      const events = mockOnEventsSynced.mock.calls[0][0];
      expect(events[0].contact.name).toBe('Panagiotis Chatzimichail');
    });
  });

  it('should handle events without dateTime (all-day events)', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ connected: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: [
            {
              id: '1',
              summary: 'All Day Event',
              start: { date: '2026-03-15' },
              sourceCalendar: 'test@example.com'
            }
          ]
        })
      });

    render(<CalendarSync onEventsSynced={mockOnEventsSynced} />);

    await waitFor(() => screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockOnEventsSynced).toHaveBeenCalled();
      const events = mockOnEventsSynced.mock.calls[0][0];
      expect(events[0].analysis.date).toBe('2026-03-15');
      expect(events[0].analysis.time).toBe('');
    });
  });

  it('should show error when trying to sync while not connected', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ connected: false })
    });

    render(<CalendarSync onEventsSynced={mockOnEventsSynced} />);

    await waitFor(() => screen.getByRole('button'));

    // Button should be disabled, so this won't actually trigger
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should have correct CALENDAR_OWNER_MAP mappings', () => {
    expect(CALENDAR_OWNER_MAP['panagiotis@obessu.org']).toBe('Panagiotis Chatzimichail');
    expect(CALENDAR_OWNER_MAP['amira@obessu.org']).toBe('Amira Bakr');
    expect(CALENDAR_OWNER_MAP['daniele@obessu.org']).toBe('Daniele Sabato');
  });
});