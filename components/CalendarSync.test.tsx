import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { CalendarSync } from './CalendarSync';

describe('CalendarSync', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('handles failed status check correctly (non-ok response)', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    } as Response);

    const onEventsSynced = vi.fn();
    render(<CalendarSync onEventsSynced={onEventsSynced} />);

    // Verify error was logged
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Failed to check status:',
        expect.objectContaining({ message: 'Failed to check status: Internal Server Error' })
      );
    });

    // Button should remain in disconnected state (disabled)
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Connect Google Drive/Calendar first to enable sync');
  });

  it('handles failed status check correctly (network error)', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network Error'));

    const onEventsSynced = vi.fn();
    render(<CalendarSync onEventsSynced={onEventsSynced} />);

    // Verify error was logged
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Failed to check status:',
        expect.objectContaining({ message: 'Network Error' })
      );
    });

    // Button should remain in disconnected state (disabled)
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Connect Google Drive/Calendar first to enable sync');
  });

  it('keeps button disabled when API returns connected: false', async () => {
    const jsonSpy = vi.fn().mockResolvedValue({ connected: false });
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jsonSpy,
    } as unknown as Response);

    const onEventsSynced = vi.fn();
    render(<CalendarSync onEventsSynced={onEventsSynced} />);

    // Wait for the full checkStatus path to complete (fetch called + json parsed)
    await waitFor(() => {
      expect(jsonSpy).toHaveBeenCalled();
    });

    // Button should remain disabled — user is not connected
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Connect Google Drive/Calendar first to enable sync');
    // No error should be logged for a valid response
    expect(console.error).not.toHaveBeenCalled();
  });

  it('handles successful status check correctly', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ connected: true }),
    } as Response);

    const onEventsSynced = vi.fn();
    render(<CalendarSync onEventsSynced={onEventsSynced} />);

    // Wait for the button state to update
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute('title', 'Connect Google Drive/Calendar first to enable sync');
    });
  });

  it('reverts to disabled button when status check fails after a successful connection', async () => {
    // First render: connected successfully
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ connected: true }),
    } as Response);

    const onEventsSynced = vi.fn();
    const { unmount } = render(<CalendarSync onEventsSynced={onEventsSynced} />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    unmount();

    // Second render: status check fails
    fetchSpy.mockResolvedValue({
      ok: false,
      statusText: 'Service Unavailable',
    } as Response);

    render(<CalendarSync onEventsSynced={onEventsSynced} />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Failed to check status:',
        expect.objectContaining({ message: 'Failed to check status: Service Unavailable' })
      );
    });

    // Button should be disabled after the failed re-check
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Connect Google Drive/Calendar first to enable sync');
  });
});
