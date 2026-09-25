'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Wand2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface GapDetail {
  id: string;
  gap_title: string;
  gap_description: string;
  severity: 'critical' | 'high' | 'medium';
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  coverage_status: 'covered' | 'partial' | 'missing';
  obligation_text?: string;
  recommended_action?: string;
  due_date?: string;
  created_at: string;
  regulation_title?: string;
  regulation_jurisdiction?: string;
  regulation_source_url?: string;
}

interface Task { id: string; title: string; status: string; priority: string; is_ai_generated: boolean; }
interface AuditEntry { id: string; action: string; created_at: string; before_state?: Record<string, string>; after_state?: Record<string, string>; }

export default function GapDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [gap, setGap] = useState<GapDetail | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    api.get<{ gap: GapDetail; tasks: Task[]; audit_trail: AuditEntry[] }>(`/api/gaps/${id}`)
      .then(({ gap: g, tasks: t, audit_trail: a }) => { setGap(g); setTasks(t); setAudit(a); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function generateTask() {
    if (!gap) return;
    setGenerating(true);
    try {
      await api.post('/api/tasks/generate', { gap_id: gap.id });
      setGenerated(true);
      // Reload gap data
      const { gap: g, tasks: t } = await api.get<{ gap: GapDetail; tasks: Task[]; audit_trail: AuditEntry[] }>(`/api/gaps/${id}`);
      setGap(g); setTasks(t);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate task');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <div className="p-8"><div className="h-96 shimmer rounded-card" /></div>;
  if (!gap) return <div className="p-8 text-brand-text-muted">Gap not found</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <Link href="/gaps" className="flex items-center gap-2 text-brand-text-muted hover:text-brand-text-base text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Gap Analysis Hub
      </Link>

      {/* Header */}
      <div className={`border-l-4 ${gap.severity === 'critical' ? 'border-l-red-500' : gap.severity === 'high' ? 'border-l-amber-500' : 'border-l-yellow-500'} pl-6 mb-6`}>
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <Badge variant={gap.severity}>{gap.severity}</Badge>
          <Badge variant={gap.coverage_status}>{gap.coverage_status}</Badge>
          <Badge variant={gap.status as 'open' | 'in_progress' | 'resolved'}>{gap.status.replace('_', ' ')}</Badge>
        </div>
        <h1 className="text-2xl font-bold text-brand-text-bright">{gap.gap_title}</h1>
        {gap.regulation_title && (
          <p className="text-brand-text-muted mt-1 text-sm">
            {gap.regulation_jurisdiction} · {gap.regulation_title}
            {gap.regulation_source_url && (
              <a href={gap.regulation_source_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary-400 inline-flex items-center gap-1 hover:underline">
                Source <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardTitle className="mb-3">Gap Description</CardTitle>
            <p className="text-brand-text-base leading-relaxed">{gap.gap_description}</p>
          </Card>

          {/* Obligation vs Control */}
          <Card>
            <CardTitle className="mb-4">Obligation Analysis</CardTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-brand-text-muted mb-2 uppercase tracking-wide">Regulatory Obligation</p>
                <div className="p-3 bg-red-900/10 border border-red-800/30 rounded-lg">
                  <p className="text-sm text-brand-text-base leading-relaxed">{gap.obligation_text || 'See gap description'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-brand-text-muted mb-2 uppercase tracking-wide">Existing Control</p>
                <div className={`p-3 rounded-lg border ${gap.coverage_status === 'missing' ? 'bg-red-900/10 border-red-800/30' : 'bg-amber-900/10 border-amber-800/30'}`}>
                  {gap.coverage_status === 'missing' ? (
                    <p className="text-sm text-red-400">No matching control found in policy library</p>
                  ) : (
                    <p className="text-sm text-amber-400">Partial coverage — control exists but has gaps</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Recommended Action */}
          {gap.recommended_action && (
            <Card>
              <CardTitle className="mb-3">Recommended Action</CardTitle>
              <p className="text-brand-text-base leading-relaxed">{gap.recommended_action}</p>
              <div className="mt-4 pt-4 border-t border-brand-border">
                {generated ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm">
                    <span>Task generated successfully</span>
                    <Link href="/tasks" className="underline">View in Remediation</Link>
                  </div>
                ) : (
                  <Button onClick={generateTask} loading={generating} size="sm">
                    <Wand2 className="w-4 h-4 mr-2" />
                    {generating ? 'Generating task...' : 'Generate Remediation Task'}
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Linked Tasks */}
          {tasks.length > 0 && (
            <Card>
              <CardTitle className="mb-3">Linked Remediation Tasks</CardTitle>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <Link key={task.id} href={`/tasks`}>
                    <div className="flex items-center justify-between p-3 bg-brand-bg rounded-lg border border-brand-border hover:border-primary-500/30 transition-colors">
                      <div className="flex items-center gap-2">
                        {task.is_ai_generated && <span className="text-xs text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded">AI</span>}
                        <span className="text-sm text-brand-text-base">{task.title}</span>
                      </div>
                      <Badge variant={task.status as 'open' | 'in_progress' | 'resolved'}>{task.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardTitle className="mb-3 text-sm">Details</CardTitle>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-brand-text-muted">Created</dt>
                <dd className="text-brand-text-base">{formatDate(gap.created_at)}</dd>
              </div>
              {gap.due_date && (
                <div>
                  <dt className="text-brand-text-muted">Due date</dt>
                  <dd className="text-brand-text-base">{formatDate(gap.due_date)}</dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Audit trail */}
          {audit.length > 0 && (
            <Card>
              <CardTitle className="mb-3 text-sm">Audit Trail</CardTitle>
              <div className="space-y-3">
                {audit.map((entry) => (
                  <div key={entry.id} className="flex gap-2 text-xs">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-brand-text-base capitalize">{entry.action.replace('_', ' ')}</p>
                      <p className="text-brand-text-muted">{formatDate(entry.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
