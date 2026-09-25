'use client';

import { useEffect, useState } from 'react';
import { CheckSquare, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string;
  regulatory_citation?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority: 'critical' | 'high' | 'medium' | 'low';
  due_date?: string;
  is_ai_generated: boolean;
  created_at: string;
}

const columns: { key: Task['status']; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];

const priorityBorderColor: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-amber-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-gray-500',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ tasks: Task[] }>('/api/tasks?limit=100')
      .then(({ tasks: t }) => setTasks(t))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function moveTask(taskId: string, newStatus: Task['status']) {
    setUpdating(taskId);
    try {
      await api.put(`/api/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdating(null);
    }
  }

  const tasksByStatus = (status: Task['status']) => tasks.filter((t) => t.status === status);

  if (loading) return <div className="p-8"><div className="h-96 shimmer rounded-card" /></div>;

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-text-bright flex items-center gap-3">
          <CheckSquare className="w-8 h-8 text-primary-400" />
          Remediation Tasks
        </h1>
        <p className="text-brand-text-muted mt-1">{tasks.length} total tasks · Use gap analysis to generate AI-drafted tasks</p>
      </div>

      {tasks.length === 0 ? (
        <Card className="text-center py-16">
          <CheckSquare className="w-12 h-12 text-brand-border mx-auto mb-3" />
          <p className="text-brand-text-muted font-medium">No tasks yet</p>
          <p className="text-sm text-brand-muted mt-1">Generate tasks from gaps using the Gap Analysis Hub</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {columns.map(({ key, label }) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-brand-text-muted uppercase tracking-wide">{label}</h2>
                <span className="text-xs bg-brand-surface border border-brand-border text-brand-text-muted rounded-full px-2 py-0.5">
                  {tasksByStatus(key).length}
                </span>
              </div>
              <div className="space-y-3">
                {tasksByStatus(key).map((task) => (
                  <div
                    key={task.id}
                    className={`bg-brand-surface border border-brand-border rounded-card p-4 border-l-4 ${priorityBorderColor[task.priority]} hover:shadow-card-hover transition-all`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-brand-text-base leading-tight">{task.title}</p>
                      {task.is_ai_generated && <Wand2 className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-brand-text-muted line-clamp-2 mb-3">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant={task.priority as 'critical' | 'high' | 'medium'}>{task.priority}</Badge>
                      {task.due_date && (
                        <span className={`text-xs ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-400' : 'text-brand-text-muted'}`}>
                          {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                    {/* Move buttons */}
                    <div className="mt-3 pt-3 border-t border-brand-border flex gap-1 flex-wrap">
                      {columns
                        .filter((c) => c.key !== key)
                        .map((col) => (
                          <button
                            key={col.key}
                            onClick={() => moveTask(task.id, col.key)}
                            disabled={updating === task.id}
                            className="text-xs px-2 py-1 bg-brand-bg border border-brand-border rounded text-brand-text-muted hover:text-primary-400 hover:border-primary-500/40 transition-colors"
                          >
                            → {col.label}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
                {tasksByStatus(key).length === 0 && (
                  <div className="border-2 border-dashed border-brand-border rounded-card p-6 text-center">
                    <p className="text-xs text-brand-muted">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
