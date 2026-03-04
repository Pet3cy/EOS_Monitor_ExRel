import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PriorityBadge } from './PriorityBadge';
import { Priority } from '../types';

describe('PriorityBadge', () => {
  it('renders High priority with correct styling', () => {
    render(<PriorityBadge priority={Priority.High} />);
    const badge = screen.getByText('High Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
  });

  it('renders Medium priority with correct styling', () => {
    render(<PriorityBadge priority={Priority.Medium} />);
    const badge = screen.getByText('Medium Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-orange-100', 'text-orange-800', 'border-orange-200');
  });

  it('renders Low priority with correct styling', () => {
    render(<PriorityBadge priority={Priority.Low} />);
    const badge = screen.getByText('Low Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200');
  });

  it('renders Irrelevant priority with correct styling', () => {
    render(<PriorityBadge priority={Priority.Irrelevant} />);
    const badge = screen.getByText('Irrelevant Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
  });

  it('applies common badge styles to all priorities', () => {
    const { rerender } = render(<PriorityBadge priority={Priority.High} />);
    let badge = screen.getByText('High Priority');
    expect(badge).toHaveClass('px-2.5', 'py-0.5', 'rounded-full', 'text-xs', 'font-medium', 'border');

    rerender(<PriorityBadge priority={Priority.Medium} />);
    badge = screen.getByText('Medium Priority');
    expect(badge).toHaveClass('px-2.5', 'py-0.5', 'rounded-full', 'text-xs', 'font-medium', 'border');
  });

  it('renders as a span element', () => {
    render(<PriorityBadge priority={Priority.High} />);
    const badge = screen.getByText('High Priority');
    expect(badge.tagName).toBe('SPAN');
  });

  it('handles all priority enum values without errors', () => {
    const priorities = [Priority.High, Priority.Medium, Priority.Low, Priority.Irrelevant];
    priorities.forEach(priority => {
      const { unmount } = render(<PriorityBadge priority={priority} />);
      expect(screen.getByText(`${priority} Priority`)).toBeInTheDocument();
      unmount();
    });
  });
});