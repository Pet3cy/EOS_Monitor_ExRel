import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriorityBadge } from './PriorityBadge';
import { Priority } from '../types';

describe('PriorityBadge', () => {
  it('should render High priority badge with correct styles', () => {
    render(<PriorityBadge priority={Priority.High} />);

    const badge = screen.getByText('High Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
  });

  it('should render Medium priority badge with correct styles', () => {
    render(<PriorityBadge priority={Priority.Medium} />);

    const badge = screen.getByText('Medium Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-orange-100', 'text-orange-800', 'border-orange-200');
  });

  it('should render Low priority badge with correct styles', () => {
    render(<PriorityBadge priority={Priority.Low} />);

    const badge = screen.getByText('Low Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200');
  });

  it('should render Irrelevant priority badge with correct styles', () => {
    render(<PriorityBadge priority={Priority.Irrelevant} />);

    const badge = screen.getByText('Irrelevant Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
  });

  it('should apply common badge styles to all priorities', () => {
    const { rerender } = render(<PriorityBadge priority={Priority.High} />);

    let badge = screen.getByText('High Priority');
    expect(badge).toHaveClass('px-2.5', 'py-0.5', 'rounded-full', 'text-xs', 'font-medium', 'border');

    rerender(<PriorityBadge priority={Priority.Medium} />);
    badge = screen.getByText('Medium Priority');
    expect(badge).toHaveClass('px-2.5', 'py-0.5', 'rounded-full', 'text-xs', 'font-medium', 'border');
  });

  it('should handle invalid priority gracefully', () => {
    // @ts-expect-error Testing invalid priority
    render(<PriorityBadge priority={'Invalid' as Priority} />);

    const badge = screen.getByText('Invalid Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800', 'border-gray-200');
  });
});