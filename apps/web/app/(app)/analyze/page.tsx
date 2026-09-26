'use client';

import { useEffect, useState } from 'react';
import {
  Zap, AlertTriangle, CheckCircle, MinusCircle, XCircle,
  ArrowRight, WifiOff, KeyRound, PartyPopper,
} from 'lucide-react';
import { Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Toaster } from '@/components/ui/toast';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const SAMPLES: Record<string, string> = {
  'eu-ai-act': `Article 13 — Transparency and provision of information to users

1. Providers shall ensure that high-risk AI systems are designed and developed in such a way that their operation is sufficiently transparent to enable users to interpret the system's output and use it appropriately. An appropriate type and degree of transparency shall be ensured, with a view to achieving compliance with the relevant obligations of the provider and user set out in Chapter 3 of this Title.

2. High-risk AI systems shall be accompanied by instructions for use in an appropriate digital format or otherwise that include concise, complete, correct and clear information that is relevant, accessible and comprehensible to users.

3. The instructions for use shall contain at least the following information:
   (a) the identity and the contact details of the provider;
   (b) the characteristics, capabilities and limitations of performance of the high-risk AI system;
   (c) the changes to the high-risk AI system and its performance which have been pre-determined by the provider;
   (d) where appropriate, the data requirements, and in light of the nature and purpose of the high-risk AI system, the measures taken to ensure fitness for purpose of the data.`,

  'gdpr': `Article 5 — Principles relating to processing of personal data

1. Personal data shall be:
   (a) processed lawfully, fairly and in a transparent manner in relation to the data subject ('lawfulness, fairness and transparency');
   (b) collected for specified, explicit and legitimate purposes and not further processed in a manner that is incompatible with those purposes ('purpose limitation');
   (c) adequate, relevant and limited to what is necessary in relation to the purposes for which they are processed ('data minimisation');
   (d) accurate and, where necessary, kept up to date; every reasonable step must be taken to ensure that personal data that are inaccurate, having regard to the purposes for which they are processed, are erased or rectified without delay ('accuracy');
   (e) kept in a form which permits identification of data subjects for no longer than is necessary for the purposes for which the personal data are processed ('storage limitation');
   (f) processed in a manner that ensures appropriate security of the personal data, including protection against unauthorised or unlawful processing and against accidental loss, destruction or damage, using appropriate technical or organisational measures ('integrity and confidentiality').

2. The controller shall be responsible for, and be able to demonstrate compliance with, paragraph 1 ('accountability').`,

  'dora': `Article 11 — ICT Business Continuity Management

1. As part of the ICT risk management framework, financial entities shall implement and maintain a sound and comprehensive ICT business continuity policy, which may be adopted as a specific dedicated policy, forming an integral part of the overall business continuity policy of the financial entity.

2. Financial entities shall implement the ICT business continuity policy through dedicated, appropriate and documented arrangements, plans, procedures and mechanisms aiming to:
   (a) ensure the continuity of the financial entity's critical or important functions;
   (b) quickly, appropriately and effectively respond to, and resolve, all ICT-related incidents in a way that limits damage and prioritises the resumption of activities and recovery actions.

3. Financial entities shall conduct a business impact analysis (BIA) of their exposures to severe business disruptions. Financial entities shall assess their potential impact on the basis of quantitative and qualitative criteria, using internal and external data and scenario analysis, as appropriate.`,

  'soc2': `CC6.1 — Logical and Physical Access Controls

The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events to meet the entity's objectives.

Points of Focus:
- Identifies and Manages the Inventory of Information Assets: The entity identifies, inventories, classifies, and manages information assets.
- Restricts Logical Access: Logical access to information assets, including hardware, data, software, administrative authorities, mobile devices, output, and offline system components is restricted through the use of access control software and rule sets.
- Identifies and Authenticates Users: Persons, infrastructure and software are identified and authenticated prior to accessing information assets.
- Considers Network Segmentation: Network segmentation permits unrelated portions of the entity's information system to be isolated from each other.
- Manages Points of Access: Points of access by outside entities and the types of data that flow through the points of access are identified, inventoried, and managed.
- Restricts Access to Information Assets: Combinations of data classification, separate data structures, port restrictions, access protocol restrictions, user identification, and digital certificates are used to establish access-control rules for information assets.`,
};

interface AnalysisResult {
  analysis_id: string;
  regulation_summary: string;
  jurisdiction: string;
  impact_categories: string[];
  severity_score: number;
  overall_coverage_score: number;
  gap_count_critical: number;
  gap_count_high: number;
  gap_count_medium: number;
  obligations: Array<{
    obligation_text: string;
    coverage_status: 'covered' | 'partial' | 'missing';
    severity: 'critical' | 'high' | 'medium';
    gap_title: string;
    gap_description: string;
    recommended_action: string;
  }>;
}

type ErrorType = 'api-key' | 'network' | 'generic';

function CoverageIcon({ status }: { status: string }) {
  if (status === 'covered') return <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
  if (status === 'partial') return <MinusCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />;
  return <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary skeleton */}
      <div className="bg-brand-surface border border-brand-border rounded-card shadow-card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <div className="shimmer h-6 w-16 rounded-pill" />
              <div className="shimmer h-6 w-24 rounded-pill" />
            </div>
            <div className="shimmer h-4 w-full rounded" />
            <div className="shimmer h-4 w-3/4 rounded" />
          </div>
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="shimmer h-10 w-16 rounded" />
            <div className="shimmer h-3 w-14 rounded" />
          </div>
        </div>
        <div className="flex gap-4 pt-4 border-t border-brand-border">
          <div className="shimmer h-4 w-20 rounded" />
          <div className="shimmer h-4 w-16 rounded" />
          <div className="shimmer h-4 w-18 rounded" />
        </div>
      </div>

      {/* Impact categories skeleton */}
      <div className="flex gap-2">
        {[80, 96, 72].map((w) => (
          <div key={w} className={`shimmer h-6 rounded-pill`} style={{ width: `${w}px` }} />
        ))}
      </div>

      {/* Obligations header */}
      <div className="shimmer h-7 w-48 rounded" />

      {/* Obligation card skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-brand-surface border border-brand-border rounded-card shadow-card p-6 border-l-4 border-l-brand-border">
          <div className="flex items-start gap-3">
            <div className="shimmer w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="shimmer h-5 w-16 rounded-pill" />
                <div className="shimmer h-5 w-20 rounded-pill" />
                <div className="shimmer h-5 w-32 rounded" />
              </div>
              <div className="shimmer h-3 w-full rounded" />
              <div className="shimmer h-3 w-5/6 rounded" />
              <div className="shimmer h-16 w-full rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyzePage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<{ message: string; type: ErrorType } | null>(null);
  const { toasts, toast, remove } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sample = params.get('sample');
    if (sample && SAMPLES[sample]) setText(SAMPLES[sample]);
  }, []);

  async function handleAnalyze() {
    if (text.trim().length < 50) {
      toast({ type: 'error', title: 'Text too short', description: 'Provide at least 50 characters of regulatory text.' });
      return;
    }
    setAnalysisError(null);
    setLoading(true);
    setResult(null);
    try {
      const data = await api.post<AnalysisResult>('/api/gaps/analyze/paste', { text });
      setResult(data);
      const uncovered = data.obligations.filter((o) => o.coverage_status !== 'covered').length;
      if (uncovered === 0) {
        toast({ type: 'success', title: 'Fully covered', description: 'All obligations are addressed by your policy library.' });
      } else {
        toast({
          type: 'info',
          title: 'Analysis complete',
          description: `${uncovered} obligation${uncovered === 1 ? '' : 's'} need attention across ${data.jurisdiction}.`,
        });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const type: ErrorType = err.status === 503 ? 'api-key' : 'generic';
        setAnalysisError({ message: err.message, type });
      } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setAnalysisError({ message: 'No internet connection. Please check your network and try again.', type: 'network' });
      } else {
        setAnalysisError({ message: err instanceof Error ? err.message : 'Analysis failed', type: 'generic' });
      }
    } finally {
      setLoading(false);
    }
  }

  const allCovered = result?.obligations.every((o) => o.coverage_status === 'covered');
  const isEmpty = text.trim().length === 0;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-text-bright flex items-center gap-3">
          <Zap className="w-8 h-8 text-primary-400" />
          Quick Gap Analysis
        </h1>
        <p className="text-brand-text-muted mt-2">
          Paste any regulatory text — EU AI Act, GDPR, DORA, SOC 2 — and get a structured gap analysis in seconds.
        </p>
      </div>

      <Card className="mb-6">
        <Textarea
          label="Regulatory text"
          placeholder="Paste any EU AI Act article, GDPR provision, DORA requirement, or FCA guidance here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="font-mono text-xs"
        />

        {isEmpty && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries({ 'eu-ai-act': 'EU AI Act', gdpr: 'GDPR', dora: 'DORA', soc2: 'SOC 2' }).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setText(SAMPLES[key])}
                className="px-3 py-2 text-xs font-medium text-primary-400 bg-primary-500/10 border border-primary-500/20 rounded-lg hover:bg-primary-500/20 transition-colors"
              >
                Load {label} sample
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 gap-4">
          {!isEmpty && (
            <button
              onClick={() => setText('')}
              className="text-sm text-brand-text-muted hover:text-brand-text-base transition-colors"
            >
              Clear
            </button>
          )}
          <div className={`flex items-center gap-3 ${isEmpty ? 'w-full justify-end' : 'ml-auto'}`}>
            <span className={`text-sm ${text.length < 50 && text.length > 0 ? 'text-amber-400' : 'text-brand-text-muted'}`}>
              {text.length} / 50 min chars
            </span>
            <Button onClick={handleAnalyze} loading={loading} disabled={text.trim().length < 50}>
              <Zap className="w-4 h-4 mr-2" />
              {loading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Error states */}
      {analysisError && (
        <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 text-sm ${
          analysisError.type === 'api-key'
            ? 'bg-orange-900/20 border-orange-700 text-orange-300'
            : analysisError.type === 'network'
            ? 'bg-blue-900/20 border-blue-700 text-blue-300'
            : 'bg-red-900/20 border-red-800 text-red-400'
        }`}>
          {analysisError.type === 'api-key' && <KeyRound className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          {analysisError.type === 'network' && <WifiOff className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          {analysisError.type === 'generic' && <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <div>
            <p className="font-medium">{analysisError.type === 'api-key' ? 'API key not configured' : analysisError.type === 'network' ? 'Connection error' : 'Analysis failed'}</p>
            <p className="mt-0.5 opacity-80">{analysisError.message}</p>
            {analysisError.type === 'network' && (
              <button onClick={handleAnalyze} className="mt-2 underline underline-offset-2 hover:no-underline">
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading shimmer */}
      {loading && <LoadingSkeleton />}

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-slide-up">
          {/* All covered celebration */}
          {allCovered && (
            <div className="p-4 bg-emerald-900/20 border border-emerald-700 rounded-lg flex items-center gap-3">
              <PartyPopper className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">Fully covered</p>
                <p className="text-xs text-emerald-400/80 mt-0.5">Your policy library addresses all obligations in this regulation.</p>
              </div>
            </div>
          )}

          {/* Summary */}
          <Card>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="default">{result.jurisdiction}</Badge>
                  <span className="text-xs text-brand-text-muted">Severity {result.severity_score}/10</span>
                </div>
                <p className="text-brand-text-base leading-relaxed">{result.regulation_summary}</p>
              </div>
              <div className="text-center flex-shrink-0">
                <div className={`text-4xl font-bold ${result.overall_coverage_score >= 70 ? 'text-emerald-400' : result.overall_coverage_score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                  {Math.round(result.overall_coverage_score)}%
                </div>
                <p className="text-xs text-brand-text-muted mt-1">Coverage</p>
              </div>
            </div>
            <div className="flex gap-4 pt-4 border-t border-brand-border flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-sm text-brand-text-muted">{result.gap_count_critical} Critical</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-sm text-brand-text-muted">{result.gap_count_high} High</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-sm text-brand-text-muted">{result.gap_count_medium} Medium</span>
              </div>
            </div>
          </Card>

          {/* Impact categories */}
          <div className="flex flex-wrap gap-2">
            {result.impact_categories.map((cat) => (
              <span key={cat} className="px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-pill text-xs text-primary-400">{cat}</span>
            ))}
          </div>

          {/* Obligations */}
          <div>
            <h2 className="text-lg font-semibold text-brand-text-bright mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Obligations & Coverage
            </h2>
            <div className="space-y-4">
              {result.obligations.map((ob, i) => (
                <Card
                  key={i}
                  className={`border-l-4 ${ob.severity === 'critical' ? 'border-l-red-500' : ob.severity === 'high' ? 'border-l-amber-500' : 'border-l-yellow-500'}`}
                >
                  <div className="flex items-start gap-3">
                    <CoverageIcon status={ob.coverage_status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant={ob.severity}>{ob.severity}</Badge>
                        <Badge variant={ob.coverage_status}>{ob.coverage_status}</Badge>
                        <span className="text-sm font-medium text-brand-text-bright">{ob.gap_title}</span>
                      </div>
                      <p className="text-xs text-brand-text-muted italic mb-2 leading-relaxed">"{ob.obligation_text}"</p>
                      {ob.coverage_status !== 'covered' && (
                        <div className="mt-2 p-3 bg-brand-bg rounded-lg border border-brand-border">
                          <p className="text-xs text-brand-text-muted mb-1 font-medium">Recommended action:</p>
                          <p className="text-sm text-brand-text-base flex items-start gap-2">
                            <ArrowRight className="w-3.5 h-3.5 text-primary-400 mt-0.5 flex-shrink-0" />
                            {ob.recommended_action}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      <Toaster toasts={toasts} onRemove={remove} />
    </div>
  );
}
