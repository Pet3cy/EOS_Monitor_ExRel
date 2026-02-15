
import React, { useState } from 'react';
import { EventData } from '../types';
import { PriorityBadge } from './PriorityBadge';
import { Calendar, MapPin, Building2, User, Trash2 } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface EventCardProps {
  event: EventData;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
}

export const EventCard: React.FC<EventCardProps> = React.memo(({ event, onSelect, onDelete, isSelected }) => {
  const { analysis } = event;
  const [showConfirm, setShowConfirm] = useState(false);

  const getStatusColor = (status: string) => {
    if (status.startsWith('Completed')) return 'text-green-600';
    if (status === 'Not Relevant') return 'text-gray-400';
    if (status === 'To Respond') return 'text-blue-600';
    return 'text-slate-500';
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleCardClick = () => {
    onSelect(event.id);
  };

  const handleConfirmDelete = () => {
    onDelete(event.id);
    setShowConfirm(false);
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } }}
        tabIndex={0}
        aria-label={`View details for ${analysis.eventName}`}
        className={`p-4 mb-3 rounded-lg border cursor-pointer transition-all hover:shadow-md group/card relative focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
          isSelected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 bg-white'
        }`}
      >
        {/* Quick Action Delete */}
        <button 
          onClick={handleDeleteClick}
          className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover/card:opacity-100 focus:opacity-100"
          title="Delete Event"
          aria-label="Delete Event"
        >
          <Trash2 size={14} />
        </button>

        <div className="flex justify-between items-start mb-2 pr-6">
          <h3 className="font-semibold text-slate-800 line-clamp-1">{analysis.eventName}</h3>
          <div className="shrink-0">
              <PriorityBadge priority={analysis.priority} />
          </div>
        </div>
        
        <div className="text-sm text-slate-600 space-y-1">
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-slate-400" />
            <span className="truncate">{analysis.institution}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <span className="truncate">{analysis.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-slate-400" />
            <span className="truncate">{analysis.venue}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs border-t pt-2 border-slate-100">
          <div className="flex items-center gap-1 text-slate-500">
             <User size={12} /> 
             {event.contact.name ? `Contact: ${event.contact.name}` : 'No contact assigned'}
          </div>
          <div className={`font-medium ${getStatusColor(event.followUp.status)}`}>
            {event.followUp.status}
          </div>
        </div>
      </div>

      <ConfirmDeleteModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Invitation?"
        message={`Are you sure you want to delete "${analysis.eventName}"? All extracted analysis and assigned tasks will be lost.`}
      />
    </>
  );
});
