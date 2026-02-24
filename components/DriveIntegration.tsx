import React, { useState, useEffect } from 'react';
import { HardDrive, Link as LinkIcon, CheckCircle2, AlertCircle, Loader2, X, Copy } from 'lucide-react';

export function DriveIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);

  useEffect(() => {
    checkStatus();

    const handleMessage = async (event: MessageEvent) => {
      // Validate origin
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { code } = event.data;
        await exchangeToken(code);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setIsConnected(data.connected);
    } catch (err) {
      console.error('Failed to check status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const exchangeToken = async (code: string) => {
    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const res = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData.needsSetup) {
          setShowSetupModal(true);
          throw new Error('OAuth Setup Required');
        }
        throw new Error(errData.error || 'Failed to exchange token');
      }

      setIsConnected(true);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const res = await fetch(`/api/auth/url?redirectUri=${encodeURIComponent(redirectUri)}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData.needsSetup) {
          setShowSetupModal(true);
          throw new Error('OAuth Setup Required');
        }
        throw new Error(errData.error || 'Failed to get auth URL');
      }

      const { url } = await res.json();

      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        setError('Please allow popups for this site to connect your account.');
        setIsLoading(false);
      }
    } catch (err: any) {
      if (err.message !== 'OAuth Setup Required') {
        setError(err.message);
      }
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/disconnect', { method: 'POST' });
      setIsConnected(false);
    } catch (err) {
      console.error('Failed to disconnect:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '';

  return (
    <>
      {isLoading ? (
        <button disabled className="flex items-center gap-2 bg-slate-100 text-slate-500 px-4 py-2 rounded-full text-sm font-medium">
          <Loader2 size={16} className="animate-spin" />
          Connecting...
        </button>
      ) : isConnected ? (
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-100 transition-colors"
          title="Click to disconnect Google Drive"
        >
          <CheckCircle2 size={16} />
          Drive Connected
        </button>
      ) : (
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} /> {error}
            </span>
          )}
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <HardDrive size={16} />
            Connect Drive
          </button>
        </div>
      )}

      {showSetupModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <HardDrive className="text-blue-600" /> Google Drive OAuth Setup
              </h2>
              <button
                onClick={() => setShowSetupModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 text-slate-700">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100">
                <p className="font-medium">To connect Google Drive, you need to configure OAuth credentials in the Google Cloud Console.</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-lg text-slate-900">1. Create OAuth Credentials</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-2">
                  <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a>.</li>
                  <li>Create a new project or select an existing one.</li>
                  <li>Enable the <strong>Google Drive API</strong> for your project.</li>
                  <li>Go to <strong>Credentials</strong> &gt; <strong>Create Credentials</strong> &gt; <strong>OAuth client ID</strong>.</li>
                  <li>Select <strong>Web application</strong> as the application type.</li>
                </ol>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-lg text-slate-900">2. Configure Authorized Redirect URIs</h3>
                <p className="text-sm">Add the following URL to the <strong>Authorized redirect URIs</strong> section:</p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-3 rounded-lg">
                  <code className="text-sm flex-1 break-all text-blue-700">{redirectUri}</code>
                  <button
                    onClick={() => copyToClipboard(redirectUri)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors shrink-0"
                    title="Copy to clipboard"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-lg text-slate-900">3. Set Environment Variables</h3>
                <p className="text-sm">Add the generated credentials to your environment variables in AI Studio:</p>
                <ul className="list-disc list-inside space-y-2 text-sm ml-2">
                  <li><code>GOOGLE_CLIENT_ID</code></li>
                  <li><code>GOOGLE_CLIENT_SECRET</code></li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowSetupModal(false)}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
