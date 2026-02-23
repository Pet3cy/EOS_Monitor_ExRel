import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PriorityBadge } from './PriorityBadge';
import { Priority } from '../types';

describe('PriorityBadge', () => {
  const testCases = [
    {
      priority: Priority.High,
      label: 'High Priority',
      classes: ['bg-green-100', 'text-green-800', 'border-green-200'],
    },
    {
      priority: Priority.Medium,
      label: 'Medium Priority',
      classes: ['bg-orange-100', 'text-orange-800', 'border-orange-200'],
    },
    {
      priority: Priority.Low,
      label: 'Low Priority',
      classes: ['bg-yellow-100', 'text-yellow-800', 'border-yellow-200'],
    },
    {
      priority: Priority.Irrelevant,
      label: 'Irrelevant Priority',
      classes: ['bg-red-100', 'text-red-800', 'border-red-200'],
    },
    {
      priority: 'Unknown' as Priority,
      label: 'Unknown Priority',
      classes: ['bg-gray-100', 'text-gray-800', 'border-gray-200'],
    },
  ];

  it.each(testCases)('renders $label correctly', ({ priority, label, classes }) => {
    render(<PriorityBadge priority={priority} />);
    const badge = screen.getByText(label);
    expect(badge).toBeInTheDocument();
    classes.forEach((className) => {
      expect(badge).toHaveClass(className);
    });
  });
});
