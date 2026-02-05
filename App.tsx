
import React, { useState, useMemo } from 'react';
import { Plus, Search, Layout, Filter, CalendarClock, History, PieChart, Users, Calendar as CalendarIcon } from 'lucide-react';
import { EventData, Priority, Contact } from './types';
import { EventCard } from './components/EventCard';
import { EventDetail } from './components/EventDetail';
import { UploadModal } from './components/UploadModal';
import { Overview } from './components/Overview';
import { CalendarView } from './components/CalendarView';
import { ContactsView } from './components/ContactsView';

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
      programmeLink: 'https://docs.google.com/document/d/1dRAGmqrVwBpmVZfeIaob3gVmRqVpSewZ'
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

type ViewMode = 'calendar' | 'upcoming' | 'past' | 'overview' | 'contacts';

export default function App() {
  const [events, setEvents] = useState<EventData[]>(MOCK_EVENTS);
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

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
    setEvents(prev => prev.filter(e => e.id !== id));
    if (selectedEventId === id) setSelectedEventId(null);
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

  const filteredEvents = events.filter(e => {
    const matchesSearch = 
      e.analysis.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.analysis.institution.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (viewMode === 'upcoming') {
      return !isCompletedOrArchived(e.followUp.status);
    } else if (viewMode === 'past') {
      return isCompletedOrArchived(e.followUp.status);
    }
    return true;
  });

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
                <Layout className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">OBESSU Event Flow</h1>
            </div>
            
            <div className="flex items-center gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                type="text" 
                placeholder="Search events..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 transition-all"
                />
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
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
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
                selectedContactId={selectedContactId}
                setSelectedContactId={setSelectedContactId}
              />
            </div>
        ) : (
            <>
                <aside className="w-96 border-r border-slate-200 bg-white flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    {viewMode === 'upcoming' ? 'Active' : 'Archived'} List ({filteredEvents.length})
                    </span>
                    <button className="text-slate-400 hover:text-slate-600"><Filter size={16} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                    {filteredEvents.length === 0 ? (
                    <div className="text-center py-10 text-slate-400"><p>No {viewMode} events found.</p></div>
                    ) : (
                    filteredEvents.map(event => (
                        <EventCard 
                        key={event.id} 
                        event={event} 
                        isSelected={selectedEventId === event.id}
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
      </main>

      {isUploadModalOpen && (
        <UploadModal 
          onClose={() => setIsUploadModalOpen(false)} 
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}
    </div>
  );
}
