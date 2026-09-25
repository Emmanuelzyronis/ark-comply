import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'critical' | 'high' | 'medium' | 'covered' | 'partial' | 'missing' | 'default' | 'open' | 'in_progress' | 'resolved';
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<string, string> = {
  critical: 'badge-critical',
  high: 'badge-high',
  medium: 'badge-medium',
  covered: 'chip-covered',
  partial: 'chip-partial',
  missing: 'chip-missing',
  open: 'bg-blue-900/40 text-blue-400 border border-blue-700/40',
  in_progress: 'bg-amber-900/40 text-amber-400 border border-amber-700/40',
  resolved: 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40',
  default: 'bg-brand-surface text-brand-text-muted border border-brand-border',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-medium',
      variantClasses[variant] || variantClasses.default,
      className,
    )}>
      {children}
    </span>
  );
}
