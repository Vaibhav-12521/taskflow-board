export type Priority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: number;
  column_id: number;
  title: string;
  description: string | null;
  priority: Priority;
  position: number;
  created_at: string;
}

export interface Column {
  id: number;
  board_id: number;
  name: string;
  position: number;
  tasks: Task[];
}

export interface Board {
  id: number;
  name: string;
  created_at: string;
  columns: Column[];
}

export interface TaskInput {
  title: string;
  description: string;
  priority: Priority;
}
