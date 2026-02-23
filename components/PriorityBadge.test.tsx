import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PriorityBadge } from './PriorityBadge';
import { Priority } from '../types';

describe('PriorityBadge', () => {
  const testCases = [
    {
      priority: Priority.High,
      expectedText: 'High Priority',
      expectedClasses: ['bg-green-100', 'text-green-800', 'border-green-200'],
    },
    {
      priority: Priority.Medium,
      expectedText: 'Medium Priority',
      expectedClasses: ['bg-orange-100', 'text-orange-800', 'border-orange-200'],
    },
    {
      priority: Priority.Low,
      expectedText: 'Low Priority',
      expectedClasses: ['bg-yellow-100', 'text-yellow-800', 'border-yellow-200'],
    },
    {
      priority: Priority.Irrelevant,
      expectedText: 'Irrelevant Priority',
      expectedClasses: ['bg-red-100', 'text-red-800', 'border-red-200'],
    },
    {
      priority: 'Unknown' as Priority,
      expectedText: 'Unknown Priority',
      expectedClasses: ['bg-gray-100', 'text-gray-800', 'border-gray-200'],
    },
  ];

  it.each(testCases)(
    'renders $priority priority correctly',
    ({ priority, expectedText, expectedClasses }) => {
      render(<PriorityBadge priority={priority} />);
      const badge = screen.getByText(expectedText);
      expect(badge).toBeInTheDocument();
      expectedClasses.forEach((className) => {
        expect(badge).toHaveClass(className);
      });
    }
  );

  it('matches snapshot', () => {
    const { container } = render(<PriorityBadge priority={Priority.High} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
