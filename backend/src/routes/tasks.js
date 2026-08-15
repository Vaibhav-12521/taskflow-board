import { Router } from 'express';
import {
  getColumn,
  getTask,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  VALID_PRIORITIES,
} from '../db/queries.js';

const router = Router();

router.post('/columns/:columnId/tasks', (req, res) => {
  const db = req.app.locals.db;
  const columnId = Number(req.params.columnId);

  const column = getColumn(db, columnId);
  if (!column) return res.status(404).json({ error: 'Column not found' });

  const { title, description, priority } = req.body ?? {};

  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  if (!cleanTitle) return res.status(400).json({ error: 'Title is required' });

  const cleanPriority = priority ?? 'Medium';
  if (!VALID_PRIORITIES.includes(cleanPriority)) {
    return res.status(400).json({ error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  const cleanDescription =
    typeof description === 'string' && description.trim() ? description.trim() : null;

  const task = createTask(db, {
    columnId,
    title: cleanTitle,
    description: cleanDescription,
    priority: cleanPriority,
  });
  res.status(201).json(task);
});

router.patch('/tasks/:id', (req, res) => {
  const db = req.app.locals.db;
  const task = getTask(db, req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const fields = {};
  const { title, description, priority } = req.body ?? {};

  if (title !== undefined) {
    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    if (!cleanTitle) return res.status(400).json({ error: 'Title cannot be empty' });
    fields.title = cleanTitle;
  }
  if (description !== undefined) {
    fields.description =
      typeof description === 'string' && description.trim() ? description.trim() : null;
  }
  if (priority !== undefined) {
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }
    fields.priority = priority;
  }

  res.json(updateTask(db, task.id, fields));
});

router.patch('/tasks/:id/move', (req, res) => {
  const db = req.app.locals.db;
  const task = getTask(db, req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const columnId = Number(req.body?.columnId);
  if (!columnId) return res.status(400).json({ error: 'columnId is required' });

  const column = getColumn(db, columnId);
  if (!column) return res.status(404).json({ error: 'Destination column not found' });

  res.json(moveTask(db, task.id, columnId));
});

router.delete('/tasks/:id', (req, res) => {
  const db = req.app.locals.db;
  const removed = deleteTask(db, req.params.id);
  if (!removed) return res.status(404).json({ error: 'Task not found' });
  res.status(204).end();
});

export default router;
