import { render, screen } from '@testing-library/react';
import { PriorityBadge } from './PriorityBadge';
import { Priority } from '../types';

describe('PriorityBadge', () => {
  it('renders High priority correctly', () => {
    render(<PriorityBadge priority={Priority.High} />);
    const badge = screen.getByText('High Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
  });

  it('renders Medium priority correctly', () => {
    render(<PriorityBadge priority={Priority.Medium} />);
    const badge = screen.getByText('Medium Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-orange-100', 'text-orange-800', 'border-orange-200');
  });

  it('renders Low priority correctly', () => {
    render(<PriorityBadge priority={Priority.Low} />);
    const badge = screen.getByText('Low Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200');
  });

  it('renders Irrelevant priority correctly', () => {
    render(<PriorityBadge priority={Priority.Irrelevant} />);
    const badge = screen.getByText('Irrelevant Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800', 'border-gray-200');
  });

  it('renders default style for unknown priority', () => {
    // @ts-ignore
    render(<PriorityBadge priority="Unknown" />);
    const badge = screen.getByText('Unknown Priority');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800', 'border-gray-200');
  });
});
