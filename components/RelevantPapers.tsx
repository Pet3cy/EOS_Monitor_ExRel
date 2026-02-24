import React, { useState, useEffect } from 'react';
import { FileText, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  iconLink: string;
  modifiedTime: string;
}

interface RelevantPapersProps {
  folderId: string;
  keywords: string[];
}

export function RelevantPapers({ folderId, keywords }: RelevantPapersProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkAuthAndFetchFiles();
  }, [folderId, keywords]);

  const checkAuthAndFetchFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statusRes = await fetch('/api/auth/status');
      const statusData = await statusRes.json();

      if (!statusData.connected) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      setIsConnected(true);

      const filesRes = await fetch(`/api/drive/files?folderId=${folderId}`);
      if (!filesRes.ok) {
        throw new Error('Failed to fetch files');
      }

      const filesData = await filesRes.json();
      let fetchedFiles = filesData.files || [];

      if (keywords && keywords.length > 0) {
        const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'about', 'as', 'by', 'of'];
        const lowerKeywords = keywords
          .map(k => k.toLowerCase())
          .filter(k => k.length > 2 && !stopWords.includes(k));

        if (lowerKeywords.length > 0) {
          fetchedFiles = fetchedFiles.filter((file: DriveFile) => {
            const lowerName = file.name.toLowerCase();
            return lowerKeywords.some(keyword => lowerName.includes(keyword));
          });
        }
      }

      setFiles(fetchedFiles);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm mt-4">
        <Loader2 size={14} className="animate-spin" />
        Loading relevant papers...
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="mt-4 p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-slate-400 flex items-start gap-2">
        <AlertCircle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
        <p>Connect your Google Drive in the header to view relevant papers for this portfolio.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-3 bg-red-900/20 border border-red-900/30 rounded-xl text-sm text-red-400 flex items-start gap-2">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <p>Error loading papers: {error}</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="mt-4 text-sm text-slate-500 italic">
        No relevant papers found in the linked folder.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Relevant Papers</span>
      <div className="space-y-2">
        {files.map(file => (
          <a
            key={file.id}
            href={file.webViewLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors group"
          >
            {file.iconLink ? (
              <img src={file.iconLink} alt="" className="w-5 h-5" />
            ) : (
              <FileText size={20} className="text-blue-400" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate group-hover:text-blue-400 transition-colors">
                {file.name}
              </p>
              <p className="text-[10px] text-slate-500">
                Modified: {new Date(file.modifiedTime).toLocaleDateString()}
              </p>
            </div>
            <ExternalLink size={14} className="text-slate-500 group-hover:text-blue-400" />
          </a>
        ))}
      </div>
    </div>
  );
}
