
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Layout, Filter, CalendarClock, History, PieChart, Users, Calendar as CalendarIcon, CheckSquare, Trash2, CheckCircle2, ArrowUpDown, Undo2, X, Mail } from 'lucide-react';
import { EventData, Priority, Contact } from './types';
import { EventCard } from './components/EventCard';
import { EventDetail } from './components/EventDetail';
import { UploadModal } from './components/UploadModal';
import { Overview } from './components/Overview';
import { CalendarView } from './components/CalendarView';
import { ContactsView } from './components/ContactsView';

import { CalendarSync } from './components/CalendarSync';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EmailParserView } from './components/EmailParserView';
import { LiveAssistant } from './components/LiveAssistant';

const MOCK_CONTACTS: Contact[] = [
  { id: 'c20', name: 'Alessandro Di Miceli', email: 'alessandro@obessu.org', role: 'Board Member', organization: 'OBESSU', notes: 'Portfolio: VET and Apprenticeships' },
  { id: 'c21', name: 'Elodie Böhling', email: 'elodie@obessu.org', role: 'Board Member', organization: 'OBESSU', notes: 'Portfolio: Democracy and Student Rights' },
  { id: 'c22', name: 'Ívar Máni Hrannarsson', email: 'ivar@obessu.org', role: 'Board Member', organization: 'OBESSU', notes: 'Portfolio: Social Affairs' },
  { id: 'c23', name: 'Kacper Bogalecki', email: 'kacper@obessu.org', role: 'Board Member', organization: 'OBESSU', notes: 'Portfolio: Organisational Development' },
  { id: 'c24', name: 'Lauren Bond', email: 'lauren@obessu.org', role: 'Board Member', organization: 'OBESSU', notes: 'Portfolio: Education Policy' },
  { id: 'c25', name: 'Rui Teixeira', email: 'rui@obessu.org', role: 'Secretary General', organization: 'OBESSU', notes: 'Overall management and external representation' },
  { id: 'c26', name: 'Raquel Moreno Beneit', email: 'raquel@obessu.org', role: 'Communications Coordinator', organization: 'OBESSU', notes: 'Campaigns and Digital Presence' },
  { id: 'c27', name: 'Panagiotis Chatzimichail', email: 'panagiotis@obessu.org', role: 'Head of External Affairs', organization: 'OBESSU', notes: 'Lead on LLL Labs and Erasmus+ Projects' },
  { id: 'c28', name: 'Amira Bakr', email: 'amira@obessu.org', role: 'Policy and Outreach Assistant', organization: 'OBESSU', notes: 'Policy monitoring' },
  { id: 'c29', name: 'Francesca Osima', email: 'francesca@obessu.org', role: 'Head of Projects and Operations', organization: 'OBESSU', notes: 'Project management' },
  { id: 'c30', name: 'Daniele Sabato', email: 'daniele@obessu.org', role: 'Project & Policy Coordinator', organization: 'OBESSU', notes: 'VET Strategy' }
];

const MOCK_EVENTS: EventData[] = [
  {
    id: 'e1',
    createdAt: Date.now(),
    originalText: 'Solidar Webinar invitation',
    analysis: {
      sender: 'Panagiotis Chatzimichail',
      institution: 'Solidar',
      eventName: 'Solidar Webinar: Advocacy Campaigning',
      theme: 'School Student Rights & Democracy',
      description: 'Planning a session on how to plan, implement, monitor, evaluate an Advocacy Campaign. OBESSU expertise is requested for this topic.',
      priority: Priority.High,
      priorityScore: 85,
      priorityReasoning: 'Strategic partnership with Solidar on advocacy capacity building.',
      date: '2026-02-10',
      venue: 'Online (Zoom)',
      initialDeadline: '2026-02-05',
      finalDeadline: '2026-02-09',
      linkedActivities: ['Advocacy Handbook', 'Capacity Building Workplan'],
      recurrence: { isRecurring: false, frequency: 'Weekly', interval: 1 }
    },
    contact: { 
        contactId: 'c27',
        name: 'Panagiotis Chatzimichail', 
        email: 'panagiotis@obessu.org', 
        role: 'Head of External Affairs', 
        organization: 'OBESSU',
        repRole: 'Speaker',
        polContact: 'Rui Teixeira',
        notes: '' 
    },
    followUp: { 
      briefing: 'Focus on OBESSU’s recent successful campaigns on student participation.', 
      prepResources: '',
      commsPack: { remarks: '', representative: 'Panagiotis', datePlace: 'Feb 10, Online', additionalInfo: '' },
      postEventNotes: '', 
      status: 'To Respond'
    }
  },
  {
    id: 'e2',
    createdAt: Date.now(),
    originalText: 'R2P Webinar content',
    analysis: {
      sender: 'Panagiotis Chatzimichail',
      institution: 'Research to Policy (R2P)',
      eventName: 'R2P: Smartphone & Social Media Restrictions impact',
      theme: 'Digital Education & AI',
      description: 'Webinar discussing the impact of smartphones and social media restrictions on education based on evidence from schools in Europe.',
      priority: Priority.Medium,
      priorityScore: 70,
      priorityReasoning: 'Relevant for OBESSU’s digital education positions and student well-being.',
      date: '2026-02-12',
      venue: 'Online',
      initialDeadline: '2026-02-10',
      finalDeadline: '2026-02-11',
      linkedActivities: ['Digital Education Position Paper'],
    },
    contact: { 
        contactId: 'c21',
        name: 'Elodie Böhling', 
        email: 'elodie@obessu.org', 
        role: 'Board Member', 
        organization: 'OBESSU',
        repRole: 'Participant',
        polContact: 'Panagiotis',
        notes: '' 
    },
    followUp: { 
      briefing: '', 
      prepResources: '',
      commsPack: { remarks: '', representative: 'Elodie', datePlace: 'Feb 12, Online', additionalInfo: '' },
      postEventNotes: '', 
      status: 'Confirmation - To be briefed'
    }
  },
  {
    id: 'e3',
    createdAt: Date.now(),
    originalText: 'LLL Labs 2026 Kick-off',
    analysis: {
      sender: 'Panagiotis Chatzimichail',
      institution: 'Lifelong Learning Platform',
      eventName: 'Lifelong Learning Labs 2026 (Kick-off)',
      theme: 'Inclusive Education & Social Justice',
      description: 'The sixth edition featuring four distinct online training courses for national stakeholders in education and training.',
      priority: Priority.High,
      priorityScore: 90,
      priorityReasoning: 'Long-term core project with LLLP, essential for membership engagement.',
      date: '2026-02-19',
      venue: 'Online',
      initialDeadline: '2026-02-15',
      finalDeadline: '2026-02-18',
      linkedActivities: ['LLL Labs 2026 Series'],
      registrationLink: 'https://us06web.zoom.us/j/83728709029',
      programmeLink: 'https://docs.google.com/document/d/1dRAGmqrVwBpmVZfeIaob3gVmRqVpSewZ',
      recurrence: { isRecurring: true, frequency: 'Weekly', interval: 1, endDate: '2026-04-30' }
    },
    contact: { 
        contactId: 'c27',
        name: 'Panagiotis Chatzimichail', 
        email: 'panagiotis@obessu.org', 
        role: 'Head of External Affairs', 
        organization: 'OBESSU',
        repRole: 'Activity Host',
        polContact: 'Rui Teixeira',
        notes: '' 
    },
    followUp: { 
      briefing: 'Coordinate with trainers for the first lab session.', 
      prepResources: 'Shared Google Doc for Lab 1 agenda.',
      commsPack: { remarks: '', representative: 'Panagiotis', datePlace: 'Feb 19, Online', additionalInfo: '' },
      postEventNotes: '', 
      status: 'Confirmation - To be briefed'
    }
  },
  {
    id: 'e4',
    createdAt: Date.now(),
    originalText: 'VET Strategy Consultation',
    analysis: {
      sender: 'Daniele Sabato',
      institution: 'European Commission (DG EMPL)',
      eventName: 'VET Strategy Consultation: Quality & Future-readiness',
      theme: 'Vocational Education & Training (VET)',
      description: 'Online consultation session on VET strategy focusing on quality and future-readiness. Guests include Amira Bakr and Daniele Sabato.',
      priority: Priority.High,
      priorityScore: 92,
      priorityReasoning: 'Direct influence on the upcoming EU VET Strategy review.',
      date: '2026-02-23',
      venue: 'Online (Paris/Brussels Time)',
      initialDeadline: '2026-02-15',
      finalDeadline: '2026-02-20',
      linkedActivities: ['VET Advocacy Campaign', 'Apprenticeship Rights Paper'],
    },
    contact: { 
        contactId: 'c20',
        name: 'Alessandro Di Miceli', 
        email: 'alessandro@obessu.org', 
        role: 'Board Member', 
        organization: 'OBESSU',
        repRole: 'Participant',
        polContact: 'Daniele Sabato',
        notes: '' 
    },
    followUp: { 
      briefing: 'Advocate for better protection of apprentices and quality in VET education.', 
      prepResources: '',
      commsPack: { remarks: '', representative: 'Alessandro', datePlace: 'Feb 23, Online', additionalInfo: '' },
      postEventNotes: '', 
      status: 'To Respond'
    }
  },
  {
    id: 'e5',
    createdAt: Date.now(),
    originalText: 'LLLAB #2',
    analysis: {
      sender: 'Panagiotis Chatzimichail',
      institution: 'Lifelong Learning Platform',
      eventName: 'LLLAB #2: Social European Semester',
      theme: 'School Student Rights & Democracy',
      description: 'Lab session on Engaging nationally in the European Semester and strengthening lifelong learning within it.',
      priority: Priority.High,
      priorityScore: 88,
      priorityReasoning: 'Focus on national engagement and the European Semester is critical for OBESSU MOs.',
      date: '2026-02-26',
      venue: 'Online',
      initialDeadline: '2026-02-20',
      finalDeadline: '2026-02-24',
      linkedActivities: ['LLL Labs 2026 Series', 'European Semester Working Group'],
      programmeLink: 'https://docs.google.com/document/d/1StEDQTbQwb8r93ILjwljNGNRmGdAxOT-'
    },
    contact: { 
        contactId: 'c30',
        name: 'Daniele Sabato', 
        email: 'daniele@obessu.org', 
        role: 'Project & Policy Coordinator', 
        organization: 'OBESSU',
        repRole: 'Speaker',
        polContact: 'Panagiotis',
        notes: '' 
    },
    followUp: { 
      briefing: 'Present OBESSU views on how the European Semester can better include school student voices.', 
      prepResources: '',
      commsPack: { remarks: '', representative: 'Daniele', datePlace: 'Feb 26, Online', additionalInfo: '' },
      postEventNotes: '', 
      status: 'To Respond'
    }
  }
];

type ViewMode = 'calendar' | 'upcoming' | 'past' | 'overview' | 'contacts' | 'emailParser';
type SortField = 'date' | 'priority' | 'institution';
type SortOrder = 'asc' | 'desc';

export default function App() {
  const [events, setEvents] = useState<EventData[]>(MOCK_EVENTS);
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [repRoleFilter, setRepRoleFilter] = useState<string>('All');
  const [showPastEvents, setShowPastEvents] = useState<boolean>(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  
  // Sorting State
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Undo State
  const [deletedEventsHistory, setDeletedEventsHistory] = useState<{ events: EventData[], timestamp: number } | null>(null);
  const [statusChangeHistory, setStatusChangeHistory] = useState<{ events: EventData[], timestamp: number } | null>(null);

  const [hasStarted, setHasStarted] = useState(false);

  const handleAnalysisComplete = (newEvent: EventData) => {
    if (!newEvent.followUp.commsPack) {
      newEvent.followUp.commsPack = {
        remarks: '',
        representative: newEvent.contact.name || '',
        datePlace: `${newEvent.analysis.date} @ ${newEvent.analysis.venue}`,
        additionalInfo: '',
      };
    }
    setEvents(prev => [newEvent, ...prev]);
    if (viewMode === 'overview' || viewMode === 'past') setViewMode('upcoming');
    setSelectedEventId(newEvent.id);
  };

  const handleUpdateEvent = (updatedEvent: EventData) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };

  const handleDeleteEvent = (id: string) => {
    const eventToDelete = events.find(e => e.id === id);
    if (eventToDelete) {
        setDeletedEventsHistory({ events: [eventToDelete], timestamp: Date.now() });
        setEvents(prev => prev.filter(e => e.id !== id));
        if (selectedEventId === id) setSelectedEventId(null);
        setSelectedEventIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }
  };

  const handleUpdateContact = (updatedContact: Contact) => {
    setContacts(prev => {
      const exists = prev.find(c => c.id === updatedContact.id);
      if (exists) {
        return prev.map(c => c.id === updatedContact.id ? updatedContact : c);
      }
      return [...prev, updatedContact];
    });

    // Propagate changes to events
    setEvents(prev => prev.map(e => {
      if (e.contact.contactId === updatedContact.id) {
        return {
          ...e,
          contact: {
            ...e.contact,
            name: updatedContact.name,
            email: updatedContact.email,
            role: updatedContact.role,
            organization: updatedContact.organization
          }
        };
      }
      return e;
    }));
  };

  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    setEvents(prev => prev.map(e => {
      if (e.contact.contactId === id) {
        return { ...e, contact: { ...e.contact, contactId: undefined } };
      }
      return e;
    }));
    if (selectedContactId === id) setSelectedContactId(null);
  };

  const handleViewContactProfile = (contactId: string) => {
    setSelectedContactId(contactId);
    setViewMode('contacts');
  };

  const handleRenameStakeholder = (oldName: string, newName: string) => {
    setEvents(prev => prev.map(e => {
      if (e.analysis.institution === oldName) {
        return {
          ...e,
          analysis: {
            ...e.analysis,
            institution: newName
          }
        };
      }
      return e;
    }));
  };

  const isCompletedOrArchived = (status: string) => {
      return status.startsWith('Completed') || status === 'Not Relevant';
  };

  const filteredEvents = useMemo(() => {
    let result = events.filter(e => {
      const matchesSearch = 
        e.analysis.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.analysis.institution.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter !== 'All' && e.followUp.status !== statusFilter) return false;

      // Rep Role filter
      if (repRoleFilter !== 'All' && e.contact.repRole !== repRoleFilter) return false;

      if (viewMode === 'upcoming') {
        if (!showPastEvents && isCompletedOrArchived(e.followUp.status)) return false;
      } else if (viewMode === 'past') {
        return isCompletedOrArchived(e.followUp.status);
      }
      return true;
    });

    // Apply Sort
    result.sort((a, b) => {
        let comparison = 0;
        if (sortField === 'date') {
            comparison = a.analysis.date.localeCompare(b.analysis.date);
        } else if (sortField === 'priority') {
            comparison = a.analysis.priorityScore - b.analysis.priorityScore;
        } else if (sortField === 'institution') {
            comparison = a.analysis.institution.localeCompare(b.analysis.institution);
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [events, searchTerm, statusFilter, viewMode, sortField, sortOrder]);

  // Bulk Actions
  const handleToggleSelect = (id: string) => {
    setSelectedEventIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    const eventsToDelete = events.filter(e => selectedEventIds.has(e.id));
    setDeletedEventsHistory({ events: eventsToDelete, timestamp: Date.now() });
    
    setEvents(prev => prev.filter(e => !selectedEventIds.has(e.id)));
    if (selectedEventId && selectedEventIds.has(selectedEventId)) setSelectedEventId(null);
    setSelectedEventIds(new Set());
  };

  const handleBulkMarkCompleted = () => {
    const eventsToUpdate = events.filter(e => selectedEventIds.has(e.id));
    setStatusChangeHistory({ events: eventsToUpdate, timestamp: Date.now() });

    setEvents(prev => prev.map(e => {
      if (selectedEventIds.has(e.id)) {
        return {
          ...e,
          followUp: { ...e.followUp, status: 'Completed - No follow up' }
        };
      }
      return e;
    }));
    setSelectedEventIds(new Set());
  };

  const handleUndoDelete = () => {
    if (deletedEventsHistory) {
        setEvents(prev => [...prev, ...deletedEventsHistory.events]);
        setDeletedEventsHistory(null);
    }
  };

  const handleUndoStatusChange = () => {
    if (statusChangeHistory) {
        setEvents(prev => prev.map(e => {
            const oldEvent = statusChangeHistory.events.find(old => old.id === e.id);
            if (oldEvent) return oldEvent;
            return e;
        }));
        setStatusChangeHistory(null);
    }
  };

  // Clear undo history after 8 seconds
  useEffect(() => {
    if (deletedEventsHistory) {
        const timer = setTimeout(() => setDeletedEventsHistory(null), 8000);
        return () => clearTimeout(timer);
    }
  }, [deletedEventsHistory]);

  useEffect(() => {
    if (statusChangeHistory) {
        const timer = setTimeout(() => setStatusChangeHistory(null), 8000);
        return () => clearTimeout(timer);
    }
  }, [statusChangeHistory]);

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const uniqueStatuses = useMemo(() => {
    const filteredByMode = events.filter(e => {
      if (viewMode === 'upcoming') return !isCompletedOrArchived(e.followUp.status);
      if (viewMode === 'past') return isCompletedOrArchived(e.followUp.status);
      return true;
    });
    return Array.from(new Set(filteredByMode.map(e => e.followUp.status)));
  }, [events, viewMode]);

  if (!hasStarted) {
    return <WelcomeScreen onGetStarted={() => setHasStarted(true)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
                <Layout className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">EventFlow AI</h1>
            </div>
            
            <div className="flex items-center gap-4">
            <CalendarSync onEventsSynced={(newEvents) => {
              setEvents(prev => {
                const existingIds = new Set(prev.map(e => e.id));
                const uniqueNewEvents = newEvents.filter(e => !existingIds.has(e.id));
                return [...prev, ...uniqueNewEvents];
              });
            }} />
            <div className="relative flex items-center">
                <Search className="absolute left-3 text-slate-400" size={18} />
                <input 
                type="text" 
                placeholder="Search events..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
            </div>
            <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
            >
                <Plus size={18} />
                Add Invitation
            </button>
            </div>
        </div>

        <div className="flex px-6 gap-6">
            <button 
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'calendar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <CalendarIcon size={16} />
                Calendar
            </button>
            <button 
                onClick={() => setViewMode('upcoming')}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'upcoming' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <CalendarClock size={16} />
                Upcoming
            </button>
            <button 
                onClick={() => setViewMode('past')}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'past' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <History size={16} />
                Past
            </button>
            <button 
                onClick={() => setViewMode('contacts')}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'contacts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <Users size={16} />
                Contacts
            </button>
            <button 
                onClick={() => setViewMode('overview')}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <PieChart size={16} />
                Overview
            </button>
            <button 
                onClick={() => setViewMode('emailParser')}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'emailParser' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <Mail size={16} />
                Email Parser
            </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {viewMode === 'calendar' ? (
            <div className="w-full h-full"><CalendarView events={events} /></div>
        ) : viewMode === 'overview' ? (
            <div className="w-full h-full"><Overview events={events} onRenameStakeholder={handleRenameStakeholder} /></div>
        ) : viewMode === 'contacts' ? (
            <div className="w-full h-full">
              <ContactsView 
                contacts={contacts} 
                events={events} 
                onUpdateContact={handleUpdateContact} 
                onDeleteContact={handleDeleteContact}
                onUpdateEvent={handleUpdateEvent}
                selectedContactId={selectedContactId}
                setSelectedContactId={setSelectedContactId}
              />
            </div>
        ) : viewMode === 'emailParser' ? (
            <div className="w-full h-full">
              <EmailParserView onEventsExtracted={(newEvents) => {
                setEvents(prev => [...newEvents, ...prev]);
              }} />
            </div>
        ) : (
            <>
                <aside className="w-96 border-r border-slate-200 bg-white flex flex-col shrink-0 z-10 shadow-lg shadow-slate-200/50">
                {/* Sidebar Header with Filter or Bulk Actions */}
                {selectedEventIds.size > 0 ? (
                  <div className="p-4 border-b border-blue-200 flex flex-col gap-3 bg-blue-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-blue-800 flex items-center gap-2">
                          <CheckSquare size={16} /> {selectedEventIds.size} Selected
                        </span>
                        <button 
                            onClick={() => setSelectedEventIds(new Set())}
                            className="text-xs font-medium text-blue-600 hover:underline"
                        >
                            Cancel
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleBulkMarkCompleted}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white text-blue-700 font-bold text-xs rounded-lg border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-sm"
                      >
                         <CheckCircle2 size={14} /> Mark Complete
                      </button>
                      <button 
                        onClick={handleBulkDelete}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white text-red-600 font-bold text-xs rounded-lg border border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
                      >
                         <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                      {viewMode === 'upcoming' ? 'Active' : 'Archived'} List ({filteredEvents.length})
                      </span>
                    </div>

                    {/* Filter Row */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
                            <span className="pl-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Status</span>
                            <div className="relative flex-1">
                               <select 
                                  className="w-full p-1.5 bg-transparent border-none text-xs font-medium outline-none text-slate-700 cursor-pointer"
                                  value={statusFilter}
                                  onChange={(e) => setStatusFilter(e.target.value)}
                               >
                                  <option value="All">All Statuses</option>
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

                        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
                            <span className="pl-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Role</span>
                            <div className="relative flex-1">
                               <select 
                                  className="w-full p-1.5 bg-transparent border-none text-xs font-medium outline-none text-slate-700 cursor-pointer"
                                  value={repRoleFilter}
                                  onChange={(e) => setRepRoleFilter(e.target.value)}
                               >
                                  <option value="All">All Roles</option>
                                  <option value="Speaker">Speaker</option>
                                  <option value="Participant">Participant</option>
                                  <option value="Activity Host">Activity Host</option>
                                  <option value="Other">Other</option>
                               </select>
                           </div>
                        </div>
                    </div>

                    {/* Show Past Events Toggle (Only in Upcoming View) */}
                    {viewMode === 'upcoming' && (
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-medium text-slate-600">Show Past Events</span>
                            <button 
                                onClick={() => setShowPastEvents(!showPastEvents)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${showPastEvents ? 'bg-blue-600' : 'bg-slate-200'}`}
                            >
                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showPastEvents ? 'translate-x-5' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    )}

                    {/* Sorting Row */}
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
                        <span className="pl-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Sort By</span>
                        <div className="flex flex-1 gap-1">
                            {['Date', 'Priority', 'Institution'].map((field) => {
                                const f = field.toLowerCase() as SortField;
                                return (
                                    <button 
                                        key={f}
                                        onClick={() => {
                                            if (sortField === f) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                                            else { setSortField(f); setSortOrder('asc'); }
                                        }}
                                        className={`flex-1 py-1.5 px-2 rounded-md text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${
                                            sortField === f 
                                            ? 'bg-blue-50 text-blue-700' 
                                            : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {field}
                                        {sortField === f && (
                                            <ArrowUpDown size={10} className={sortOrder === 'asc' ? '' : 'rotate-180 transition-transform'} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                  </div>
                )}
                
                <div className="flex-1 overflow-y-auto p-3 bg-slate-50">
                    {filteredEvents.length === 0 ? (
                    <div className="text-center py-10 text-slate-400"><p>No {viewMode} events found.</p></div>
                    ) : (
                    filteredEvents.map(event => (
                        <EventCard 
                        key={event.id} 
                        event={event} 
                        isSelected={selectedEventId === event.id}
                        showCheckbox={true}
                        isChecked={selectedEventIds.has(event.id)}
                        onToggleSelect={() => handleToggleSelect(event.id)}
                        onClick={() => setSelectedEventId(event.id)}
                        onDelete={() => handleDeleteEvent(event.id)}
                        />
                    ))
                    )}
                </div>
                </aside>

                <section className="flex-1 p-6 bg-slate-50/50 overflow-hidden">
                {selectedEvent && filteredEvents.some(e => e.id === selectedEvent.id) ? (
                    <EventDetail 
                        event={selectedEvent} 
                        onUpdate={handleUpdateEvent}
                        onDelete={() => handleDeleteEvent(selectedEvent.id)}
                        contacts={contacts}
                        onViewContact={handleViewContactProfile}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Layout size={64} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium">Select an event to view details</p>
                    </div>
                )}
                </section>
            </>
        )}

        {/* Undo Delete Toast */}
        {deletedEventsHistory && (
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-4 border border-slate-700">
                    <div className="text-sm font-medium">
                        Deleted {deletedEventsHistory.events.length} event{deletedEventsHistory.events.length !== 1 ? 's' : ''}
                    </div>
                    <div className="h-4 w-px bg-slate-700"></div>
                    <button 
                        onClick={handleUndoDelete}
                        className="text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                    >
                        <Undo2 size={16} /> Undo
                    </button>
                    <button 
                        onClick={() => setDeletedEventsHistory(null)}
                        className="text-slate-500 hover:text-slate-300 ml-2"
                    >
                        <X size={16} />
                    </button>
                </div>
             </div>
        )}

        {/* Undo Status Change Toast */}
        {statusChangeHistory && (
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-4 border border-slate-700">
                    <div className="text-sm font-medium">
                        Updated {statusChangeHistory.events.length} event{statusChangeHistory.events.length !== 1 ? 's' : ''}
                    </div>
                    <div className="h-4 w-px bg-slate-700"></div>
                    <button 
                        onClick={handleUndoStatusChange}
                        className="text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                    >
                        <Undo2 size={16} /> Undo
                    </button>
                    <button 
                        onClick={() => setStatusChangeHistory(null)}
                        className="text-slate-500 hover:text-slate-300 ml-2"
                    >
                        <X size={16} />
                    </button>
                </div>
             </div>
        )}

      </main>

      {isUploadModalOpen && (
        <UploadModal 
          onClose={() => setIsUploadModalOpen(false)} 
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}
      
      <LiveAssistant />
    </div>
  );
}
