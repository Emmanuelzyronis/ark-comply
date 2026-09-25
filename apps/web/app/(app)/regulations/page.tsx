'use client';

import { useEffect, useState } from 'react';
import { Shield, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatRelative } from '@/lib/utils';

interface Regulation {
  id: string;
  title: string;
  jurisdiction: string;
  severity_score?: number;
  impact_categories: string[];
  ai_summary?: string;
  ingested_at: string;
  source_url?: string;
}

export default function RegulationsPage() {
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ regulations: Regulation[] }>('/api/regulations?limit=50')
      .then(({ regulations: r }) => setRegulations(r))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-text-bright flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary-400" />
          Regulation Feed
        </h1>
        <p className="text-brand-text-muted mt-1">{regulations.length} regulations ingested · Monitoring EU, US, UK, Nigeria</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 shimmer rounded-card" />)}</div>
      ) : regulations.length === 0 ? (
        <Card className="text-center py-16">
          <Shield className="w-12 h-12 text-brand-border mx-auto mb-3" />
          <p className="text-brand-text-muted font-medium">No regulations ingested yet</p>
          <p className="text-sm text-brand-muted mt-1">Use Quick Analysis to paste and analyze regulations, or configure feed ingestion</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {regulations.map((reg) => (
            <Card key={reg.id} hover className="py-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <span className="px-2 py-1 bg-brand-bg border border-brand-border rounded text-xs text-brand-text-muted">{reg.jurisdiction}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-text-base">{reg.title}</p>
                  {reg.ai_summary && <p className="text-xs text-brand-text-muted mt-1 line-clamp-2">{reg.ai_summary}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {reg.impact_categories?.slice(0, 3).map((cat) => (
                      <span key={cat} className="px-2 py-0.5 bg-primary-500/10 text-primary-400 text-xs rounded">{cat}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {reg.severity_score && (
                    <div className={`text-sm font-bold ${reg.severity_score >= 8 ? 'text-red-400' : reg.severity_score >= 5 ? 'text-amber-400' : 'text-yellow-400'}`}>
                      {reg.severity_score}/10
                    </div>
                  )}
                  <span className="text-xs text-brand-text-muted">{formatRelative(reg.ingested_at)}</span>
                  <a href={`/analyze`} className="p-1.5 bg-primary-500/10 rounded text-primary-400 hover:bg-primary-500/20 transition-colors" title="Analyze">
                    <Zap className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
