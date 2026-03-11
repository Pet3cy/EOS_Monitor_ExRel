import React from 'react';
import { Priority } from '../types';

interface PriorityBadgeProps {
  priority: Priority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const getStyle = () => {
    switch (priority) {
      case Priority.High:
        return "bg-red-100 text-red-800 border-red-200";
      case Priority.Medium:
        return "bg-amber-100 text-amber-800 border-amber-200";
      case Priority.Low:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case Priority.Irrelevant:
        return "bg-slate-100 text-slate-500 border-slate-200";
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
