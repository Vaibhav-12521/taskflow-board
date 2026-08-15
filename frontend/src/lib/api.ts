import type { Board, Task, TaskInput } from './types';

const BASE = import.meta.env.VITE_API_BASE ?? '';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Could not reach the server. Is the backend running?');
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}) as unknown);
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  getBoard: () => request<Board>('/api/board'),
  createTask: (columnId: number, body: TaskInput) =>
    request<Task>(`/api/columns/${columnId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateTask: (taskId: number, body: Partial<TaskInput>) =>
    request<Task>(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  moveTask: (taskId: number, columnId: number) =>
    request<Task>(`/api/tasks/${taskId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ columnId }),
    }),
  deleteTask: (taskId: number) => request<void>(`/api/tasks/${taskId}`, { method: 'DELETE' }),
};
