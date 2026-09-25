import Link from 'next/link';
import { Shield, Zap, FileText, AlertTriangle, CheckSquare, Globe } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Gap Analysis in 10 Seconds',
    description: 'Paste any EU AI Act article or US Federal Register notice. Claude returns a structured gap analysis identifying covered, partial, and missing obligations instantly.',
  },
  {
    icon: FileText,
    title: 'Policy Library Intelligence',
    description: 'Upload your company policies as PDFs. Claude extracts control statements and semantically maps them against incoming regulations using pgvector.',
  },
  {
    icon: AlertTriangle,
    title: 'Risk Dashboard',
    description: 'All identified gaps with severity badges (Critical / High / Medium), regulation source, recommended remediation actions, and owner assignment.',
  },
  {
    icon: CheckSquare,
    title: 'One-Click Remediation Tasks',
    description: 'Claude drafts remediation actions with regulatory citations, assignee placeholders, and realistic due date suggestions — from any gap in one click.',
  },
  {
    icon: Globe,
    title: 'Multi-Jurisdiction Monitoring',
    description: 'Simultaneous monitoring of EU (EUR-Lex), US Federal Register, UK FCA, Nigeria CBN, and SEC regulatory feeds on an hourly schedule.',
  },
  {
    icon: Shield,
    title: 'Immutable Audit Trail',
    description: 'Every gap analysis and remediation task is stored as an append-only record in Neon Postgres with timestamp and user identity for board and audit presentations.',
  },
];

const jurisdictions = ['EU AI Act', 'US Federal Register', 'FCA (UK)', 'CBN (Nigeria)', 'SEC', 'EU GDPR'];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Navigation */}
      <nav className="border-b border-brand-border bg-brand-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-glow">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-brand-text-bright text-xl">ArkComply</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-brand-text-muted hover:text-brand-text-base transition-colors">
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors shadow-glow"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 border border-primary-500/30 rounded-pill text-primary-400 text-sm mb-8">
          <Zap className="w-3.5 h-3.5" />
          EU AI Act is fully operative — are you compliant?
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-brand-text-bright mb-6 leading-tight tracking-tight">
          AI-native regulatory<br />
          <span className="text-primary-400">compliance intelligence</span>
        </h1>
        <p className="text-xl text-brand-text-muted max-w-3xl mx-auto mb-10 leading-relaxed">
          Gap analysis in seconds, not weeks. ArkComply monitors 200+ global regulators, maps new rules to your policy library using Claude AI, and surfaces actionable compliance gaps before they become fines.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/register"
            className="px-8 py-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-all shadow-glow hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] text-lg"
          >
            Start Free — No Credit Card
          </Link>
          <Link
            href="/analyze"
            className="px-8 py-4 bg-brand-surface border border-brand-border text-brand-text-base font-semibold rounded-lg hover:border-primary-500/50 transition-colors text-lg"
          >
            Try Live Demo
          </Link>
        </div>
        <p className="mt-4 text-sm text-brand-text-muted">
          Hackathon winner at TechEx Amsterdam — AI & Big Data Expo Europe 2026
        </p>
      </section>

      {/* Jurisdiction badges */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="flex flex-wrap justify-center gap-3">
          {jurisdictions.map((j) => (
            <span key={j} className="px-3 py-1.5 bg-brand-surface border border-brand-border rounded-pill text-sm text-brand-text-muted">
              {j}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-brand-text-bright mb-4">
            Everything your compliance team needs
          </h2>
          <p className="text-brand-text-muted max-w-2xl mx-auto">
            Thomson Reuters charges $50K+/year. ArkComply gives AI-powered compliance intelligence to every startup and scale-up that actually needs it.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-brand-surface border border-brand-border rounded-card p-6 hover:border-primary-500/40 hover:shadow-card-hover transition-all duration-150"
            >
              <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-brand-text-bright mb-2">{feature.title}</h3>
              <p className="text-sm text-brand-text-muted leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-brand-text-bright mb-4">Gap analysis in 3 steps</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Upload your policies', desc: 'Drag and drop your existing compliance policies as PDFs. Claude extracts every control statement and indexes them semantically.' },
            { step: '2', title: 'Paste any regulation', desc: 'Copy any EU AI Act article, Federal Register notice, or FCA update into the analyze input. Results appear in under 10 seconds.' },
            { step: '3', title: 'Get structured gaps', desc: 'See every uncovered obligation ranked by severity with recommended remediation actions. One click generates a Claude-drafted task.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-12 h-12 bg-primary-500/20 border border-primary-500/40 rounded-full flex items-center justify-center text-primary-400 font-bold text-xl mx-auto mb-4 shadow-glow">
                {step}
              </div>
              <h3 className="text-lg font-semibold text-brand-text-bright mb-2">{title}</h3>
              <p className="text-sm text-brand-text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-primary-900/50 to-primary-800/30 border border-primary-500/30 rounded-2xl p-12 text-center shadow-glow">
          <h2 className="text-3xl font-bold text-brand-text-bright mb-4">
            The EU AI Act is enforced. Start your gap analysis today.
          </h2>
          <p className="text-brand-text-muted mb-8 max-w-2xl mx-auto">
            Every AI company deploying in the EU needs compliance tooling right now. Join hundreds of startups using ArkComply to stay ahead of regulatory changes.
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-8 py-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors shadow-glow text-lg"
          >
            Create Your Workspace — Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-border bg-brand-surface/50 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-400" />
            <span className="font-bold text-brand-text-bright">ArkComply</span>
            <span className="text-brand-text-muted text-sm">— RegTech Intelligence Platform</span>
          </div>
          <p className="text-sm text-brand-text-muted">
            Built for TechEx Amsterdam Hackathon 2026 · AI & Big Data Expo Europe
          </p>
        </div>
      </footer>
    </div>
  );
}
