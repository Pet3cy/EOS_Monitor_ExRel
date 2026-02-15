
import React, { useState, useMemo } from 'react';
import { EventData } from '../types';
import { Building2, FileText, CheckCircle2, Layers, Edit2, Check, X } from 'lucide-react';

interface OverviewProps {
  events: EventData[];
  onRenameStakeholder?: (oldName: string, newName: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ events, onRenameStakeholder }) => {
  const [editingStakeholder, setEditingStakeholder] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const stakeholders = useMemo(() => {
    const groups: Record<string, {
      completedEvents: EventData[];
      allEvents: EventData[];
      themes: Set<string>;
      papers: Set<string>;
    }> = {};

    events.forEach(event => {
      // Normalize institution name slightly to group better
      const name = event.analysis.institution.trim() || 'Unknown Stakeholder';
      
      if (!groups[name]) {
        groups[name] = {
          completedEvents: [],
          allEvents: [],
          themes: new Set(),
          papers: new Set()
        };
      }
      
      groups[name].allEvents.push(event);
      groups[name].themes.add(event.analysis.theme);
      event.analysis.linkedActivities.forEach(a => groups[name].papers.add(a));

      if (event.followUp.status.startsWith('Completed')) {
        groups[name].completedEvents.push(event);
      }
    });

    return Object.entries(groups)
      .map(([name, data]) => ({
        name,
        ...data,
        themes: Array.from(data.themes),
        papers: Array.from(data.papers)
      }))
      .sort((a, b) => b.allEvents.length - a.allEvents.length); // Sort by most active stakeholder
  }, [events]);

  const handleStartEdit = (name: string) => {
    setEditingStakeholder(name);
    setNewName(name);
  };

  const handleSaveEdit = (oldName: string) => {
    if (newName.trim() && newName !== oldName && onRenameStakeholder) {
      onRenameStakeholder(oldName, newName.trim());
    }
    setEditingStakeholder(null);
  };

  const handleCancelEdit = () => {
    setEditingStakeholder(null);
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-100">
                <Layers size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Stakeholder Overview</h2>
                <p className="text-slate-500 text-sm font-medium">Strategic breakdown of engagement, topics, and outcomes per partner.</p>
            </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ring-1 ring-slate-950/5">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest backdrop-blur-sm sticky top-0 z-10">
            <div className="col-span-3 p-5 border-r border-slate-200">Stakeholder / Organization</div>
            <div className="col-span-5 p-5 border-r border-slate-200">Recent Completed Engagements</div>
            <div className="col-span-4 p-5">Impact Metrics & Alignment</div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {stakeholders.map((stakeholder) => (
              <div key={stakeholder.name} className="grid grid-cols-12 hover:bg-slate-50/50 transition-colors group">
                
                {/* Column 1: Stakeholder (Editable) */}
                <div className="col-span-3 p-5 border-r border-slate-200 flex flex-col justify-start">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                        <Building2 size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        {editingStakeholder === stakeholder.name ? (
                          <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
                            <input 
                              autoFocus
                              className="w-full text-sm font-bold text-slate-900 bg-white border-2 border-blue-500 rounded-lg px-2 py-1 focus:ring-4 focus:ring-blue-500/10 outline-none"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(stakeholder.name);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                            <div className="flex shrink-0">
                              <button onClick={() => handleSaveEdit(stakeholder.name)} className="p-1 text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Save">
                                <Check size={16} />
                              </button>
                              <button onClick={handleCancelEdit} className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Cancel">
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="group/name relative">
                            <h3 
                              onClick={() => handleStartEdit(stakeholder.name)}
                              className="font-bold text-slate-800 text-sm leading-tight cursor-pointer hover:text-blue-600 transition-colors inline-block pr-6"
                            >
                              {stakeholder.name}
                              <Edit2 size={12} className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/name:opacity-100 text-slate-400 transition-opacity" />
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1 block">
                                {stakeholder.allEvents.length} total invitation{stakeholder.allEvents.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* Column 2: Completed Events */}
                <div className="col-span-5 p-5 border-r border-slate-200 bg-slate-50/30">
                  {stakeholder.completedEvents.length > 0 ? (
                    <div className="space-y-3">
                      {stakeholder.completedEvents.map(e => (
                        <div key={e.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex gap-3 items-start hover:border-green-200 transition-colors">
                           <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                           <div className="min-w-0">
                               <h4 className="text-sm font-bold text-slate-900 leading-tight mb-1 truncate">{e.analysis.eventName}</h4>
                               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                   <span>{e.analysis.date}</span>
                                   <span>•</span>
                                   <span className="truncate">{e.analysis.venue}</span>
                               </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-4 border-2 border-dashed border-slate-200 rounded-xl">
                        <span className="text-xs font-bold uppercase tracking-widest">No completed events</span>
                    </div>
                  )}
                </div>

                {/* Column 3: Metrics */}
                <div className="col-span-4 p-5 space-y-6">
                  {/* Stats */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                     <div className="text-center px-4">
                        <span className="block text-2xl font-black text-slate-900">{stakeholder.allEvents.length}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Total</span>
                     </div>
                     <div className="text-center px-4 border-l border-slate-100">
                        <span className="block text-2xl font-black text-indigo-600">{stakeholder.themes.length}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Topics</span>
                     </div>
                     <div className="text-center px-4 border-l border-slate-100">
                        <span className="block text-2xl font-black text-blue-600">{stakeholder.papers.length}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Papers</span>
                     </div>
                  </div>

                  {/* Topics */}
                  <div className="space-y-2">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fields of Engagement</div>
                      <div className="flex flex-wrap gap-1.5">
                          {stakeholder.themes.map(t => (
                              <span key={t} className="px-2 py-1 bg-white text-slate-700 text-[10px] font-bold uppercase rounded-lg border border-slate-200 shadow-sm">
                                  {t}
                              </span>
                          ))}
                          {stakeholder.themes.length === 0 && <span className="text-xs text-slate-400 italic">No topics analyzed</span>}
                      </div>
                  </div>

                  {/* Papers */}
                  <div className="space-y-2">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OBESSU Strategic Links</div>
                       {stakeholder.papers.length > 0 ? (
                           <ul className="space-y-1.5">
                              {stakeholder.papers.map(p => (
                                  <li key={p} className="text-[11px] text-blue-700 bg-blue-50/50 px-2.5 py-1.5 rounded-lg border border-blue-100 flex items-start gap-2 font-medium">
                                      <FileText size={12} className="mt-0.5 shrink-0 text-blue-400"/>
                                      <span className="leading-tight">{p}</span>
                                  </li>
                              ))}
                           </ul>
                       ) : (
                           <span className="text-xs text-slate-400 italic">No specific documents linked.</span>
                       )}
                  </div>
                </div>

              </div>
            ))}
            
            {stakeholders.length === 0 && (
               <div className="p-20 text-center text-slate-500">
                   <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Building2 size={32} className="text-slate-300" />
                   </div>
                   <p className="text-lg font-bold text-slate-900">No stakeholder engagement tracked.</p>
                   <p className="text-sm text-slate-500 mt-1">New invitations will populate this strategic dashboard automatically.</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
