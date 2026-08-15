import { describe, it, expect, beforeEach } from 'vitest';
import { makeTestDb } from './helpers.js';
import { countTasksPerColumn, getTasksByPriority } from '../src/db/queries.js';

describe('Database queries', () => {
  let db, boardId;

  beforeEach(() => {
    ({ db, boardId } = makeTestDb());
  });

  it('counts tasks per column, including empty columns', () => {
    const counts = countTasksPerColumn(db, boardId);

    expect(counts.map((c) => c.column_name)).toEqual(['To Do', 'In Progress', 'Done']);
    expect(counts.map((c) => c.task_count)).toEqual([2, 1, 0]);
  });

  it('returns tasks of a given priority, newest first', () => {
    const highTasks = getTasksByPriority(db, boardId, 'High');

    expect(highTasks).toHaveLength(2);
    expect(highTasks.map((t) => t.title)).toEqual(['New high task', 'Old high task']);
  });

  it('throws on an invalid priority value', () => {
    expect(() => getTasksByPriority(db, boardId, 'Urgent')).toThrow(/invalid priority/i);
  });
});
