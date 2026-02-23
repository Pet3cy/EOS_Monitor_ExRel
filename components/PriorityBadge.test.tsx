import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PriorityBadge } from './PriorityBadge';
import { Priority } from '../types';

describe('PriorityBadge', () => {
  const baseClasses = [
    'px-2.5',
    'py-0.5',
    'rounded-full',
    'text-xs',
    'font-medium',
    'border'
  ];

  it('renders High priority correctly with base styles', () => {
    render(<PriorityBadge priority={Priority.High} />);
    const badge = screen.getByText('High Priority');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toBeInTheDocument();

    // Check specific style
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-800');
    expect(badge).toHaveClass('border-green-200');

    // Check base styles
    baseClasses.forEach(className => {
      expect(badge).toHaveClass(className);
    });
  });

  it('renders Medium priority correctly with base styles', () => {
    render(<PriorityBadge priority={Priority.Medium} />);
    const badge = screen.getByText('Medium Priority');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toBeInTheDocument();

    // Check specific style
    expect(badge).toHaveClass('bg-orange-100');
    expect(badge).toHaveClass('text-orange-800');
    expect(badge).toHaveClass('border-orange-200');

    // Check base styles
    baseClasses.forEach(className => {
      expect(badge).toHaveClass(className);
    });
  });

  it('renders Low priority correctly with base styles', () => {
    render(<PriorityBadge priority={Priority.Low} />);
    const badge = screen.getByText('Low Priority');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toBeInTheDocument();

    // Check specific style
    expect(badge).toHaveClass('bg-yellow-100');
    expect(badge).toHaveClass('text-yellow-800');
    expect(badge).toHaveClass('border-yellow-200');

    // Check base styles
    baseClasses.forEach(className => {
      expect(badge).toHaveClass(className);
    });
  });

  it('renders Irrelevant priority correctly with base styles', () => {
    render(<PriorityBadge priority={Priority.Irrelevant} />);
    const badge = screen.getByText('Irrelevant Priority');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toBeInTheDocument();

    // Check specific style
    expect(badge).toHaveClass('bg-red-100');
    expect(badge).toHaveClass('text-red-800');
    expect(badge).toHaveClass('border-red-200');

    // Check base styles
    baseClasses.forEach(className => {
      expect(badge).toHaveClass(className);
    });
  });

  it('renders default style for unknown priority with base styles', () => {
    // Cast to any to simulate an unknown priority that might come from an API or bug
    render(<PriorityBadge priority={'Unknown' as Priority} />);
    const badge = screen.getByText('Unknown Priority');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toBeInTheDocument();

    // Check specific style
    expect(badge).toHaveClass('bg-gray-100');
    expect(badge).toHaveClass('text-gray-800');
    expect(badge).toHaveClass('border-gray-200');

    // Check base styles
    baseClasses.forEach(className => {
      expect(badge).toHaveClass(className);
    });
  });
});
