import { Pencil, Trash2, Calendar } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';
import { formatDate } from '@/lib/format';
import type { Column } from '@/lib/types';

interface Props {
  columns: Column[];
  allColumns: Column[];
  onEditTask: (taskId: number) => void;
  onDeleteTask: (taskId: number) => void;
  onMoveTask: (taskId: number, columnId: number) => void;
}

export function TaskListView({ columns, allColumns, onEditTask, onDeleteTask, onMoveTask }: Props) {
  const rows = columns.flatMap((col) =>
    col.tasks.map((task) => ({ task, columnName: col.name }))
  );

  return (
    <div className="flex flex-col gap-2">
      {rows.map(({ task, columnName }) => (
        <div
          key={task.id}
          className="flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center"
        >
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <PriorityBadge priority={task.priority} className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold">{task.title}</h3>
              {task.description && (
                <p className="truncate text-[13px] text-muted-foreground">{task.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="size-3" />
              {formatDate(task.created_at)}
            </span>

            <select
              value={task.column_id}
              onChange={(e) => {
                const dest = Number(e.target.value);
                if (dest !== task.column_id) onMoveTask(task.id, dest);
              }}
              aria-label={`Move ${task.title} to another column`}
              title={`Status: ${columnName}`}
              className="h-8 rounded-md border bg-background px-2 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {allColumns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => onEditTask(task.id)}
              aria-label="Edit task"
              title="Edit task"
              className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Pencil className="size-4" />
            </button>
            <button
              onClick={() => onDeleteTask(task.id)}
              aria-label="Delete task"
              title="Delete task"
              className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
