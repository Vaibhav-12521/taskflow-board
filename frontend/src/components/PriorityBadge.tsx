import type { Priority } from '@/lib/types';
import { cn } from '@/lib/utils';

const styles: Record<Priority, string> = {
  High: 'bg-priority-high/12 text-priority-high',
  Medium: 'bg-priority-medium/15 text-priority-medium',
  Low: 'bg-priority-low/12 text-priority-low',
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        styles[priority],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {priority}
    </span>
  );
}
