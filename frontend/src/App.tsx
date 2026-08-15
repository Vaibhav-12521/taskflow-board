import { useEffect, useMemo, useState } from 'react';
import { SquareKanban, Search, Sun, Moon, SearchX, LayoutGrid, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Column } from '@/components/Column';
import { TaskListView } from '@/components/TaskListView';
import { TaskModal } from '@/components/TaskModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ErrorBanner } from '@/components/ErrorBanner';
import { api } from '@/lib/api';
import type { Board, Priority, Task, TaskInput } from '@/lib/types';
import { cn } from '@/lib/utils';

const FILTERS: Array<'All' | Priority> = ['All', 'High', 'Medium', 'Low'];

type ModalState =
  | { mode: 'create'; columnId: number }
  | { mode: 'edit'; task: Task }
  | null;

function getInitialTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem('taskflow-theme');
  return saved === 'dark' ? 'dark' : 'light';
}

export default function App() {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [priorityFilter, setPriorityFilter] = useState<'All' | Priority>('All');
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [view, setView] = useState<'board' | 'list'>(
    () => (localStorage.getItem('taskflow-view') === 'list' ? 'list' : 'board')
  );
  const [modal, setModal] = useState<ModalState>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void loadBoard();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('taskflow-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('taskflow-view', view);
  }, [view]);

  async function loadBoard() {
    setLoading(true);
    try {
      setBoard(await api.getBoard());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(columnId: number, values: TaskInput) {
    const task = await api.createTask(columnId, values);
    setBoard((b) =>
      !b
        ? b
        : {
            ...b,
            columns: b.columns.map((c) =>
              c.id === columnId ? { ...c, tasks: [...c.tasks, task] } : c
            ),
          }
    );
  }

  async function handleEdit(taskId: number, values: TaskInput) {
    const updated = await api.updateTask(taskId, values);
    setBoard((b) =>
      !b
        ? b
        : {
            ...b,
            columns: b.columns.map((c) => ({
              ...c,
              tasks: c.tasks.map((t) => (t.id === taskId ? updated : t)),
            })),
          }
    );
  }

  function requestDelete(taskId: number) {
    const task = findTask(taskId);
    setPendingDelete({ id: taskId, title: task?.title ?? 'this task' });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const taskId = pendingDelete.id;
    setDeleting(true);
    try {
      await api.deleteTask(taskId);
      setBoard((b) =>
        !b
          ? b
          : {
              ...b,
              columns: b.columns.map((c) => ({
                ...c,
                tasks: c.tasks.filter((t) => t.id !== taskId),
              })),
            }
      );
      setPendingDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task.');
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handleMove(taskId: number, destColumnId: number) {
    const prev = board;
    setBoard((b) => moveTaskLocal(b, taskId, destColumnId));
    try {
      await api.moveTask(taskId, destColumnId);
      setError(null);
    } catch (err) {
      setBoard(prev);
      setError(err instanceof Error ? err.message : 'Failed to move task.');
    }
  }

  const filteredBoard = useMemo<Board | null>(() => {
    if (!board) return null;
    const term = search.trim().toLowerCase();
    return {
      ...board,
      columns: board.columns.map((col) => ({
        ...col,
        tasks: col.tasks.filter(
          (t) =>
            (priorityFilter === 'All' || t.priority === priorityFilter) &&
            (!term || t.title.toLowerCase().includes(term))
        ),
      })),
    };
  }, [board, priorityFilter, search]);

  const visibleCount = filteredBoard
    ? filteredBoard.columns.reduce((n, c) => n + c.tasks.length, 0)
    : 0;
  const hasResults = visibleCount > 0;

  function findTask(taskId: number): Task | undefined {
    return board?.columns.flatMap((c) => c.tasks).find((t) => t.id === taskId);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-5 md:px-8 md:py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-col-a to-primary text-white shadow-lg">
            <SquareKanban className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold leading-tight tracking-tight">TaskFlow</h1>
            <p className="text-[13px] text-muted-foreground">{board ? board.name : 'Loading…'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {board && (
            <span className="hidden rounded-full border bg-card px-3 py-1.5 text-[13px] font-semibold text-muted-foreground shadow-sm sm:inline">
              {visibleCount} {visibleCount === 1 ? 'task' : 'tasks'}
            </span>
          )}
          {board && board.columns.length > 0 && (
            <Button onClick={() => setModal({ mode: 'create', columnId: board.columns[0].id })}>
              <Plus /> New task
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label="Toggle theme"
            title="Toggle light / dark"
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>

      <div className="mt-5 mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border bg-muted/60 p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setPriorityFilter(f)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-muted-foreground transition',
                priorityFilter === f
                  ? 'bg-background text-foreground shadow-sm'
                  : 'hover:text-foreground'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border bg-card pl-9 pr-3 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="ml-auto inline-flex rounded-lg border bg-muted/60 p-1" role="group" aria-label="View">
          <button
            onClick={() => setView('board')}
            aria-label="Board view"
            title="Board view"
            aria-pressed={view === 'board'}
            className={cn(
              'grid size-8 place-items-center rounded-md text-muted-foreground transition',
              view === 'board' ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground'
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => setView('list')}
            aria-label="List view"
            title="List view"
            aria-pressed={view === 'list'}
            className={cn(
              'grid size-8 place-items-center rounded-md text-muted-foreground transition',
              view === 'list' ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground'
            )}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadBoard} onDismiss={() => setError(null)} />}

      {loading && <p className="py-16 text-center text-muted-foreground">Loading board…</p>}

      {!loading && filteredBoard && (
        <main className="flex flex-1 flex-col">
          {hasResults ? (
            view === 'board' ? (
              <div className="flex flex-1 items-stretch gap-4 overflow-x-auto pb-2 [scroll-snap-type:x_proximity] max-md:-mx-4 max-md:px-4">
                {filteredBoard.columns.map((column, i) => (
                  <Column
                    key={column.id}
                    column={column}
                    columns={board!.columns}
                    index={i}
                    onAddTask={() => setModal({ mode: 'create', columnId: column.id })}
                    onEditTask={(taskId) => {
                      const task = findTask(taskId);
                      if (task) setModal({ mode: 'edit', task });
                    }}
                    onDeleteTask={requestDelete}
                    onMoveTask={handleMove}
                  />
                ))}
              </div>
            ) : (
              <TaskListView
                columns={filteredBoard.columns}
                allColumns={board!.columns}
                onEditTask={(taskId) => {
                  const task = findTask(taskId);
                  if (task) setModal({ mode: 'edit', task });
                }}
                onDeleteTask={requestDelete}
                onMoveTask={handleMove}
              />
            )
          ) : (
            <Empty className="my-auto border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>No matching tasks</EmptyTitle>
                <EmptyDescription>
                  Nothing matches your current filter or search. Try clearing them.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                variant="outline"
                onClick={() => {
                  setPriorityFilter('All');
                  setSearch('');
                }}
              >
                Clear filters
              </Button>
            </Empty>
          )}
        </main>
      )}

      {modal && (
        <TaskModal
          mode={modal.mode}
          task={modal.mode === 'edit' ? modal.task : undefined}
          onClose={() => setModal(null)}
          onSubmit={async (values) => {
            if (modal.mode === 'create') await handleCreate(modal.columnId, values);
            else await handleEdit(modal.task.id, values);
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          destructive
          title="Delete task?"
          description={
            <>"{pendingDelete.title}" will be permanently removed. This can't be undone.</>
          }
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

function moveTaskLocal(board: Board | null, taskId: number, destColumnId: number): Board | null {
  if (!board) return board;
  let moved: Task | null = null;
  const stripped = board.columns.map((c) => {
    const found = c.tasks.find((t) => t.id === taskId);
    if (found) moved = found;
    return { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) };
  });
  if (!moved) return board;
  const movedTask: Task = { ...(moved as Task), column_id: destColumnId };
  return {
    ...board,
    columns: stripped.map((c) =>
      c.id === destColumnId ? { ...c, tasks: [...c.tasks, movedTask] } : c
    ),
  };
}
