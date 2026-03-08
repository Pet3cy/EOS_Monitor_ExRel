import React, { useState } from 'react';
import { analyzeInvitation } from '../services/gemmaService';
import { EventData } from '../types';
import { EventCard } from './EventCard';
import { Loader2, Trash2, Wand2, Mail } from 'lucide-react';

interface EmailParserViewProps {
  onEventsExtracted: (events: EventData[]) => void;
}

export const EmailParserView: React.FC<EmailParserViewProps> = ({ onEventsExtracted }) => {
  const [emailContent, setEmailContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedEvents, setExtractedEvents] = useState<EventData[]>([]);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!emailContent.trim()) {
      setError('Please paste some email content first.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // We use the existing analyzeInvitation which returns a single event.
      // If the email contains multiple events, the prompt might need to be updated to return an array,
      // but for now we'll just use the existing service and wrap it in an array.
      const result = await analyzeInvitation({ text: emailContent });
      
      const newEvent: EventData = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        originalText: emailContent,
        analysis: result,
        contact: { name: '', email: '', role: '', organization: '', notes: '', polContact: '', repRole: 'Participant' },
        followUp: { 
          briefing: '', postEventNotes: '', status: 'To Respond', prepResources: '',
          commsPack: { remarks: '', representative: '', datePlace: `${result.date} @ ${result.venue}`, additionalInfo: '' }
        }
      };

      setExtractedEvents(prev => [newEvent, ...prev]);
      onEventsExtracted([newEvent]);
    } catch (err: any) {
      setError(err.message || 'Failed to extract events. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setEmailContent('');
    setExtractedEvents([]);
    setError('');
  };

  return (
    <div className="flex flex-col h-full p-6 gap-6 bg-slate-50/50 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Mail className="text-blue-600" /> Email Parser
          </h2>
          <p className="text-slate-500 text-sm mt-1">Paste email threads to automatically extract event details.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Trash2 size={16} /> Clear All
          </button>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !emailContent.trim()}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md shadow-blue-200"
          >
            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            Extract Events
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Input Section */}
        <div className="flex flex-col gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Email Content</label>
          <textarea
            className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono leading-relaxed resize-none focus:ring-2 focus:ring-blue-500/20 outline-none"
            placeholder="Paste email content here..."
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
          />
          {error && <div className="text-red-500 text-sm font-medium p-2 bg-red-50 rounded-lg border border-red-100">{error}</div>}
        </div>

        {/* Output Section */}
        <div className="flex flex-col gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Extracted Events ({extractedEvents.length})</label>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {extractedEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                <Wand2 size={32} className="mb-3 opacity-20" />
                <p className="text-sm font-medium">No events extracted yet.</p>
                <p className="text-xs mt-1">Paste an email and click Extract Events.</p>
              </div>
            ) : (
              extractedEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  isSelected={false}
                  onClick={() => {}}
                  onDelete={() => {
                    setExtractedEvents(prev => prev.filter(e => e.id !== event.id));
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
