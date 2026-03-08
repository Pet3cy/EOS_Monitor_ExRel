import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriorityBadge } from './PriorityBadge';
import { Priority } from '../types';

describe('PriorityBadge', () => {
  it('should render High priority badge with correct styling', () => {
    render(<PriorityBadge priority={Priority.High} />);
    const badge = screen.getByText('High Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
  });

  it('should render Medium priority badge with correct styling', () => {
    render(<PriorityBadge priority={Priority.Medium} />);
    const badge = screen.getByText('Medium Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-800', 'border-amber-200');
  });

  it('should render Low priority badge with correct styling', () => {
    render(<PriorityBadge priority={Priority.Low} />);
    const badge = screen.getByText('Low Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-200');
  });

  it('should render Irrelevant priority badge with correct styling', () => {
    render(<PriorityBadge priority={Priority.Irrelevant} />);
    const badge = screen.getByText('Irrelevant Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-slate-100', 'text-slate-500', 'border-slate-200');
  });

  it('should have consistent structure across all priority levels', () => {
    const priorities = [Priority.High, Priority.Medium, Priority.Low, Priority.Irrelevant];

    priorities.forEach(priority => {
      const { container } = render(<PriorityBadge priority={priority} />);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('px-2.5', 'py-0.5', 'rounded-full', 'text-xs', 'font-medium', 'border');
    });
  });

  it('should display priority name correctly formatted', () => {
    render(<PriorityBadge priority={Priority.High} />);
    expect(screen.getByText('High Priority')).toBeInTheDocument();
  });
});