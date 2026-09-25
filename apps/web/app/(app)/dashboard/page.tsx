'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Shield, CheckSquare, Zap, TrendingUp, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { formatRelative } from '@/lib/utils';

interface Summary {
  open_critical: number;
  open_high: number;
  open_medium: number;
  regulations_last_7_days: number;
  overdue_tasks: number;
  coverage_score: number;
}

interface Gap {
  id: string;
  gap_title: string;
  severity: 'critical' | 'high' | 'medium';
  status: string;
  coverage_status: string;
  created_at: string;
  regulation_title?: string;
  regulation_jurisdiction?: string;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Summary>('/api/dashboard/summary'),
      api.get<{ gaps: Gap[] }>('/api/gaps?limit=5&status=open'),
    ]).then(([sum, gapsData]) => {
      setSummary(sum);
      setGaps(gapsData.gaps);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const kpiCards = summary ? [
    { label: 'Critical Gaps', value: summary.open_critical, icon: AlertTriangle, color: 'text-red-400', href: '/gaps?severity=critical' },
    { label: 'High Priority', value: summary.open_high, icon: Shield, color: 'text-amber-400', href: '/gaps?severity=high' },
    { label: 'Coverage Score', value: `${Math.round(summary.coverage_score)}%`, icon: TrendingUp, color: 'text-primary-400', href: '/timeline' },
    { label: 'New Regulations', value: summary.regulations_last_7_days, icon: Zap, color: 'text-emerald-400', href: '/regulations' },
    { label: 'Overdue Tasks', value: summary.overdue_tasks, icon: Clock, color: 'text-orange-400', href: '/tasks' },
    { label: 'Open Tasks', value: summary.open_medium, icon: CheckSquare, color: 'text-yellow-400', href: '/tasks' },
  ] : [];

  if (loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 shimmer rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-text-bright">Compliance Dashboard</h1>
        <p className="text-brand-text-muted mt-1">Your regulatory compliance posture at a glance</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {kpiCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card hover className="h-28 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-brand-text-muted">{card.label}</p>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className={`text-4xl font-bold ${card.color}`}>{card.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Analysis CTA */}
      <Card className="mb-8 bg-gradient-to-r from-primary-900/30 to-primary-800/10 border-primary-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-text-bright flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-400" />
              Run a Gap Analysis
            </h2>
            <p className="text-brand-text-muted text-sm mt-1">
              Paste any EU AI Act article or regulatory notice — results in under 10 seconds
            </p>
          </div>
          <Link
            href="/analyze"
            className="px-5 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors shadow-glow whitespace-nowrap"
          >
            Analyze Now
          </Link>
        </div>
      </Card>

      {/* Recent Gaps */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-text-bright">Open Gaps</h2>
          <Link href="/gaps" className="text-sm text-primary-400 hover:text-primary-300">
            View all
          </Link>
        </div>
        {gaps.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-brand-border mx-auto mb-3" />
            <p className="text-brand-text-muted font-medium">No open gaps found</p>
            <p className="text-sm text-brand-muted mt-1">Run a gap analysis to identify compliance obligations</p>
            <Link href="/analyze" className="inline-block mt-4 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg text-sm hover:bg-primary-500/30 transition-colors">
              Run Analysis
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {gaps.map((gap) => (
              <Link key={gap.id} href={`/gaps/${gap.id}`}>
                <div className="flex items-center gap-4 p-4 bg-brand-bg rounded-lg border border-brand-border hover:border-primary-500/30 transition-colors cursor-pointer">
                  <Badge variant={gap.severity}>{gap.severity}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text-base truncate">{gap.gap_title}</p>
                    {gap.regulation_title && (
                      <p className="text-xs text-brand-text-muted truncate">{gap.regulation_jurisdiction} · {gap.regulation_title}</p>
                    )}
                  </div>
                  <Badge variant={gap.coverage_status as 'covered' | 'partial' | 'missing'}>{gap.coverage_status}</Badge>
                  <span className="text-xs text-brand-text-muted whitespace-nowrap">{formatRelative(gap.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
