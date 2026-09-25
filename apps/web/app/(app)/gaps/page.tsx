'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatRelative } from '@/lib/utils';

interface Gap {
  id: string;
  gap_title: string;
  gap_description: string;
  severity: 'critical' | 'high' | 'medium';
  status: string;
  coverage_status: 'covered' | 'partial' | 'missing';
  recommended_action?: string;
  created_at: string;
  regulation_title?: string;
  regulation_jurisdiction?: string;
}

const severities = ['all', 'critical', 'high', 'medium'];
const statuses = ['all', 'open', 'in_progress', 'resolved', 'accepted_risk'];

export default function GapsPage() {
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('all');
  const [status, setStatus] = useState('open');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (severity !== 'all') params.set('severity', severity);
    if (status !== 'all') params.set('status', status);
    params.set('limit', '50');

    api.get<{ gaps: Gap[]; total: number }>(`/api/gaps?${params}`)
      .then(({ gaps: g, total: t }) => { setGaps(g); setTotal(t); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [severity, status]);

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-text-bright flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          Gap Analysis Hub
        </h1>
        <p className="text-brand-text-muted mt-1">{total} total gaps identified across all analyses</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-4 h-4 text-brand-text-muted" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-brand-text-muted">Severity:</span>
            <div className="flex gap-1">
              {severities.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`px-3 py-1 rounded-pill text-xs font-medium transition-colors capitalize ${
                    severity === s ? 'bg-primary-500 text-white' : 'bg-brand-bg text-brand-text-muted hover:text-brand-text-base border border-brand-border'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-brand-text-muted">Status:</span>
            <div className="flex gap-1 flex-wrap">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1 rounded-pill text-xs font-medium transition-colors ${
                    status === s ? 'bg-primary-500 text-white' : 'bg-brand-bg text-brand-text-muted hover:text-brand-text-base border border-brand-border'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 shimmer rounded-card" />)}
        </div>
      ) : gaps.length === 0 ? (
        <Card className="text-center py-16">
          <AlertTriangle className="w-12 h-12 text-brand-border mx-auto mb-3" />
          <p className="text-brand-text-muted font-medium">No gaps found</p>
          <p className="text-sm text-brand-muted mt-1">Try adjusting your filters or run a gap analysis</p>
          <Link href="/analyze" className="inline-block mt-4 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg text-sm hover:bg-primary-500/30 transition-colors">
            Run Analysis
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {gaps.map((gap) => (
            <Link key={gap.id} href={`/gaps/${gap.id}`}>
              <Card hover className="py-4">
                <div className="flex items-start gap-4">
                  <Badge variant={gap.severity}>{gap.severity}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-text-base">{gap.gap_title}</p>
                    <p className="text-xs text-brand-text-muted mt-0.5 line-clamp-2">{gap.gap_description}</p>
                    {gap.regulation_title && (
                      <p className="text-xs text-primary-400/70 mt-1">
                        {gap.regulation_jurisdiction} · {gap.regulation_title}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={gap.coverage_status}>{gap.coverage_status}</Badge>
                    <Badge variant={gap.status as 'open' | 'in_progress' | 'resolved'}>{gap.status.replace('_', ' ')}</Badge>
                  </div>
                  <span className="text-xs text-brand-text-muted whitespace-nowrap">{formatRelative(gap.created_at)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
