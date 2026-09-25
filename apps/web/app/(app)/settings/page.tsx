'use client';

import { Settings, Globe, Users, Link } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-text-bright flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary-400" />
          Workspace Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-400" /> Profile
          </CardTitle>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-brand-text-muted">Email</dt>
              <dd className="text-brand-text-base mt-1">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-brand-text-muted">Role</dt>
              <dd className="text-brand-text-base mt-1 capitalize">{user?.role}</dd>
            </div>
            <div>
              <dt className="text-brand-text-muted">Workspace ID</dt>
              <dd className="text-brand-text-muted mt-1 font-mono text-xs">{user?.workspace_id}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardTitle className="mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary-400" /> Regulatory Feeds
          </CardTitle>
          <div className="space-y-2 text-sm">
            {['EUR-Lex (EU AI Act)', 'US Federal Register', 'FCA (UK)', 'CBN (Nigeria)', 'SEC'].map((feed) => (
              <div key={feed} className="flex items-center justify-between p-2 bg-brand-bg rounded border border-brand-border">
                <span className="text-brand-text-base">{feed}</span>
                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-400" /> Team
          </CardTitle>
          <p className="text-sm text-brand-text-muted">Team management coming soon. Invite analysts, reviewers, and approvers to collaborate on compliance tasks.</p>
        </Card>

        <Card>
          <CardTitle className="mb-4 flex items-center gap-2">
            <Link className="w-5 h-5 text-primary-400" /> Integrations
          </CardTitle>
          <p className="text-sm text-brand-text-muted">Slack webhook integration for critical gap alerts coming soon.</p>
        </Card>
      </div>
    </div>
  );
}
