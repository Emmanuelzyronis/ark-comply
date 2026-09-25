'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', full_name: '', workspace_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-glow mx-auto mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-brand-text-bright">Create your workspace</h1>
          <p className="text-brand-text-muted mt-1">Start your compliance intelligence setup</p>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-card p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full name" placeholder="Jane Smith" value={form.full_name} onChange={update('full_name')} />
            <Input label="Workspace name" placeholder="Acme Corp Compliance" value={form.workspace_name} onChange={update('workspace_name')} />
            <Input label="Work email" type="email" placeholder="jane@company.com" value={form.email} onChange={update('email')} required />
            <Input label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={update('password')} required />
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">{error}</div>
            )}
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Create workspace
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-brand-text-muted mt-6">
          Already have a workspace?{' '}
          <Link href="/auth/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
