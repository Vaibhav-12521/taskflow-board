import { useState } from 'react';
import { Pencil, Trash2, Calendar } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';
import { formatDate } from '@/lib/format';
import type { Column, Task } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  task: Task;
  columns: Column[];
  onEdit: () => void;
  onDelete: () => void;
  onMove: (taskId: number, columnId: number) => void;
}

export function TaskCard({ task, columns, onEdit, onDelete, onMove }: Props) {
  const [dragging, setDragging] = useState(false);

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/task-id', String(task.id));
        e.dataTransfer.setData('text/from-column', String(task.column_id));
        e.dataTransfer.effectAllowed = 'move';
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={cn(
        'group cursor-grab rounded-lg border bg-card p-3 shadow-sm transition',
        'hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing',
        dragging && 'opacity-60 shadow-lg'
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />

        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100">
          <button
            onClick={onEdit}
            aria-label="Edit task"
            title="Edit task"
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete task"
            title="Delete task"
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <h3 className="text-sm font-semibold leading-snug break-words">{task.title}</h3>
      {task.description && (
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground break-words whitespace-pre-wrap">
          {task.description}
        </p>
      )}

      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Calendar className="size-3" />
        {formatDate(task.created_at)}
      </div>

      <label className="mt-2.5 flex items-center gap-2 border-t pt-2.5 text-[11px] text-muted-foreground">
        Move
        <select
          value={task.column_id}
          onChange={(e) => {
            const dest = Number(e.target.value);
            if (dest !== task.column_id) onMove(task.id, dest);
          }}
          aria-label="Move task to column"
          className="h-7 flex-1 rounded-md border bg-background px-2 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}
