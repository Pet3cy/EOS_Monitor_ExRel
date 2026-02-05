
import React, { useState, useEffect } from 'react';
import { Upload, X, Loader2, FileText, File, Mail, Clipboard, CheckCircle2 } from 'lucide-react';
import mammoth from 'mammoth';
import { analyzeInvitation, AnalysisInput } from '../services/geminiService';
import { EventData, Priority } from '../types';

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setError('');
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
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
          input = { text: result.value };
        } else if (selectedFile.type === 'application/pdf') {
          input = { fileData: { mimeType: 'application/pdf', data: await convertFileToBase64(selectedFile) } };
        } else {
          setError("Unsupported file format. Please use PDF or DOCX.");
          setIsAnalyzing(false); 
          clearInterval(interval);
          return;
        }
      } else {
        input = { text };
      }

      const result = await analyzeInvitation(input);
      
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
      onClose();
    } catch (err) {
      clearInterval(interval);
      setError("Analysis failed. Ensure the text contains clear event details.");
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
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Analyzing Invitation</h3>
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
            <p className="text-sm text-slate-500">AI-powered extraction for IT & Secretariat</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"><X size={20} /></button>
        </div>

        <div className="flex bg-slate-100 p-1 m-6 rounded-xl">
           <button onClick={() => setMode('text')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'text' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
             <Clipboard size={16}/> Paste Email Content
           </button>
           <button onClick={() => setMode('file')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'file' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
             <FileText size={16}/> Upload Document
           </button>
        </div>

        <div className="px-6 pb-6 flex-1 overflow-y-auto">
          {mode === 'text' ? (
            <div className="space-y-4">
              <textarea
                className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-mono leading-relaxed resize-none"
                placeholder="Paste the full email including headers (Subject, From, Date) if possible..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                <Mail size={12}/> Pro-tip: Include the email 'Subject' for better categorization.
              </div>
            </div>
          ) : (
            <div className="h-64 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50/30 group hover:border-blue-400 transition-all relative">
              <input type="file" accept=".pdf,.docx" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                <Upload className="text-blue-600" size={32} />
              </div>
              <p className="text-sm font-bold text-slate-700">{selectedFile ? selectedFile.name : 'Drop PDF or DOCX invitation'}</p>
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

const AlertCircle = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
