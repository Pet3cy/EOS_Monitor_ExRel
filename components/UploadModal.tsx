
import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Loader2, FileText, Mail, Clipboard, CheckCircle2, AlertCircle, Mic, Square } from 'lucide-react';
import mammoth from 'mammoth';
import { analyzeInvitation, AnalysisInput, transcribeAudio } from '../services/gemmaService';
import { EventData, Priority } from '../types';
import { useToast } from '../contexts/ToastContext';

interface UploadModalProps {
  onClose: () => void;
  onAnalysisComplete: (event: EventData) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose, onAnalysisComplete }) => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const { showError, showToast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }
    
    setSelectedFile(file);
    setError('');
  };

  const convertFileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsAnalyzing(true);
        try {
          const base64Audio = await convertFileToBase64(audioBlob);
          const transcription = await transcribeAudio(base64Audio, 'audio/webm');
          setText((prev) => prev + (prev ? '\n\n' : '') + transcription);
          showToast('Audio transcribed successfully', 'success');
        } catch (err: any) {
          setError(err.message || 'Failed to transcribe audio');
          showError(err.message || 'Failed to transcribe audio');
        } finally {
          setIsAnalyzing(false);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Microphone access denied or not available.');
      showError('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAnalyze = async () => {
    if (!eventTitle.trim()) { setError("Event Title is required."); return; }
    if (mode === 'text' && !text.trim()) { setError("Paste the invitation content first."); return; }
    if (mode === 'file' && !selectedFile) { setError("Select a document first."); return; }

    setIsAnalyzing(true);
    setProgress(0);
    setError('');

    // Simulate progress
    const interval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.floor(Math.random() * 15);
        });
    }, 600);

    try {
      let input: AnalysisInput = {};
      if (mode === 'file' && selectedFile) {
        if (selectedFile.name.endsWith('.docx')) {
          const result = await mammoth.extractRawText({ arrayBuffer: await selectedFile.arrayBuffer() });
          input.text = result.value;
        } else if (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/')) {
          input.fileData = { mimeType: selectedFile.type, data: await convertFileToBase64(selectedFile) };
        } else if (selectedFile.name.endsWith('.eml') || selectedFile.name.endsWith('.txt')) {
          input.text = await selectedFile.text();
        } else {
          setError("Unsupported file format. Please use PDF, DOCX, EML, TXT, or Image.");
          setIsAnalyzing(false); 
          clearInterval(interval);
          return;
        }
      } else {
        input.text = text;
      }

      const result = await analyzeInvitation(input);
      
      if (eventTitle.trim()) result.eventName = eventTitle.trim();
      if (eventDate) result.date = eventDate;
      if (eventTime) result.time = eventTime;

      // Analysis complete, finish progress bar
      clearInterval(interval);
      setProgress(100);

      // Brief delay to show 100%
      await new Promise(resolve => setTimeout(resolve, 500));

      const newEvent: EventData = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        originalText: text || `File: ${selectedFile?.name}`,
        analysis: result,
        contact: { name: '', email: '', role: '', organization: '', notes: '', polContact: '', repRole: 'Participant' },
        followUp: { 
          briefing: '', postEventNotes: '', status: 'To Respond', prepResources: '',
          commsPack: { remarks: '', representative: '', datePlace: `${result.date} @ ${result.venue}`, additionalInfo: '' }
        }
      };
      onAnalysisComplete(newEvent);
      showToast('Event analyzed successfully', 'success');
      onClose();
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "Analysis failed. Ensure the text contains clear event details.");
      showError(err.message || "Analysis failed. Ensure the text contains clear event details.");
      setProgress(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-200 relative">
        
        {/* Progress Overlay */}
        {isAnalyzing && (
            <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-8 fade-in duration-300">
                <div className="w-16 h-16 mb-6 relative">
                    <Loader2 className="w-16 h-16 animate-spin text-blue-200" />
                    <Loader2 className="w-16 h-16 animate-spin text-blue-600 absolute top-0 left-0" style={{ strokeDasharray: 100, strokeDashoffset: 100 - progress }} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Analyzing...</h3>
                <p className="text-slate-500 mb-8 text-center max-w-xs mx-auto">Extracting metadata, assigning strategic priority, and identifying key stakeholders...</p>
                
                <div className="w-full max-w-md bg-slate-100 rounded-full h-4 overflow-hidden mb-2">
                    <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2" 
                        style={{ width: `${progress}%` }}
                    >
                    </div>
                </div>
                <div className="flex justify-between w-full max-w-md text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>Uploading</span>
                    <span>Processing</span>
                    <span>Complete</span>
                </div>
            </div>
        )}

        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Process Invitation</h2>
            <p className="text-sm text-slate-500">Powered by Gemini 3.1 Pro • Optimized for Email Parsing</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"><X size={20} /></button>
        </div>

        <div className="px-6 pt-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Event Title <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required 
              value={eventTitle} 
              onChange={e => setEventTitle(e.target.value)} 
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
              placeholder="Enter event title" 
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">Event Date</label>
              <input 
                type="date" 
                value={eventDate} 
                onChange={e => setEventDate(e.target.value)} 
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700" 
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">Event Time</label>
              <input 
                type="time" 
                value={eventTime} 
                onChange={e => setEventTime(e.target.value)} 
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700" 
              />
            </div>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 mx-6 mt-6 mb-4 rounded-xl">
           <button onClick={() => setMode('text')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'text' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
             <Clipboard size={16}/> Paste Content
           </button>
           <button onClick={() => setMode('file')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'file' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
             <FileText size={16}/> Upload Document
           </button>
        </div>

        <div className="px-6 pb-6 flex-1 overflow-y-auto">
          {mode === 'text' ? (
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-mono leading-relaxed resize-none"
                  placeholder="Paste the full email including headers (Subject, From, Date) if possible..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`absolute bottom-4 right-4 p-3 rounded-full shadow-md transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}`}
                  title={isRecording ? "Stop Recording" : "Dictate with Voice"}
                >
                  {isRecording ? <Square size={20} /> : <Mic size={20} />}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                <Mail size={12}/> Pro-tip: Include the email 'Subject' for better categorization.
              </div>
            </div>
          ) : (
            <div className="h-64 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50/30 group hover:border-blue-400 transition-all relative">
              <input type="file" accept="image/*,.pdf,.docx,.eml,.txt" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                <Upload className="text-blue-600" size={32} />
              </div>
              <p className="text-sm font-bold text-slate-700">{selectedFile ? selectedFile.name : 'Drop Image, PDF, DOCX, EML, or TXT invitation'}</p>
              <p className="text-xs text-slate-400 mt-1">Maximum file size: 10MB</p>
            </div>
          )}
          {error && <p className="text-red-500 text-sm font-medium mt-4 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2"><AlertCircle size={16}/> {error}</p>}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-all">Cancel</button>
          <button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center gap-2"
          >
            Analyze with AI
          </button>
        </div>
      </div>
    </div>
  );
};


