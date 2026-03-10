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
    'border',
  ];

  const testCases = [
    {
      priority: Priority.High,
      text: 'High Priority',
      classes: ['bg-green-100', 'text-green-800', 'border-green-200'],
    },
    {
      priority: Priority.Medium,
      text: 'Medium Priority',
      classes: ['bg-orange-100', 'text-orange-800', 'border-orange-200'],
    },
    {
      priority: Priority.Low,
      text: 'Low Priority',
      classes: ['bg-yellow-100', 'text-yellow-800', 'border-yellow-200'],
    },
    {
      priority: Priority.Irrelevant,
      text: 'Irrelevant Priority',
      classes: ['bg-red-100', 'text-red-800', 'border-red-200'],
    },
    {
      priority: 'Unknown' as Priority,
      text: 'Unknown Priority',
      classes: ['bg-gray-100', 'text-gray-800', 'border-gray-200'],
    },
  ];

  it.each(testCases)('renders $text correctly with appropriate styles', ({ priority, text, classes }) => {
    render(<PriorityBadge priority={priority} />);
    const badge = screen.getByText(text);

    expect(badge).toBeInTheDocument();

    // Check base classes
    baseClasses.forEach((cls) => {
      expect(badge).toHaveClass(cls);
    });

    // Check specific classes
    classes.forEach((cls) => {
      expect(badge).toHaveClass(cls);
    });
  });
});
