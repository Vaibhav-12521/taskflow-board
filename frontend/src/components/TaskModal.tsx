import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Priority, Task, TaskInput } from '@/lib/types';
import { cn } from '@/lib/utils';

const PRIORITIES: Priority[] = ['Low', 'Medium', 'High'];

const activePriority: Record<Priority, string> = {
  High: 'border-priority-high bg-priority-high/10 text-priority-high',
  Medium: 'border-priority-medium bg-priority-medium/15 text-priority-medium',
  Low: 'border-priority-low bg-priority-low/10 text-priority-low',
};

interface Props {
  mode: 'create' | 'edit';
  task?: Task;
  onClose: () => void;
  onSubmit: (values: TaskInput) => Promise<void>;
}

export function TaskModal({ mode, task, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'Medium');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), priority });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setSaving(false);
    }
  }

  const fieldClass =
    'w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl border bg-card p-6 shadow-xl sm:rounded-2xl"
      >
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          {mode === 'create' ? 'New task' : 'Edit task'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-muted-foreground">
            Title
            <input
              autoFocus
              className={fieldClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-muted-foreground">
            Description
            <textarea
              rows={3}
              className={cn(fieldClass, 'resize-y')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details"
            />
          </label>

          <div className="flex flex-col gap-1.5 text-[13px] font-medium text-muted-foreground">
            Priority
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Priority">
              {PRIORITIES.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    'rounded-md border bg-background py-2 text-sm font-semibold text-muted-foreground transition',
                    priority === p ? activePriority[p] : 'hover:bg-accent'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-[13px] font-medium text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              {error}
            </p>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : mode === 'create' ? 'Create task' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
