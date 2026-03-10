import React from 'react';
import { Layout, Calendar, Brain, Shield, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans text-slate-900">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-12 md:p-16 flex flex-col items-center text-center">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-200 mb-8">
            <Layout className="text-white w-12 h-12" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
            Welcome to EventFlow AI
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-12 leading-relaxed">
            The strategic triage and event management platform for OBESSU. 
            Automatically process invitations, score strategic value, and route events to the right team members.
          </p>

          <div className="grid md:grid-cols-3 gap-8 w-full mb-12 text-left">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors">
              <Brain className="text-blue-600 w-8 h-8 mb-4" />
              <h3 className="text-lg font-bold mb-2">AI-Powered Triage</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Upload PDFs or paste emails. Our AI instantly extracts metadata, assigns priority scores, and drafts executive briefings.
              </p>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors">
              <Calendar className="text-blue-600 w-8 h-8 mb-4" />
              <h3 className="text-lg font-bold mb-2">Seamless Sync</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Connect your Google Calendar to automatically sync approved events and keep your team's schedule up-to-date.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors">
              <Shield className="text-blue-600 w-8 h-8 mb-4" />
              <h3 className="text-lg font-bold mb-2">Secure & Private</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Your data is processed securely. Calendar access is strictly limited to syncing your managed events.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <button 
              onClick={onGetStarted}
              className="w-full bg-blue-600 text-white text-lg font-bold py-4 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group"
            >
              Enter Workspace
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-xs text-slate-400 text-center mt-4">
              By continuing, you agree to the OBESSU internal data processing guidelines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
