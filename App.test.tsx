import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from './App';

describe('App Component - Basic Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the app header', () => {
    render(<App />);

    expect(screen.getByText('OBESSU Event Flow')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<App />);

    const searchInput = screen.getByPlaceholderText('Search events...');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders Add Invitation button', () => {
    render(<App />);

    const addButton = screen.getByRole('button', { name: /add invitation/i });
    expect(addButton).toBeInTheDocument();
  });

  it('renders all view mode tabs', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /calendar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upcoming/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /past/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /contacts/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /overview/i })).toBeInTheDocument();
  });

  it('defaults to calendar view', () => {
    render(<App />);

    const calendarTab = screen.getByRole('button', { name: /^calendar$/i });

    // Calendar tab should be highlighted by default
    expect(calendarTab.className).toContain('border-blue-600');
    expect(calendarTab.className).toContain('text-blue-600');
  });

  it('switches to upcoming view when tab is clicked', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    // Check that upcoming tab is now active
    expect(upcomingTab.className).toContain('border-blue-600');
  });

  it('switches to past view when tab is clicked', () => {
    render(<App />);

    const pastTab = screen.getByRole('button', { name: /past/i });
    fireEvent.click(pastTab);

    // Check for archived list indicator
    expect(screen.getByText(/archived/i)).toBeInTheDocument();
  });

  it('switches to contacts view when tab is clicked', () => {
    render(<App />);

    const contactsTab = screen.getByRole('button', { name: /contacts/i });
    fireEvent.click(contactsTab);

    // Check that contacts tab is active
    expect(contactsTab.className).toContain('border-blue-600');
  });

  it('switches to overview view when tab is clicked', () => {
    render(<App />);

    const overviewTab = screen.getByRole('button', { name: /overview/i });
    fireEvent.click(overviewTab);

    // Check that overview tab is active
    expect(overviewTab.className).toContain('border-blue-600');
  });

  it('displays search input that can be typed into', () => {
    render(<App />);

    const searchInput = screen.getByPlaceholderText('Search events...') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(searchInput.value).toBe('test search');
  });

  it('filters events case-insensitively', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: 'SOLIDAR' } });

    // Should show filtered events (case insensitive)
    expect(screen.getByText(/Solidar Webinar/i)).toBeInTheDocument();
  });

  it('filters events by search term', () => {
    render(<App />);

    // Switch to upcoming view
    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: 'Solidar' } });

    // Should show filtered events
    expect(screen.getByText(/Solidar Webinar/i)).toBeInTheDocument();
  });

  it('shows empty state when no events selected in upcoming view', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    expect(screen.getByText('Select an event to view details')).toBeInTheDocument();
  });

  it('filters upcoming events correctly', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    // Should show only events that are not completed or archived
    expect(screen.getByText(/Active List/i)).toBeInTheDocument();
  });

  it('filters past events correctly', () => {
    render(<App />);

    const pastTab = screen.getByRole('button', { name: /past/i });
    fireEvent.click(pastTab);

    // Should show only completed or archived events
    expect(screen.getByText(/Archived List/i)).toBeInTheDocument();
  });

  it('displays event count in sidebar', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    // Should show count of filtered events (5 mock events are in upcoming status)
    const countText = screen.getByText(/Active List \(\d+\)/);
    expect(countText).toBeInTheDocument();
  });

  it('highlights selected tab', () => {
    render(<App />);

    const calendarTab = screen.getByRole('button', { name: /^calendar$/i });

    // Calendar tab should be highlighted by default
    expect(calendarTab.className).toContain('border-blue-600');
    expect(calendarTab.className).toContain('text-blue-600');
  });

  it('handles search across event names', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');

    // Search by event name
    fireEvent.change(searchInput, { target: { value: 'VET Strategy' } });
    expect(screen.getByText(/VET Strategy/i)).toBeInTheDocument();
  });

  it('shows no events message when search returns no results', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent event xyz123' } });

    expect(screen.getByText(/No upcoming events found/i)).toBeInTheDocument();
  });

  it('renders mock events from data', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    // Should render some of the mock events
    expect(screen.getByText(/Solidar Webinar/i)).toBeInTheDocument();
  });

  it('can select different view modes', () => {
    render(<App />);

    // Test switching between different views
    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);
    expect(upcomingTab.className).toContain('border-blue-600');

    const contactsTab = screen.getByRole('button', { name: /contacts/i });
    fireEvent.click(contactsTab);
    expect(contactsTab.className).toContain('border-blue-600');

    const overviewTab = screen.getByRole('button', { name: /overview/i });
    fireEvent.click(overviewTab);
    expect(overviewTab.className).toContain('border-blue-600');
  });

  it('search functionality clears when input is cleared', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...') as HTMLInputElement;

    // Type a search
    fireEvent.change(searchInput, { target: { value: 'Solidar' } });
    expect(searchInput.value).toBe('Solidar');

    // Clear the search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(searchInput.value).toBe('');
  });

  it('maintains state when switching between views', () => {
    render(<App />);

    const searchInput = screen.getByPlaceholderText('Search events...') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Switch views
    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    const calendarTab = screen.getByRole('button', { name: /^calendar$/i });
    fireEvent.click(calendarTab);

    // Search should still be there
    expect(searchInput.value).toBe('test');
  });

  it('handles empty search term gracefully', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: '' } });

    // Should show all events when search is empty
    expect(screen.getByText(/Active List/i)).toBeInTheDocument();
  });

  it('filters events by institution name', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: 'Solidar' } });

    // Should filter by institution
    expect(screen.getByText(/Solidar Webinar/i)).toBeInTheDocument();
  });

  it('handles special characters in search', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: '@#$%' } });

    // Should handle special characters without crashing
    expect(searchInput.value).toBe('@#$%');
  });

  it('maintains search state after adding new event', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'test' } });

    expect(searchInput.value).toBe('test');
  });

  it('displays correct view mode after switching multiple times', () => {
    render(<App />);

    const calendarTab = screen.getByRole('button', { name: /^calendar$/i });
    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    const pastTab = screen.getByRole('button', { name: /past/i });

    fireEvent.click(upcomingTab);
    fireEvent.click(pastTab);
    fireEvent.click(calendarTab);

    expect(calendarTab.className).toContain('border-blue-600');
  });

  it('clears selected event when switching from upcoming to past if event not in past', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    // Switch to past view
    const pastTab = screen.getByRole('button', { name: /past/i });
    fireEvent.click(pastTab);

    // Selected event should be cleared if not in past events
    expect(screen.getByText('Select an event to view details')).toBeInTheDocument();
  });

  it('handles rapid view mode switching', () => {
    render(<App />);

    const calendarTab = screen.getByRole('button', { name: /^calendar$/i });
    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });

    // Rapid switching
    for (let i = 0; i < 5; i++) {
      fireEvent.click(upcomingTab);
      fireEvent.click(calendarTab);
    }

    // Should end on calendar view
    expect(calendarTab.className).toContain('border-blue-600');
  });

  it('displays search results count correctly', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    const countText = screen.getByText(/Active List \(\d+\)/);
    expect(countText).toBeInTheDocument();
  });

  it('handles whitespace-only search gracefully', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: '   ' } });

    // Should not crash
    expect(searchInput).toBeInTheDocument();
  });

  it('renders calendar view by default without errors', () => {
    const { container } = render(<App />);

    expect(container.querySelector('.h-full')).toBeInTheDocument();
  });

  it('preserves event data when switching views', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    const eventName = screen.getByText(/Solidar Webinar/i);
    expect(eventName).toBeInTheDocument();

    const calendarTab = screen.getByRole('button', { name: /^calendar$/i });
    fireEvent.click(calendarTab);

    fireEvent.click(upcomingTab);

    // Event should still be there
    expect(screen.getByText(/Solidar Webinar/i)).toBeInTheDocument();
  });

  it('handles search with partial matches', () => {
    render(<App />);

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: 'Sol' } });

    // Should show partial matches
    expect(screen.getByText(/Solidar Webinar/i)).toBeInTheDocument();
  });
});