import { useState, useCallback } from 'react';
import type { ToastItem } from '@/components/ui/toast';

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 10);
    setToasts((prev) => [...prev, { ...item, id }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, remove };
}
