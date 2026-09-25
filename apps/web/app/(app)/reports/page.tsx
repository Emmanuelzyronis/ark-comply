'use client';

import { FileText, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-text-bright flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary-400" />
          Compliance Reports
        </h1>
        <p className="text-brand-text-muted mt-1">Generate and export gap analysis reports for board and audit presentations</p>
      </div>

      <Card className="text-center py-16">
        <Download className="w-12 h-12 text-brand-border mx-auto mb-3" />
        <p className="text-brand-text-muted font-medium">Report generation coming soon</p>
        <p className="text-sm text-brand-muted mt-1 max-w-sm mx-auto">
          PDF export with gap analysis summary, severity breakdown, and remediation status will be available in the next release.
        </p>
        <Button variant="secondary" className="mt-6" disabled>
          Generate PDF Report
        </Button>
      </Card>
    </div>
  );
}
