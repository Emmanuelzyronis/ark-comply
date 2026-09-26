'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export interface ToastItem {
  id: string;
  type?: 'success' | 'error' | 'info';
  title?: string;
  description?: string;
  duration?: number;
}

const ICONS = {
  success: <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
  error: <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />,
  info: <Info className="w-4 h-4 text-primary-400 flex-shrink-0" />,
};

export function Toaster({ toasts, onRemove }: {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}) {
  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          open
          onOpenChange={(open) => !open && onRemove(t.id)}
          duration={t.duration ?? 5000}
          className="flex items-start gap-3 p-4 rounded-lg border border-brand-border bg-brand-surface shadow-xl w-80 max-w-[calc(100vw-2rem)]"
        >
          <div className="mt-0.5">{ICONS[t.type ?? 'info']}</div>
          <div className="flex-1 min-w-0">
            {t.title && (
              <ToastPrimitive.Title className="text-sm font-semibold text-brand-text-bright">
                {t.title}
              </ToastPrimitive.Title>
            )}
            {t.description && (
              <ToastPrimitive.Description className="text-xs text-brand-text-muted mt-0.5">
                {t.description}
              </ToastPrimitive.Description>
            )}
          </div>
          <ToastPrimitive.Close className="flex-shrink-0 text-brand-text-muted hover:text-brand-text-base transition-colors mt-0.5">
            <X className="w-3.5 h-3.5" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 outline-none" />
    </ToastPrimitive.Provider>
  );
}
