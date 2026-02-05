import React from 'react';
import { Priority } from '../types';

interface PriorityBadgeProps {
  priority: Priority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const getStyle = () => {
    switch (priority) {
      case Priority.High:
        return "bg-green-100 text-green-800 border-green-200";
      case Priority.Medium:
        return "bg-orange-100 text-orange-800 border-orange-200";
      case Priority.Low:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case Priority.Irrelevant:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyle()}`}>
      {priority} Priority
    </span>
  );
};
