
import React, { useState, useMemo, useEffect } from 'react';
import { Contact, EventData } from '../types';
import { 
  Users, UserPlus, Mail, Briefcase, Building, 
  Search, Edit2, Trash2, X, Save, ExternalLink, 
  MapPin, Calendar, ChevronRight, Activity, Clock,
  ArrowUpAZ, ArrowDownAZ, FileText, Loader2
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface ContactsViewProps {
  contacts: Contact[];
  events: EventData[];
  onUpdateContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  onUpdateEvent: (event: EventData) => void;
  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({ 
  contacts, 
  events, 
  onUpdateContact, 
  onDeleteContact,
  onUpdateEvent,
  selectedContactId,
  setSelectedContactId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortField, setSortField] = useState<'name' | 'organization'>('name');
  
  const [notesBuffer, setNotesBuffer] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const prevContactIdRef = React.useRef<string | null>(null);

  const selectedContact = contacts.find(c => c.id === selectedContactId);

  // Sync notes buffer when selected contact changes
  useEffect(() => {
    // Save previous contact's notes before switching:
    if (prevContactIdRef.current && prevContactIdRef.current !== selectedContactId) {
      const prev = contacts.find(c => c.id === prevContactIdRef.current);
      if (prev && notesBuffer !== prev.notes) {
        onUpdateContact({ ...prev, notes: notesBuffer });
      }
    }
    prevContactIdRef.current = selectedContactId;

    if (selectedContact) {
      setNotesBuffer(selectedContact.notes || '');
      setSaveStatus('idle');
    }
  }, [selectedContactId, contacts]);

  // Auto-save notes after inactivity
  useEffect(() => {
    if (selectedContact && notesBuffer !== selectedContact.notes) {
      setSaveStatus('saving');
      const timeoutId = setTimeout(() => {
        onUpdateContact({
          ...selectedContact,
          notes: notesBuffer
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [notesBuffer, selectedContact, onUpdateContact]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContact) {
      onUpdateContact(editingContact);
      setEditingContact(null);
      setIsAdding(false);
    }
  };

  const handleSaveNotes = () => {
    if (selectedContact && notesBuffer !== selectedContact.notes) {
      setSaveStatus('saving');
      onUpdateContact({
        ...selectedContact,
        notes: notesBuffer
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.organization.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      const valA = sortField === 'name' ? a.name.toLowerCase() : a.organization.toLowerCase();
      const valB = sortField === 'name' ? b.name.toLowerCase() : b.organization.toLowerCase();
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [contacts, searchTerm, sortOrder, sortField]);

  const contactEvents = useMemo(() => {
    if (!selectedContactId) return [];
    return events
        .filter(e => e.contact.contactId === selectedContactId)
        .sort((a, b) => b.analysis.date.localeCompare(a.analysis.date));
  }, [selectedContactId, events]);

  const startAdding = () => {
    setIsAdding(true);
    setEditingContact({
      id: crypto.randomUUID(),
      name: '',
      email: '',
      role: '',
      organization: 'OBESSU',
      notes: ''
    });
  };

  return (
    <div className="flex h-full bg-slate-50">
      {/* Sidebar List */}
      <aside className="w-96 border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/50">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
              <Users size={14} /> Directory ({filteredContacts.length})
            </span>
            <div className="flex items-center gap-1">
                <select 
                  value={sortField} 
                  onChange={(e) => setSortField(e.target.value as 'name' | 'organization')}
                  className="text-xs font-bold text-slate-500 bg-transparent border-none outline-none cursor-pointer hover:text-slate-700"
                >
                  <option value="name">Name</option>
                  <option value="organization">Organization</option>
                </select>
                <button 
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? <ArrowUpAZ size={16} /> : <ArrowDownAZ size={16} />}
                </button>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search people..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
          
          <button 
            onClick={startAdding}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md shadow-slate-200"
          >
            <UserPlus size={16} /> Add New Contact
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No contacts found matching "{searchTerm}"
            </div>
          ) : (
            filteredContacts.map(contact => (
              <div 
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all group ${
                  selectedContactId === contact.id 
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{contact.name}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
                      <Briefcase size={12} className="text-slate-400 shrink-0" /> <span className="truncate">{contact.role}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium truncate">
                      <Building size={12} className="text-slate-400 shrink-0" /> <span className="truncate">{contact.organization}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingContact(contact); }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteId(contact.id); }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Detail Pane */}
      <main className="flex-1 overflow-y-auto p-8">
        {(editingContact || isAdding) ? (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-slate-900">{isAdding ? 'Create New Profile' : 'Edit Contact Profile'}</h2>
              <button onClick={() => { setEditingContact(null); setIsAdding(false); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input 
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={editingContact?.name}
                    onChange={(e) => setEditingContact(prev => prev ? {...prev, name: e.target.value} : null)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input 
                    required
                    type="email"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={editingContact?.email}
                    onChange={(e) => setEditingContact(prev => prev ? {...prev, email: e.target.value} : null)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job Title / Role</label>
                  <input 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={editingContact?.role}
                    onChange={(e) => setEditingContact(prev => prev ? {...prev, role: e.target.value} : null)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organization</label>
                  <input 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={editingContact?.organization}
                    onChange={(e) => setEditingContact(prev => prev ? {...prev, organization: e.target.value} : null)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bio / Initial Notes</label>
                <textarea 
                  rows={4}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                  value={editingContact?.notes}
                  onChange={(e) => setEditingContact(prev => prev ? {...prev, notes: e.target.value} : null)}
                  placeholder="Additional context about this person..."
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => { setEditingContact(null); setIsAdding(false); }} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
                <button type="submit" className="px-10 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all flex items-center gap-2">
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        ) : selectedContact ? (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header Card */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-lg shadow-blue-100 shrink-0">
                {selectedContact.name.charAt(0)}
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{selectedContact.name}</h2>
                    <p className="text-slate-500 font-medium text-lg mt-1">{selectedContact.role} @ {selectedContact.organization}</p>
                  </div>
                  <button 
                    onClick={() => setEditingContact(selectedContact)}
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all"
                  >
                    <Edit2 size={16} /> Edit Profile
                  </button>
                </div>
                <div className="flex flex-wrap gap-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <Mail size={14} className="text-slate-400" /> {selectedContact.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shadow-sm shadow-blue-100">
                   <Activity size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Activity Feed</h3>
              </div>

              {contactEvents.length > 0 ? (
                <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 py-2">
                  {contactEvents.map(event => (
                    <div key={event.id} className="relative pl-8">
                       {/* Timeline dot */}
                       <div className="absolute -left-[9px] top-6 w-4 h-4 bg-white border-4 border-blue-500 rounded-full shadow-sm z-10"></div>
                       
                       <div className="flex flex-col sm:flex-row sm:items-start justify-between group bg-white p-5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                            <div className="space-y-2 flex-1 mr-6">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <span className="flex items-center gap-1.5"><Calendar size={12} /> {event.analysis.date}</span>
                                    <span className="text-slate-300">•</span>
                                    <span className="flex items-center gap-1.5"><MapPin size={12} /> {event.analysis.venue}</span>
                                </div>
                                <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors leading-tight">
                                    {event.analysis.eventName}
                                </h4>
                                <div className="flex items-center gap-3 pt-1">
                                     <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                                        event.followUp.status.startsWith('Completed') 
                                        ? 'bg-green-50 text-green-700 border-green-100' 
                                        : 'bg-slate-50 text-slate-600 border-slate-100'
                                     }`}>
                                        <Clock size={10} /> {event.followUp.status}
                                     </span>
                                </div>
                            </div>
                            <div className="mt-4 sm:mt-0 shrink-0">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border shadow-sm ${
                                  event.contact.repRole === 'Speaker' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                  event.contact.repRole === 'Activity Host' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                  'bg-blue-50 text-blue-700 border-blue-100'
                                }`}>
                                   {event.contact.repRole === 'Speaker' && <Activity size={12}/>}
                                   <select 
                                      className="bg-transparent outline-none cursor-pointer appearance-none"
                                      value={event.contact.repRole}
                                      onChange={(e) => {
                                        onUpdateEvent({
                                          ...event,
                                          contact: {
                                            ...event.contact,
                                            repRole: e.target.value as any
                                          }
                                        });
                                      }}
                                   >
                                      <option value="Participant">Participant</option>
                                      <option value="Speaker">Speaker</option>
                                      <option value="Activity Host">Activity Host</option>
                                      <option value="Other">Other</option>
                                   </select>
                                </div>
                            </div>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity size={24} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold">No activity recorded yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Assignments and interactions will appear here.</p>
                </div>
              )}
            </div>

            {/* Administrative Context Section */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg shadow-sm shadow-yellow-100">
                      <FileText size={20} />
                   </div>
                   <h3 className="text-xl font-bold text-slate-900">Administrative Context</h3>
                 </div>
                 <div className="flex items-center gap-3">
                    {saveStatus === 'saving' && <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Saving...</span>}
                    {saveStatus === 'saved' && <span className="text-xs font-bold text-green-600 flex items-center gap-1">Saved</span>}
                    <button 
                      onClick={handleSaveNotes}
                      disabled={saveStatus === 'saving' || notesBuffer === selectedContact.notes}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold hover:bg-yellow-200 disabled:opacity-50 transition-colors"
                    >
                      <Save size={14} /> Save Notes
                    </button>
                 </div>
              </div>
              <div className="relative">
                <textarea
                    className="w-full p-6 bg-yellow-50/50 border border-yellow-200 rounded-2xl text-slate-700 focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-300 outline-none resize-none leading-relaxed shadow-sm transition-all"
                    rows={6}
                    value={notesBuffer}
                    onChange={(e) => setNotesBuffer(e.target.value)}
                    onBlur={handleSaveNotes}
                    placeholder="Add persistent notes here: key relationships, political stance, background info, or communication preferences..."
                />
                <div className="absolute bottom-4 right-4 text-[10px] font-bold text-yellow-600/60 uppercase tracking-widest pointer-events-none">
                    Auto-saves on blur
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
            <Users size={80} className="mb-6 opacity-20" />
            <h3 className="text-2xl font-bold">People & Partners</h3>
            <p className="text-slate-400 mt-2">Select a contact to manage their details and see event assignments.</p>
          </div>
        )}
      </main>

      <ConfirmDeleteModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) onDeleteContact(deleteId); }}
        title="Delete Contact Record?"
        message="This will remove the person from the directory. They will also be unassigned from any linked events, though the event records themselves will remain."
      />
    </div>
  );
};
