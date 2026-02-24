import React, { useState, useEffect } from 'react';
import { HardDrive, Link as LinkIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function DriveIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(err.message);
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

  if (isLoading) {
    return (
      <button disabled className="flex items-center gap-2 bg-slate-100 text-slate-500 px-4 py-2 rounded-full text-sm font-medium">
        <Loader2 size={16} className="animate-spin" />
        Connecting...
      </button>
    );
  }

  if (isConnected) {
    return (
      <button 
        onClick={handleDisconnect}
        className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-100 transition-colors"
        title="Click to disconnect Google Drive"
      >
        <CheckCircle2 size={16} />
        Drive Connected
      </button>
    );
  }

  return (
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
  );
}
