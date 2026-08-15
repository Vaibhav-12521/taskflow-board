import { useState } from 'react';
import { Plus, Inbox } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { TaskCard } from './TaskCard';
import type { Column as ColumnType } from '@/lib/types';
import { cn } from '@/lib/utils';

const accentDot = ['bg-col-a', 'bg-col-b', 'bg-col-c'];

interface Props {
  column: ColumnType;
  columns: ColumnType[];
  index: number;
  onAddTask: () => void;
  onEditTask: (taskId: number) => void;
  onDeleteTask: (taskId: number) => void;
  onMoveTask: (taskId: number, columnId: number) => void;
}

export function Column({
  column,
  columns,
  index,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onMoveTask,
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const accent = index % 3;

  return (
    <Card
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const taskId = Number(e.dataTransfer.getData('text/task-id'));
        const fromColumn = Number(e.dataTransfer.getData('text/from-column'));
        if (taskId && fromColumn !== column.id) onMoveTask(taskId, column.id);
      }}
      className={cn(
        'flex h-full min-w-[300px] max-w-[520px] flex-1 flex-col gap-0 bg-muted/40 p-3 transition',
        dragOver && 'ring-2 ring-ring/60 bg-accent'
      )}
    >
      <div className="flex items-center gap-2 px-1 pb-3">
        <span className={cn('size-2.5 rounded-full', accentDot[accent])} />
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
          {column.name}
        </h2>
        <span className="ml-auto grid h-5 min-w-6 place-items-center rounded-full border bg-background px-2 text-xs font-bold text-muted-foreground">
          {column.tasks.length}
        </span>
      </div>

      <div className="thin-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-0.5 pb-1">
        {column.tasks.length > 0 ? (
          column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columns={columns}
              onEdit={() => onEditTask(task.id)}
              onDelete={() => onDeleteTask(task.id)}
              onMove={onMoveTask}
            />
          ))
        ) : (
          <Empty className="border py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox />
              </EmptyMedia>
              <EmptyTitle>No tasks</EmptyTitle>
              <EmptyDescription>Add a task to this column to get going.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      <Button
        variant="ghost"
        onClick={onAddTask}
        className="mt-2 w-full justify-center border border-dashed text-muted-foreground hover:text-foreground"
      >
        <Plus /> Add task
      </Button>
    </Card>
  );
}
