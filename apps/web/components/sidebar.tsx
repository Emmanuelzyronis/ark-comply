'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Shield, FileText, AlertTriangle,
  CheckSquare, BarChart2, Settings, LogOut, Zap, BarChart, X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analyze', label: 'Quick Analysis', icon: Zap },
  { href: '/gaps', label: 'Gap Analysis', icon: AlertTriangle },
  { href: '/policies', label: 'Policy Library', icon: FileText },
  { href: '/tasks', label: 'Remediation', icon: CheckSquare },
  { href: '/regulations', label: 'Regulations', icon: Shield },
  { href: '/timeline', label: 'Timeline', icon: BarChart2 },
  { href: '/reports', label: 'Reports', icon: BarChart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 w-64 bg-brand-surface border-r border-brand-border flex flex-col z-40',
          'transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="p-6 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-glow">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-brand-text-bright text-lg">ArkComply</span>
              <p className="text-xs text-brand-text-muted -mt-0.5">RegTech Intelligence</p>
            </div>
          </div>
          {/* Close button visible only on mobile */}
          <button
            className="lg:hidden p-1.5 rounded-lg text-brand-text-muted hover:text-brand-text-base hover:bg-white/5 transition-colors"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="App sections">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-brand-text-muted hover:text-brand-text-base hover:bg-white/5',
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-brand-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 text-sm font-bold" aria-hidden="true">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-text-base truncate">{user?.full_name || user?.email}</p>
              <p className="text-xs text-brand-text-muted capitalize">{user?.role || 'analyst'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-brand-text-muted hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
