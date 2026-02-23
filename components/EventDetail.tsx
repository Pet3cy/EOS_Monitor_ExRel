
import React, { useState, useEffect, useRef } from 'react';
import { EventData, Priority, RepresentativeRole, Contact } from '../types';
import { PriorityBadge } from './PriorityBadge';
import { 
  Calendar, MapPin, Building2, AlertCircle, Clock, FileText, 
  UserPlus, Mail, MessageSquare, CheckCircle, Save, Mic, FileAudio, Loader2, Sparkles, Megaphone, Image as ImageIcon, X, Link as LinkIcon, ExternalLink, Briefcase, Trash2, Copy, FileCheck, Users, User, FileJson, FileSpreadsheet, Download, Plus, Search, Edit2, Repeat, Repeat1, CalendarPlus, ChevronDown, Target, Zap, ShieldAlert, ArrowRight
} from 'lucide-react';
import { summarizeFollowUp, generateBriefing } from '../services/geminiService';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface EventDetailProps {
  event: EventData;
  onUpdate: (updatedEvent: EventData) => void;
  onDelete: () => void;
  contacts?: Contact[];
  onViewContact?: (contactId: string) => void;
}

type TabType = 'context' | 'logistics' | 'prep' | 'outcomes' | 'raw';
type ViewMode = 'report' | 'editor';

export const EventDetail: React.FC<EventDetailProps> = ({ event, onUpdate, onDelete, contacts = [], onViewContact }) => {
  const [localEvent, setLocalEvent] = useState<EventData>(event);
  const [viewMode, setViewMode] = useState<ViewMode>('report');
  const [activeTab, setActiveTab] = useState<TabType>('context');
  const [isEditing, setIsEditing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  
  // States for link editing
  const [isEditingRegLink, setIsEditingRegLink] = useState(false);
  const [isEditingProgLink, setIsEditingProgLink] = useState(false);

  // Refs for click outside
  const calendarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalEvent(JSON.parse(JSON.stringify(event)));
    setIsEditing(false);
    setIsEditingRegLink(false);
    setIsEditingProgLink(false);
  }, [event]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarMenuRef.current && !calendarMenuRef.current.contains(event.target as Node)) {
        setShowCalendarMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleRecurrenceChange = (field: string, value: any) => {
    setLocalEvent(prev => ({
      ...prev,
      analysis: {
        ...prev.analysis,
        recurrence: {
          ...(prev.analysis.recurrence || { isRecurring: false, frequency: 'Weekly', interval: 1 }),
          [field]: value
        }
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
    setContactSearch('');
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.organization.toLowerCase().includes(contactSearch.toLowerCase())
  );

  // --- Export Functions ---

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
    const values = Object.values(flatEvent).map(v => `"${v.replace(/"/g, '""')}"`);

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

  // --- Calendar Functions ---

  const getEventDates = () => {
    const dateStr = localEvent.analysis.date;
    const start = new Date(dateStr);
    if (isNaN(start.getTime())) {
        const now = new Date();
        return { start: now, end: new Date(now.getTime() + 60*60*1000) };
    }
    if (start.getHours() === 0 && start.getMinutes() === 0) {
        start.setHours(9, 0, 0, 0);
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000); 
    return { start, end };
  };

  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
  };

  const handleGoogleCalendar = () => {
    const { start, end } = getEventDates();
    const { eventName, description, venue } = localEvent.analysis;
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', eventName);
    url.searchParams.append('dates', `${formatDateForGoogle(start)}/${formatDateForGoogle(end)}`);
    url.searchParams.append('details', description);
    url.searchParams.append('location', venue);
    window.open(url.toString(), '_blank');
    setShowCalendarMenu(false);
  };

  const handleOutlookCalendar = () => {
    const { start, end } = getEventDates();
    const { eventName, description, venue } = localEvent.analysis;
    const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
    url.searchParams.append('subject', eventName);
    url.searchParams.append('body', description);
    url.searchParams.append('startdt', start.toISOString());
    url.searchParams.append('enddt', end.toISOString());
    url.searchParams.append('location', venue);
    window.open(url.toString(), '_blank');
    setShowCalendarMenu(false);
  };

  const handleDownloadICS = () => {
    const { start, end } = getEventDates();
    const { eventName, description, venue } = localEvent.analysis;
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//OBESSU//Event Analyzer//EN
BEGIN:VEVENT
UID:${crypto.randomUUID()}
DTSTAMP:${formatDateForGoogle(new Date())}
DTSTART:${formatDateForGoogle(start)}
DTEND:${formatDateForGoogle(end)}
SUMMARY:${eventName}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
LOCATION:${venue}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${eventName.replace(/[^a-z0-9]/gi, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowCalendarMenu(false);
  };

  const handleSave = () => {
    onUpdate(localEvent);
    setIsEditing(false);
    setIsEditingRegLink(false);
    setIsEditingProgLink(false);
  };

  const splitBriefing = (text: string) => {
    // Simple logic to extract potential "red lines" if the AI generated them
    // This assumes the AI output format in geminiService
    const parts = text.split(/Red Lines|RED LINES|Red lines/);
    if (parts.length > 1) {
        return {
            objectives: parts[0],
            redLines: parts[1]
        };
    }
    return { objectives: text, redLines: '' };
  };

  const briefingContent = splitBriefing(localEvent.followUp.briefing);

  // --- Render ---

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden text-slate-100 font-sans">
        
        {/* Toggle Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-[#0B0F19]">
            <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Building2 size={16} />
                 </div>
                 <span className="text-xs font-bold tracking-[0.2em] text-white">OBESSU EVENT MANAGEMENT</span>
            </div>
            
            <div className="flex bg-slate-800 p-1 rounded-lg">
                <button 
                    onClick={() => setViewMode('report')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                        viewMode === 'report' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    Briefing
                </button>
                <button 
                    onClick={() => setViewMode('editor')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                        viewMode === 'editor' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    Editor
                </button>
            </div>

            <div className="flex items-center gap-2">
                 {/* Shared Actions */}
                 <div className="flex items-center gap-1">
                    <button onClick={handleExportJSON} className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors" title="Export JSON"><FileJson size={16}/></button>
                    <div className="relative" ref={calendarMenuRef}>
                        <button onClick={() => setShowCalendarMenu(!showCalendarMenu)} className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors" title="Calendar">
                            <CalendarPlus size={16}/>
                        </button>
                        {showCalendarMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700 z-50 overflow-hidden text-slate-300">
                                <button onClick={handleGoogleCalendar} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700">Google Calendar</button>
                                <button onClick={handleOutlookCalendar} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700">Outlook Web</button>
                                <button onClick={handleDownloadICS} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700">Download .ICS</button>
                            </div>
                        )}
                    </div>
                    {viewMode === 'editor' && (
                        <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-slate-400 hover:text-red-400 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    )}
                 </div>
            </div>
        </div>

        {viewMode === 'report' ? (
            // --- REPORT MODE ---
            <div className="flex-1 overflow-y-auto bg-[#0B0F19] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <div className="max-w-3xl mx-auto p-8 space-y-8">
                    
                    {/* Header */}
                    <header>
                        <div className="inline-block px-3 py-1 bg-emerald-900/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full mb-4 border border-emerald-900/50">
                            {localEvent.analysis.theme} Report
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.1] mb-8">
                            {localEvent.analysis.eventName}
                        </h1>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 border-t border-slate-800 pt-6">
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Location</span>
                                <span className="text-sm font-medium text-slate-200">{localEvent.analysis.venue}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Dates</span>
                                <span className="text-sm font-medium text-slate-200">{localEvent.analysis.date} {localEvent.analysis.time ? `@ ${localEvent.analysis.time}` : ''}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Deadline</span>
                                <span className="text-sm font-medium text-emerald-400">{localEvent.analysis.finalDeadline}</span>
                            </div>
                        </div>
                    </header>

                    {/* Event Purpose */}
                    <section className="bg-[#131B2C] rounded-2xl p-6 border border-slate-800/50">
                        <h3 className="text-lg font-bold text-white mb-4">Event Purpose</h3>
                        <p className="text-slate-400 leading-relaxed mb-6">
                            {localEvent.analysis.description}
                        </p>
                        
                        {localEvent.analysis.threadSummary && (
                            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-800/50 rounded-xl">
                                <h4 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Sparkles size={14} /> Thread Summary
                                </h4>
                                <p className="text-blue-200/80 text-sm leading-relaxed italic">
                                    {localEvent.analysis.threadSummary}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {localEvent.analysis.linkedActivities.length > 0 ? (
                                localEvent.analysis.linkedActivities.slice(0, 2).map((act, i) => (
                                    <div key={i} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                        <span className="text-emerald-500 text-xs font-bold uppercase mb-1 block">Context {i + 1}</span>
                                        <p className="text-slate-300 font-medium text-sm">{act}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                    <span className="text-emerald-500 text-xs font-bold uppercase mb-1 block">Context</span>
                                    <p className="text-slate-300 font-medium text-sm">No linked activities found.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Priority */}
                        <div className="bg-[#131B2C] rounded-2xl p-6 border border-slate-800/50 flex flex-col justify-between relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-3 opacity-10">
                                 <Target size={100} className="text-emerald-500" />
                             </div>
                             <div className="relative z-10">
                                 <span className="text-6xl font-black text-white tracking-tighter block mb-2">{localEvent.analysis.priorityScore}</span>
                                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Priority Score</span>
                             </div>
                             <div className="mt-6 relative z-10">
                                 <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                                     localEvent.analysis.priority === Priority.High ? 'bg-emerald-500 text-slate-900' : 
                                     localEvent.analysis.priority === Priority.Medium ? 'bg-orange-500 text-white' : 
                                     'bg-slate-700 text-slate-300'
                                 }`}>
                                     {localEvent.analysis.priority} Level
                                 </span>
                             </div>
                        </div>

                        {/* Assigned */}
                        <div className="bg-[#131B2C] rounded-2xl p-6 border border-slate-800/50 flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Assigned Individual</span>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl font-bold text-emerald-400 border border-slate-700">
                                    {localEvent.contact.name ? localEvent.contact.name.charAt(0) : '?'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        {localEvent.contact.name || 'Unassigned'}
                                    </h3>
                                    <p className="text-emerald-500 font-medium text-sm">
                                        {localEvent.contact.role || 'No Role'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Strip */}
                    <div className="bg-[#131B2C] rounded-2xl p-6 border border-slate-800/50 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Contact Secretariat</span>
                            <span className="text-white font-medium text-lg">{localEvent.analysis.senderEmail || localEvent.contact.email || 'No email available'}</span>
                        </div>
                        <a href={`mailto:${localEvent.analysis.senderEmail || localEvent.contact.email}`} className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-slate-900 hover:bg-emerald-400 transition-colors">
                            <Mail size={20} />
                        </a>
                    </div>

                    {/* Strategic Analysis */}
                    <section>
                         <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Strategic Analysis</h2>
                         
                         <div className="space-y-6">
                            <div className="bg-[#131B2C] rounded-2xl p-6 border border-slate-800/50">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-xl font-black text-emerald-500">01</span>
                                    <h3 className="text-lg font-bold text-white">Relevance Assessment</h3>
                                </div>
                                <p className="text-slate-400 italic mb-4 pl-9 border-l-2 border-slate-700">
                                    "{localEvent.analysis.priorityReasoning}"
                                </p>
                            </div>

                            <div className="bg-[#131B2C] rounded-2xl p-6 border border-slate-800/50">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-xl font-black text-emerald-500">02</span>
                                    <h3 className="text-lg font-bold text-white">Portfolio Alignment</h3>
                                </div>
                                <div className="pl-9">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Lead Member</span>
                                    <h4 className="text-xl font-bold text-white mb-4">{localEvent.contact.name || 'TBD'}</h4>
                                    
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Focus Areas</span>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-bold text-slate-300 border border-slate-700">{localEvent.analysis.theme}</span>
                                        {localEvent.analysis.linkedActivities.map((act, i) => (
                                            <span key={i} className="px-3 py-1 bg-slate-800 rounded-full text-xs font-bold text-slate-300 border border-slate-700">{act}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                         </div>
                    </section>

                    {/* Executive Briefing */}
                    <section>
                         <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Executive Briefing</h2>
                         
                         <div className="mb-8">
                             <h4 className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-4">Key Objectives</h4>
                             <div className="bg-[#131B2C] rounded-2xl p-6 border border-slate-800/50 text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {briefingContent.objectives || "Briefing not generated yet."}
                             </div>
                         </div>

                         {briefingContent.redLines && (
                             <div className="mb-8 bg-red-950/20 rounded-2xl p-6 border border-red-900/30">
                                 <h4 className="text-red-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                     <ShieldAlert size={14}/> Red Lines
                                 </h4>
                                 <div className="text-red-200/80 whitespace-pre-wrap leading-relaxed">
                                     {briefingContent.redLines}
                                 </div>
                             </div>
                         )}

                         {localEvent.followUp.commsPack.remarks && (
                             <div>
                                 <h4 className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-4">Opening Statements</h4>
                                 <div className="bg-[#131B2C] rounded-2xl p-6 border-l-4 border-emerald-500 italic text-slate-300">
                                     "{localEvent.followUp.commsPack.remarks}"
                                 </div>
                             </div>
                         )}
                    </section>

                    {/* Footer Application Details */}
                    <section className="bg-emerald-600 rounded-3xl p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700 opacity-50 z-0"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Application Details</h2>
                            <p className="text-emerald-900 font-medium mb-8 max-w-md mx-auto">
                                Confirm guidelines and prepare materials for the upcoming deadline.
                            </p>
                            
                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                {localEvent.analysis.registrationLink && (
                                    <a 
                                        href={localEvent.analysis.registrationLink} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-transform hover:scale-105 shadow-xl"
                                    >
                                        Register for Event <ArrowRight size={18} />
                                    </a>
                                )}
                                <button 
                                    onClick={handleGoogleCalendar}
                                    className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-transform hover:scale-105 shadow-xl border border-slate-200"
                                >
                                    <CalendarPlus size={18} className="text-blue-600" /> Google Calendar
                                </button>
                                <button 
                                    onClick={handleOutlookCalendar}
                                    className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-transform hover:scale-105 shadow-xl border border-slate-200"
                                >
                                    <CalendarPlus size={18} className="text-blue-500" /> Outlook
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                                    <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest block mb-1">Status</span>
                                    <span className="text-white font-bold text-lg">{localEvent.followUp.status}</span>
                                </div>
                                <div className="bg-emerald-900/20 backdrop-blur-sm p-4 rounded-xl border border-emerald-900/10">
                                    <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest block mb-1">Deadline</span>
                                    <span className="text-slate-900 font-bold text-lg">{localEvent.analysis.finalDeadline}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        ) : (
            // --- EDITOR MODE (Previous UI) ---
            <div className="flex-1 overflow-hidden flex flex-col bg-white">
                {/* Header (Light) */}
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
                    {isEditing && (
                        <button 
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                        >
                            <Save size={18} /> Save Changes
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6 bg-white">
                    <TabButton active={activeTab === 'context'} onClick={() => setActiveTab('context')} icon={<FileText size={16}/>} label="Context & Analysis" />
                    <TabButton active={activeTab === 'logistics'} onClick={() => setActiveTab('logistics')} icon={<MapPin size={16}/>} label="Logistics & Links" />
                    <TabButton active={activeTab === 'prep'} onClick={() => setActiveTab('prep')} icon={<Briefcase size={16}/>} label="Briefing & Prep" />
                    <TabButton active={activeTab === 'outcomes'} onClick={() => setActiveTab('outcomes')} icon={<CheckCircle size={16}/>} label="Outcomes" />
                    <TabButton active={activeTab === 'raw'} onClick={() => setActiveTab('raw')} icon={<FileJson size={16}/>} label="Raw Data" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 text-slate-900">
                    {activeTab === 'context' && (
                        <div className="space-y-6 max-w-3xl">
                            <Section title="Event Description">
                                <textarea 
                                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-700 leading-relaxed focus:ring-2 focus:ring-blue-500/20 outline-none resize-none h-32"
                                    value={localEvent.analysis.description}
                                    onChange={(e) => handleChange('analysis', 'description', e.target.value)}
                                />
                            </Section>

                            {localEvent.analysis.threadSummary && (
                                <Section title="Thread Summary (AI Generated)">
                                    <div className="w-full p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 leading-relaxed text-sm italic">
                                        {localEvent.analysis.threadSummary}
                                    </div>
                                </Section>
                            )}

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
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                                        <input 
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                            value={localEvent.analysis.date}
                                            onChange={(e) => handleChange('analysis', 'date', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</label>
                                        <input 
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                            value={localEvent.analysis.time || ''}
                                            onChange={(e) => handleChange('analysis', 'time', e.target.value)}
                                            placeholder="e.g. 14:00 CET"
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

                                    {/* Recurrence Section */}
                                    <div className="pt-2 border-t border-slate-100">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Recurrence Pattern</label>
                                        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="checkbox" 
                                                    id="isRecurring"
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                    checked={localEvent.analysis.recurrence?.isRecurring || false}
                                                    onChange={(e) => handleRecurrenceChange('isRecurring', e.target.checked)}
                                                />
                                                <label htmlFor="isRecurring" className="text-sm font-bold text-slate-700">Recurring Event</label>
                                            </div>
                                            
                                            {localEvent.analysis.recurrence?.isRecurring && (
                                                <div className="grid grid-cols-2 gap-3 pl-6 animate-in slide-in-from-top-2">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Frequency</label>
                                                        <select 
                                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none"
                                                            value={localEvent.analysis.recurrence?.frequency || 'Weekly'}
                                                            onChange={(e) => handleRecurrenceChange('frequency', e.target.value)}
                                                        >
                                                            <option value="Daily">Daily</option>
                                                            <option value="Weekly">Weekly</option>
                                                            <option value="Monthly">Monthly</option>
                                                            <option value="Yearly">Yearly</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Until</label>
                                                        <input 
                                                            type="date"
                                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none"
                                                            value={localEvent.analysis.recurrence?.endDate || ''}
                                                            onChange={(e) => handleRecurrenceChange('endDate', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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
                                    
                                    {/* Interactive Links Section */}
                                    <div className="space-y-4 pt-2">
                                        {/* Registration Link */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registration Link</label>
                                            {localEvent.analysis.registrationLink && !isEditingRegLink ? (
                                                <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl group hover:border-blue-300 transition-colors">
                                                    <a 
                                                        href={localEvent.analysis.registrationLink} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="text-blue-600 underline text-sm font-medium truncate flex-1 mr-2"
                                                    >
                                                        {localEvent.analysis.registrationLink}
                                                    </a>
                                                    <div className="flex gap-2">
                                                         <button 
                                                            onClick={() => setIsEditingRegLink(true)} 
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit Link"
                                                         >
                                                            <Edit2 size={14}/>
                                                         </button>
                                                         <a 
                                                            href={localEvent.analysis.registrationLink} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Open Link"
                                                         >
                                                            <ExternalLink size={14}/>
                                                         </a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <input 
                                                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                                                        value={localEvent.analysis.registrationLink || ''}
                                                        onChange={(e) => handleChange('analysis', 'registrationLink', e.target.value)}
                                                        onBlur={() => { if(localEvent.analysis.registrationLink) setIsEditingRegLink(false); }}
                                                        placeholder="https://..."
                                                        autoFocus={isEditingRegLink}
                                                    />
                                                    {localEvent.analysis.registrationLink && (
                                                        <button 
                                                            onClick={() => setIsEditingRegLink(false)}
                                                            className="p-2 text-slate-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Programme Link */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Programme / Agenda Link</label>
                                            {localEvent.analysis.programmeLink && !isEditingProgLink ? (
                                                <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl group hover:border-blue-300 transition-colors">
                                                    <a 
                                                        href={localEvent.analysis.programmeLink} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="text-blue-600 underline text-sm font-medium truncate flex-1 mr-2"
                                                    >
                                                        {localEvent.analysis.programmeLink}
                                                    </a>
                                                    <div className="flex gap-2">
                                                         <button 
                                                            onClick={() => setIsEditingProgLink(true)} 
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit Link"
                                                         >
                                                            <Edit2 size={14}/>
                                                         </button>
                                                         <a 
                                                            href={localEvent.analysis.programmeLink} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Open Link"
                                                         >
                                                            <ExternalLink size={14}/>
                                                         </a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <input 
                                                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                                                        value={localEvent.analysis.programmeLink || ''}
                                                        onChange={(e) => handleChange('analysis', 'programmeLink', e.target.value)}
                                                        onBlur={() => { if(localEvent.analysis.programmeLink) setIsEditingProgLink(false); }}
                                                        placeholder="https://..."
                                                        autoFocus={isEditingProgLink}
                                                    />
                                                    {localEvent.analysis.programmeLink && (
                                                        <button 
                                                            onClick={() => setIsEditingProgLink(false)}
                                                            className="p-2 text-slate-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
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
                                            onClick={() => {
                                                setShowContactPicker(!showContactPicker);
                                                setContactSearch('');
                                            }}
                                            className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1"
                                        >
                                            <Users size={12}/> {localEvent.contact.name ? 'Change Person' : 'Assign Person'}
                                        </button>
                                        {showContactPicker && (
                                            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden flex flex-col">
                                                <div className="p-3 border-b border-slate-100 bg-slate-50 space-y-2">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Contact</div>
                                                    <div className="relative">
                                                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                                                        <input 
                                                            autoFocus
                                                            type="text"
                                                            placeholder="Search people..." 
                                                            className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-700"
                                                            value={contactSearch}
                                                            onChange={(e) => setContactSearch(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                    {filteredContacts.length > 0 ? (
                                                        filteredContacts.map(c => (
                                                        <button 
                                                            key={c.id} 
                                                            onClick={() => handlePickContact(c)}
                                                            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm font-medium text-slate-700 truncate border-b border-slate-50 last:border-0"
                                                        >
                                                            <div className="font-bold text-slate-800">{c.name}</div>
                                                            <div className="text-xs text-slate-500 truncate">{c.role}</div>
                                                        </button>
                                                    ))) : (
                                                        <div className="p-4 text-center text-xs text-slate-400 italic">No contacts match "{contactSearch}"</div>
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={() => { setShowContactPicker(false); /* Logic to add new contact could go here */ }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold text-blue-600 border-t border-slate-100 bg-slate-50/50"
                                                >
                                                    + Create New Contact
                                                </button>
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
                                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm text-slate-700 outline-none min-w-[240px]"
                                    value={localEvent.followUp.status}
                                    onChange={(e) => handleChange('followUp', 'status', e.target.value)}
                                 >
                                    <option value="To Respond">To Respond</option>
                                    <option value="Responded - On hold for updates">Responded - On hold for updates</option>
                                    <option value="Confirmation - To be briefed">Confirmation - To be briefed</option>
                                    <option value="Prep ready">Prep ready</option>
                                    <option value="Completed - No follow up">Completed - No follow up</option>
                                    <option value="Completed - Follow Up">Completed - Follow Up</option>
                                    <option value="MOs comms">MOs comms</option>
                                    <option value="Not Relevant">Not Relevant</option>
                                 </select>
                            </div>
                        </div>
                    )}

                    {activeTab === 'raw' && (
                        <div className="space-y-6 max-w-4xl">
                            <Section title="Original Source Text">
                                <div className="bg-slate-900 text-slate-300 p-6 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap border border-slate-800 h-[500px] overflow-y-auto">
                                    {localEvent.originalText || "No original text available."}
                                </div>
                            </Section>
                            <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-xs flex items-center gap-2 border border-blue-100">
                                <AlertCircle size={14}/> 
                                Use this view to verify the AI's extraction accuracy against the source email.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

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
