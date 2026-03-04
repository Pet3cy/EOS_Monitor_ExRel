import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { CalendarSync } from './CalendarSync';

describe('CalendarSync', () => {
  const originalFetch = global.fetch;
  const originalConsoleError = console.error;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    console.error = vi.fn(); // Suppress console.error in tests
  });

  afterEach(() => {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  });

  it('handles failed status check correctly (non-ok response)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error'
    });

    const onEventsSynced = vi.fn();
    render(<CalendarSync onEventsSynced={onEventsSynced} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/status');
    });

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Failed to check status:',
      expect.objectContaining({ message: 'Failed to check status: Internal Server Error' })
    );

    // Button should be in disconnected state (disabled)
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Connect Google Drive/Calendar first to enable sync');
  });

  it('handles failed status check correctly (network error)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

    const onEventsSynced = vi.fn();
    render(<CalendarSync onEventsSynced={onEventsSynced} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/status');
    });

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Failed to check status:',
      expect.objectContaining({ message: 'Network Error' })
    );

    // Button should be in disconnected state (disabled)
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Connect Google Drive/Calendar first to enable sync');
  });

  it('handles successful status check correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ connected: true })
    });

    const onEventsSynced = vi.fn();
    render(<CalendarSync onEventsSynced={onEventsSynced} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/status');
    });

    // Wait for the button state to update
    await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).not.toBeDisabled();
        expect(button).not.toHaveAttribute('title', 'Connect Google Drive/Calendar first to enable sync');
    });
  });
});
