import React, { useState, useMemo } from 'react';
import { Plus, Search, Layout, Filter, CalendarClock, History, PieChart, Users, Calendar as CalendarIcon } from 'lucide-react';
import { EventData, Contact } from './types';
import { EventCard } from './components/EventCard';
import { EventDetail } from './components/EventDetail';
import { UploadModal } from './components/UploadModal';
import { Overview } from './components/Overview';
import { CalendarView } from './components/CalendarView';
import { ContactsView } from './components/ContactsView';
import { MOCK_CONTACTS, MOCK_EVENTS } from './data/mockData';

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
                        onAddContact={handleUpdateContact}
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
