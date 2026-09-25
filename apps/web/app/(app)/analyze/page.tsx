'use client';

import { useState } from 'react';
import { Zap, AlertTriangle, CheckCircle, MinusCircle, XCircle, ArrowRight } from 'lucide-react';
import { Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';

const EU_AI_ACT_SAMPLE = `Article 13 — Transparency and provision of information to users

1. Providers shall ensure that high-risk AI systems are designed and developed in such a way that their operation is sufficiently transparent to enable users to interpret the system's output and use it appropriately. An appropriate type and degree of transparency shall be ensured, with a view to achieving compliance with the relevant obligations of the provider and user set out in Chapter 3 of this Title.

2. High-risk AI systems shall be accompanied by instructions for use in an appropriate digital format or otherwise that include concise, complete, correct and clear information that is relevant, accessible and comprehensible to users.

3. The instructions for use shall contain at least the following information:
   (a) the identity and the contact details of the provider;
   (b) the characteristics, capabilities and limitations of performance of the high-risk AI system;
   (c) the changes to the high-risk AI system and its performance which have been pre-determined by the provider;
   (d) where appropriate, the data requirements, and in light of the nature and purpose of the high-risk AI system, the measures taken to ensure fitness for purpose of the data.`;

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

function CoverageIcon({ status }: { status: string }) {
  if (status === 'covered') return <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
  if (status === 'partial') return <MinusCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />;
  return <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />;
}

export default function AnalyzePage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  async function handleAnalyze() {
    if (text.trim().length < 50) { setError('Please provide at least 50 characters of regulatory text'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await api.post<AnalysisResult>('/api/gaps/analyze/paste', { text });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-text-bright flex items-center gap-3">
          <Zap className="w-8 h-8 text-primary-400" />
          Quick Gap Analysis
        </h1>
        <p className="text-brand-text-muted mt-2">
          Paste any regulatory text — EU AI Act, US Federal Register, FCA notice — and get a structured gap analysis in seconds.
        </p>
      </div>

      <Card className="mb-6">
        <Textarea
          label="Regulatory text"
          placeholder="Paste any EU AI Act article, Federal Register notice, FCA guidance, or other regulatory text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="font-mono text-xs"
        />
        <div className="flex items-center justify-between mt-4 gap-4">
          <button
            onClick={() => setText(EU_AI_ACT_SAMPLE)}
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            Load EU AI Act Article 13 sample
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-brand-text-muted">{text.length} chars</span>
            <Button onClick={handleAnalyze} loading={loading} disabled={text.trim().length < 50}>
              <Zap className="w-4 h-4 mr-2" />
              {loading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <Card className="text-center py-12">
          <div className="w-12 h-12 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-text-muted font-medium">Claude is analyzing the regulation...</p>
          <p className="text-sm text-brand-muted mt-1">Identifying obligations and mapping against your policy library</p>
        </Card>
      )}

      {result && (
        <div className="space-y-6 animate-slide-up">
          {/* Summary */}
          <Card>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
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
            <div className="flex gap-4 pt-4 border-t border-brand-border">
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
            <h2 className="text-lg font-semibold text-brand-text-bright mb-4">
              <AlertTriangle className="w-5 h-5 inline mr-2 text-amber-400" />
              Obligations & Coverage
            </h2>
            <div className="space-y-4">
              {result.obligations.map((ob, i) => (
                <Card key={i} className={`border-l-4 ${ob.severity === 'critical' ? 'border-l-red-500' : ob.severity === 'high' ? 'border-l-amber-500' : 'border-l-yellow-500'}`}>
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
    </div>
  );
}
