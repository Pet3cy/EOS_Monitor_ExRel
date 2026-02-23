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
    // Edge case: Undefined priority
    {
      priority: undefined as unknown as Priority,
      text: 'Priority',
      classes: ['bg-gray-100', 'text-gray-800', 'border-gray-200'],
    },
    // Edge case: Null priority
    {
      priority: null as unknown as Priority,
      text: 'Priority',
      classes: ['bg-gray-100', 'text-gray-800', 'border-gray-200'],
    },
  ];

  it.each(testCases)('renders correctly with appropriate styles', ({ priority, text, classes }) => {
    render(<PriorityBadge priority={priority} />);

    // Find badge by text and class to avoid matching container elements
    // This is more robust than checking tagName
    const badge = screen.getByText((content, element) => {
        const normalizedContent = content.trim();
        const expectedText = text.trim();
        // Check text content matches
        const textMatches = normalizedContent === expectedText || content === text;
        // Check it has the badge base class 'rounded-full' to ensure we target the badge element
        const isBadge = element?.classList.contains('rounded-full') ?? false;

        return textMatches && isBadge;
    });

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
