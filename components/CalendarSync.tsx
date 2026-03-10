import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { EventData, Priority } from '../types';

interface CalendarSyncProps {
  onEventsSynced: (events: EventData[]) => void;
}

export const CALENDAR_OWNER_MAP: Record<string, string> = {
  'panagiotis@obessu.org': 'Panagiotis Chatzimichail',
  'panagiotischatzimichail@gmail.com': 'Panagiotis Chatzimichail',
  'amira@obessu.org': 'Amira Bakr',
  'daniele@obessu.org': 'Daniele Sabato',
  'francesca@obessu.org': 'Francesca Osima',
  'rui@obessu.org': 'Rui Teixeira',
};

export function CalendarSync({ onEventsSynced }: CalendarSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      if (!res.ok) {
        throw new Error(`Failed to check status: ${res.statusText}`);
      }
      const data = await res.json();
      setIsConnected(data.connected);
    } catch (err) {
      console.error('Failed to check status:', err);
      setIsConnected(false);
    }
  };

  const handleSync = async () => {
    if (!isConnected) {
      setError("Please connect Google Drive/Calendar first.");
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      const res = await fetch('/api/calendar/events');
      if (!res.ok) {
        let errorMessage = 'Failed to fetch calendar events';
        try {
          const errorData = await res.json();
          if (errorData.error) errorMessage = errorData.error;
        } catch (e) {
          // Ignore JSON parse error if response is not JSON
        }
        throw new Error(errorMessage);
      }
      const data = await res.json();
      
      const newEvents: EventData[] = data.events.map((event: any) => {
        const contactName = CALENDAR_OWNER_MAP[event.sourceCalendar] ?? '';

        const startDateTime = event.start?.dateTime;
        const startDate = event.start?.date;

        let date = startDate || '';
        let time = '';

        if (startDateTime) {
          date = startDateTime.split('T')[0];
          time = new Date(startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        return {
          id: `cal-${event.id}`,
          createdAt: Date.now(),
          originalText: event.description || '',
          analysis: {
            sender: event.creator?.email || 'Unknown',
            institution: 'Google Calendar',
            eventName: event.summary || 'Untitled Event',
            theme: 'Synced Event',
            description: event.description || '',
            priority: Priority.Medium,
            priorityScore: 50,
            priorityReasoning: 'Imported from Google Calendar',
            date,
            time,
            venue: event.location || 'Unknown',
            initialDeadline: '',
            finalDeadline: '',
            linkedActivities: [],
          },
          contact: {
            name: contactName,
            email: event.sourceCalendar || '',
            role: '',
            organization: '',
            notes: '',
            polContact: '',
            repRole: 'Participant'
          },
          followUp: {
            briefing: '',
            postEventNotes: '',
            status: 'To Respond',
            prepResources: '',
            commsPack: {
              remarks: '',
              representative: '',
              datePlace: '',
              additionalInfo: ''
            }
          }
        };
      });

      onEventsSynced(newEvents);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isConnected) return (
    <button 
      disabled
      title="Connect Google Drive/Calendar first to enable sync"
      className="flex items-center gap-2 border border-slate-200 px-4 py-2 rounded-full text-sm font-medium text-slate-400 cursor-not-allowed"
    >
      <CalendarIcon size={16} /> Sync Calendars
    </button>
  );

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </span>
      )}
      <button 
        onClick={handleSync}
        disabled={isSyncing}
        className="flex items-center gap-2 bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
      >
        {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <CalendarIcon size={16} />}
        {isSyncing ? 'Syncing...' : 'Sync Calendars'}
      </button>
    </div>
  );
}
