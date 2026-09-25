'use client';

import { useEffect, useState, useRef } from 'react';
import { FileText, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Policy {
  id: string;
  filename: string;
  file_size_bytes: number;
  index_status: 'pending' | 'indexing' | 'indexed' | 'error';
  control_count: number;
  uploaded_at: string;
}

const statusIcon = {
  pending: <Clock className="w-4 h-4 text-brand-text-muted" />,
  indexing: <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />,
  indexed: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  error: <AlertCircle className="w-4 h-4 text-red-400" />,
};

const statusLabel = {
  pending: 'Pending',
  indexing: 'Indexing...',
  indexed: 'Indexed',
  error: 'Error',
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPolicies = async () => {
    const { policies: p } = await api.get<{ policies: Policy[] }>('/api/policies');
    setPolicies(p);
  };

  useEffect(() => {
    fetchPolicies().catch(console.error).finally(() => setLoading(false));
    // Poll for indexing status changes
    const interval = setInterval(() => {
      if (policies.some(p => p.index_status === 'indexing')) {
        fetchPolicies().catch(console.error);
      }
    }, 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadFile(file: File) {
    if (file.size > 25 * 1024 * 1024) { alert('File size must be under 25MB'); return; }
    if (!file.name.endsWith('.pdf')) { alert('Only PDF files are supported'); return; }
    if (policies.length >= 5) { alert('Maximum 5 policy documents allowed'); return; }

    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      await api.post('/api/policies/upload', form);
      await fetchPolicies();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-text-bright flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary-400" />
          Policy Library
        </h1>
        <p className="text-brand-text-muted mt-1">
          Upload your compliance policies — Claude extracts control statements for semantic gap matching.
          <span className="ml-2 text-sm text-primary-400">{policies.length}/5 policies uploaded</span>
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-card p-12 text-center mb-8 cursor-pointer transition-colors ${
          dragOver ? 'border-primary-500 bg-primary-500/10' : 'border-brand-border hover:border-primary-500/50 hover:bg-white/5'
        } ${policies.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
          disabled={policies.length >= 5}
        />
        {uploading ? (
          <>
            <div className="w-12 h-12 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-brand-text-muted">Uploading and extracting controls...</p>
          </>
        ) : (
          <>
            <Upload className="w-12 h-12 text-brand-border mx-auto mb-4" />
            <p className="text-brand-text-base font-medium mb-1">Drop a PDF here or click to upload</p>
            <p className="text-sm text-brand-text-muted">PDF only · Max 25MB · {5 - policies.length} slot{5 - policies.length !== 1 ? 's' : ''} remaining</p>
          </>
        )}
      </div>

      {/* Policy List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 shimmer rounded-card" />)}
        </div>
      ) : policies.length === 0 ? (
        <Card className="text-center py-16">
          <FileText className="w-12 h-12 text-brand-border mx-auto mb-3" />
          <p className="text-brand-text-muted font-medium">No policies uploaded yet</p>
          <p className="text-sm text-brand-muted mt-1">Upload your first policy PDF to start semantic gap matching</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policies.map((policy) => (
            <Card key={policy.id} hover>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-text-bright truncate">{policy.filename}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {statusIcon[policy.index_status]}
                    <span className={`text-xs ${policy.index_status === 'indexed' ? 'text-emerald-400' : policy.index_status === 'error' ? 'text-red-400' : 'text-brand-text-muted'}`}>
                      {statusLabel[policy.index_status]}
                    </span>
                    {policy.index_status === 'indexed' && (
                      <Badge variant="default">{policy.control_count} controls</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-brand-text-muted">
                    <span>{Math.round(policy.file_size_bytes / 1024)}KB</span>
                    <span>·</span>
                    <span>{formatDate(policy.uploaded_at)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
