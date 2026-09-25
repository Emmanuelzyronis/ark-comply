'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Shield } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/hooks/use-auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-brand-bg">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Mobile top bar — hidden on desktop */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-brand-border bg-brand-surface sticky top-0 z-20 flex-shrink-0">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-2 rounded-lg text-brand-text-muted hover:text-brand-text-base hover:bg-white/5 transition-colors"
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
            aria-controls="main-navigation"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-400" aria-hidden="true" />
            <span className="font-bold text-brand-text-bright">ArkComply</span>
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
