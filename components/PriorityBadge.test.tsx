import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PriorityBadge } from './PriorityBadge';
import { Priority } from '../types';

describe('PriorityBadge', () => {
  const testCases = [
    { priority: Priority.High, expectedText: 'High Priority', color: 'green' },
    { priority: Priority.Medium, expectedText: 'Medium Priority', color: 'orange' },
    { priority: Priority.Low, expectedText: 'Low Priority', color: 'yellow' },
    { priority: Priority.Irrelevant, expectedText: 'Irrelevant Priority', color: 'red' },
    { priority: 'Unknown' as Priority, expectedText: 'Unknown Priority', color: 'gray' },
    // Use type assertion to bypass TS check for undefined/null
    // Testing library normalizes text (trims whitespace), so ' Priority' matches 'Priority'
    { priority: undefined as unknown as Priority, expectedText: 'Priority', color: 'gray' },
    { priority: null as unknown as Priority, expectedText: 'Priority', color: 'gray' },
  ];

  it.each(testCases)('renders $expectedText correctly with $color theme', ({ priority, expectedText, color }) => {
    render(<PriorityBadge priority={priority} />);

    // Testing library normalizes text (trims whitespace)
    const badge = screen.getByText(expectedText);
    expect(badge).toBeInTheDocument();

    // Check classes
    expect(badge).toHaveClass(`bg-${color}-100`);
    expect(badge).toHaveClass(`text-${color}-800`);
    expect(badge).toHaveClass(`border-${color}-200`);
  });
});
