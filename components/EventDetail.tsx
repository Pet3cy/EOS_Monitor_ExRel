
import React, { useState, useEffect } from 'react';
import { EventData, Priority, RepresentativeRole, Contact } from '../types';
import { PriorityBadge } from './PriorityBadge';
import { 
  Calendar, MapPin, Building2, AlertCircle, Clock, FileText, 
  UserPlus, Mail, MessageSquare, CheckCircle, Save, Mic, FileAudio, Loader2, Sparkles, Megaphone, Image as ImageIcon, X, Link as LinkIcon, ExternalLink, Briefcase, Trash2, Copy, FileCheck, Users, User, FileJson, FileSpreadsheet, Download
} from 'lucide-react';
import { generateBriefing } from '../services/geminiService';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface EventDetailProps {
  event: EventData;
  onUpdate: (updatedEvent: EventData) => void;
  onDelete: () => void;
  contacts?: Contact[];
  onViewContact?: (contactId: string) => void;
}

type TabType = 'context' | 'logistics' | 'prep' | 'outcomes';

export const EventDetail: React.FC<EventDetailProps> = ({ event, onUpdate, onDelete, contacts = [], onViewContact }) => {
  const [localEvent, setLocalEvent] = useState<EventData>(event);
  const [activeTab, setActiveTab] = useState<TabType>('context');
  const [isEditing, setIsEditing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);

  useEffect(() => {
    setLocalEvent(JSON.parse(JSON.stringify(event)));
    setIsEditing(false);
  }, [event]);

  const handleChange = (section: keyof EventData, field: string, value: any) => {
    setLocalEvent(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
    setIsEditing(true);
  };

  const handleBriefingGen = async () => {
    setIsGeneratingBrief(true);
    try {
      const brief = await generateBriefing(localEvent);
      handleChange('followUp', 'briefing', brief);
    } catch (e) {
      alert("Failed to generate briefing.");
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handlePickContact = (contact: Contact) => {
    setLocalEvent(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        contactId: contact.id,
        name: contact.name,
        email: contact.email,
        role: contact.role,
        organization: contact.organization
      }
    }));
    setIsEditing(true);
    setShowContactPicker(false);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(localEvent, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const fileName = `${localEvent.analysis.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    linkElement.click();
  };

  const handleExportCSV = () => {
    const flattenObject = (obj: any, prefix = ''): Record<string, string> => {
      return Object.keys(obj).reduce((acc: any, k: string) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
          Object.assign(acc, flattenObject(obj[k], pre + k));
        } else if (Array.isArray(obj[k])) {
          acc[pre + k] = obj[k].join('; ');
        } else {
          acc[pre + k] = String(obj[k]);
        }
        return acc;
      }, {});
    };

    const flatEvent = flattenObject(localEvent);
    const headers = Object.keys(flatEvent);
    const values = Object.values(flatEvent).map(v => {
      const sanitized = v.replace(/"/g, '""');
      const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
      if (dangerousChars.some(char => sanitized.startsWith(char))) {
        return `"'${sanitized}"`;
      }
      return `"${sanitized}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + values.join(",");

    const fileName = `${localEvent.analysis.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
    const encodedUri = encodeURI(csvContent);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", encodedUri);
    linkElement.setAttribute("download", fileName);
    linkElement.click();
  };

  const handleSave = () => {
    onUpdate(localEvent);
    setIsEditing(false);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
            <div className="flex-1 min-w-0 pr-4">
               <div className="flex items-center gap-3 mb-2">
                   <PriorityBadge priority={localEvent.analysis.priority} />
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{localEvent.analysis.theme}</span>
               </div>
               <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-2">{localEvent.analysis.eventName}</h2>
               <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                   <span className="flex items-center gap-1.5"><Building2 size={16} className="text-slate-400"/> {localEvent.analysis.institution}</span>
                   <span className="flex items-center gap-1.5"><Calendar size={16} className="text-slate-400"/> {localEvent.analysis.date}</span>
               </div>
            </div>
            
            <div className="flex items-center gap-2">
                <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm mr-2">
                    <button 
                        onClick={handleExportJSON}
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors tooltip"
                        title="Export as JSON"
                    >
                        <FileJson size={18} />
                    </button>
                    <div className="w-px bg-slate-200 mx-1 my-1"></div>
                    <button 
                        onClick={handleExportCSV}
                        className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors tooltip"
                        title="Export as CSV"
                    >
                        <FileSpreadsheet size={18} />
                    </button>
                </div>

                {isEditing ? (
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                    >
                        <Save size={18} /> Save Changes
                    </button>
                ) : (
                    <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Event"
                    >
                        <Trash2 size={20} />
                    </button>
                )}
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
            <TabButton active={activeTab === 'context'} onClick={() => setActiveTab('context')} icon={<FileText size={16}/>} label="Context & Analysis" />
            <TabButton active={activeTab === 'logistics'} onClick={() => setActiveTab('logistics')} icon={<MapPin size={16}/>} label="Logistics & Links" />
            <TabButton active={activeTab === 'prep'} onClick={() => setActiveTab('prep')} icon={<Briefcase size={16}/>} label="Briefing & Prep" />
            <TabButton active={activeTab === 'outcomes'} onClick={() => setActiveTab('outcomes')} icon={<CheckCircle size={16}/>} label="Outcomes" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
            {activeTab === 'context' && (
                <div className="space-y-6 max-w-3xl">
                    <Section title="Event Description">
                        <textarea 
                            className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-700 leading-relaxed focus:ring-2 focus:ring-blue-500/20 outline-none resize-none h-32"
                            value={localEvent.analysis.description}
                            onChange={(e) => handleChange('analysis', 'description', e.target.value)}
                        />
                    </Section>

                    <div className="grid grid-cols-2 gap-6">
                        <Section title="Strategic Priority">
                            <div className="bg-white p-4 border border-slate-200 rounded-xl">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-slate-700">Relevance Score</span>
                                    <span className="text-2xl font-black text-blue-600">{localEvent.analysis.priorityScore}/100</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                                    <div className="bg-blue-600 h-2 rounded-full" style={{width: `${localEvent.analysis.priorityScore}%`}}></div>
                                </div>
                                <p className="text-sm text-slate-500 italic">{localEvent.analysis.priorityReasoning}</p>
                            </div>
                        </Section>
                        <Section title="Related Activities">
                             <div className="bg-white p-4 border border-slate-200 rounded-xl h-full">
                                {localEvent.analysis.linkedActivities.length > 0 ? (
                                    <ul className="space-y-2">
                                        {localEvent.analysis.linkedActivities.map((act, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                                                <ExternalLink size={14} /> {act}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-slate-400 text-sm">No linked internal activities found.</p>}
                             </div>
                        </Section>
                    </div>
                </div>
            )}

            {activeTab === 'logistics' && (
                <div className="space-y-6 max-w-3xl">
                    <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date & Time</label>
                                <input 
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    value={localEvent.analysis.date}
                                    onChange={(e) => handleChange('analysis', 'date', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Venue / Platform</label>
                                <input 
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    value={localEvent.analysis.venue}
                                    onChange={(e) => handleChange('analysis', 'venue', e.target.value)}
                                />
                            </div>
                         </div>
                         <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registration Deadline</label>
                                <input 
                                    type="date"
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    value={localEvent.analysis.finalDeadline}
                                    onChange={(e) => handleChange('analysis', 'finalDeadline', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 pt-2">
                                {localEvent.analysis.registrationLink && (
                                    <a href={localEvent.analysis.registrationLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline">
                                        <ExternalLink size={14}/> Open Registration Page
                                    </a>
                                )}
                                {localEvent.analysis.programmeLink && (
                                    <a href={localEvent.analysis.programmeLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline">
                                        <FileText size={14}/> View Agenda / Programme
                                    </a>
                                )}
                            </div>
                         </div>
                    </div>
                </div>
            )}

            {activeTab === 'prep' && (
                <div className="space-y-8 max-w-4xl">
                     {/* Representative Assignment */}
                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2"><User size={18} /> Assigned Representative</h3>
                            <div className="relative">
                                <button 
                                    onClick={() => setShowContactPicker(!showContactPicker)}
                                    className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1"
                                >
                                    <Users size={12}/> {localEvent.contact.name ? 'Change Person' : 'Assign Person'}
                                </button>
                                {showContactPicker && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden">
                                        <div className="p-2 border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Contact</div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {contacts.map(c => (
                                                <button 
                                                    key={c.id} 
                                                    onClick={() => handlePickContact(c)}
                                                    className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm font-medium text-slate-700 truncate"
                                                >
                                                    {c.name} <span className="text-slate-400 text-xs">({c.role})</span>
                                                </button>
                                            ))}
                                            <button 
                                                onClick={() => { setShowContactPicker(false); /* Logic to add new contact could go here */ }}
                                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-blue-600 border-t border-slate-100"
                                            >
                                                + Create New Contact
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {localEvent.contact.name ? (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                                    {localEvent.contact.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-slate-900">{localEvent.contact.name}</div>
                                    <div className="text-sm text-slate-500">{localEvent.contact.role} @ {localEvent.contact.organization}</div>
                                </div>
                                <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Role at Event</label>
                                    <select 
                                        className="bg-transparent font-bold text-sm text-slate-700 outline-none"
                                        value={localEvent.contact.repRole}
                                        onChange={(e) => handleChange('contact', 'repRole', e.target.value)}
                                    >
                                        <option value="Participant">Participant</option>
                                        <option value="Speaker">Speaker</option>
                                        <option value="Activity Host">Activity Host</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle size={16}/> No representative assigned yet.
                            </div>
                        )}
                     </div>

                     <Section title="Briefing & Key Messages">
                        <div className="relative">
                            <textarea 
                                className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-700 leading-relaxed focus:ring-2 focus:ring-blue-500/20 outline-none h-48 resize-none"
                                placeholder="Key points to raise, red lines, and strategic objectives..."
                                value={localEvent.followUp.briefing}
                                onChange={(e) => handleChange('followUp', 'briefing', e.target.value)}
                            />
                            <button 
                                onClick={handleBriefingGen}
                                disabled={isGeneratingBrief}
                                className="absolute bottom-4 right-4 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                            >
                                {isGeneratingBrief ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} className="text-yellow-400"/>}
                                Generate with AI
                            </button>
                        </div>
                     </Section>
                </div>
            )}

            {activeTab === 'outcomes' && (
                <div className="space-y-6 max-w-3xl">
                    <Section title="Post-Event Report">
                        <textarea 
                            className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-700 leading-relaxed focus:ring-2 focus:ring-blue-500/20 outline-none h-32 resize-none"
                            placeholder="Summary of outcomes, key contacts made, and follow-up tasks..."
                            value={localEvent.followUp.postEventNotes}
                            onChange={(e) => handleChange('followUp', 'postEventNotes', e.target.value)}
                        />
                    </Section>
                    
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                         <div>
                             <h4 className="font-bold text-slate-900 mb-1">Status</h4>
                             <p className="text-sm text-slate-500">Current workflow stage</p>
                         </div>
                         <select 
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm text-slate-700 outline-none"
                            value={localEvent.followUp.status}
                            onChange={(e) => handleChange('followUp', 'status', e.target.value)}
                         >
                            <option value="To Respond">To Respond</option>
                            <option value="Confirmation - To be briefed">Confirmation - To be briefed</option>
                            <option value="Prep ready">Prep ready</option>
                            <option value="Completed - No follow up">Completed - No follow up</option>
                            <option value="Completed - Follow Up">Completed - Follow Up</option>
                            <option value="Not Relevant">Not Relevant</option>
                         </select>
                    </div>
                </div>
            )}
        </div>

        <ConfirmDeleteModal 
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={onDelete}
            title="Delete Event?"
            message="Are you sure you want to remove this event and all associated data? This action cannot be undone."
        />
    </div>
  );
};

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
        {children}
    </div>
);

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 transition-colors ${
            active ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
        }`}
    >
        {icon} {label}
    </button>
);
