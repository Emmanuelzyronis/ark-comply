'use client';

import { useEffect, useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Snapshot {
  id: string;
  snapshot_date: string;
  open_critical: number;
  open_high: number;
  open_medium: number;
  coverage_score: number;
  regulations_monitored: number;
}

export default function TimelinePage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ snapshots: Snapshot[] }>('/api/dashboard/timeline')
      .then(({ snapshots: s }) => setSnapshots(s))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-text-bright flex items-center gap-3">
          <BarChart2 className="w-8 h-8 text-primary-400" />
          Compliance Timeline
        </h1>
        <p className="text-brand-text-muted mt-1">Track your compliance posture over time</p>
      </div>

      {loading ? (
        <div className="h-96 shimmer rounded-card" />
      ) : snapshots.length === 0 ? (
        <Card className="text-center py-16">
          <BarChart2 className="w-12 h-12 text-brand-border mx-auto mb-3" />
          <p className="text-brand-text-muted font-medium">No timeline data yet</p>
          <p className="text-sm text-brand-muted mt-1">Compliance snapshots are captured weekly after gap analyses</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Simple bar visualization */}
          <Card>
            <h2 className="text-lg font-semibold text-brand-text-bright mb-4">Coverage Score Over Time</h2>
            <div className="space-y-3">
              {snapshots.map((snap) => (
                <div key={snap.id} className="flex items-center gap-4">
                  <span className="text-xs text-brand-text-muted w-20 flex-shrink-0">{formatDate(snap.snapshot_date)}</span>
                  <div className="flex-1 bg-brand-bg rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${snap.coverage_score >= 70 ? 'bg-emerald-500' : snap.coverage_score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${snap.coverage_score}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold w-12 text-right ${snap.coverage_score >= 70 ? 'text-emerald-400' : snap.coverage_score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                    {Math.round(snap.coverage_score)}%
                  </span>
                  <div className="flex gap-2 text-xs w-32">
                    <span className="text-red-400">{snap.open_critical}C</span>
                    <span className="text-amber-400">{snap.open_high}H</span>
                    <span className="text-yellow-400">{snap.open_medium}M</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
