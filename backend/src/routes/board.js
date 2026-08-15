import { Router } from 'express';
import {
  getBoard,
  getFirstBoard,
  getColumnsForBoard,
  getTasksForBoard,
  countTasksPerColumn,
  getTasksByPriority,
} from '../db/queries.js';

const router = Router();

router.get('/board', (req, res) => {
  const db = req.app.locals.db;
  const board = getFirstBoard(db);
  if (!board) return res.status(404).json({ error: 'No board found. Run the seed script.' });

  res.json(buildBoardPayload(db, board));
});

router.get('/boards/:id', (req, res) => {
  const db = req.app.locals.db;
  const board = getBoard(db, req.params.id);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  res.json(buildBoardPayload(db, board));
});

router.get('/boards/:id/stats', (req, res) => {
  const db = req.app.locals.db;
  const board = getBoard(db, req.params.id);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  res.json({ counts: countTasksPerColumn(db, board.id) });
});

router.get('/boards/:id/tasks', (req, res) => {
  const db = req.app.locals.db;
  const { priority } = req.query;
  if (!priority) return res.status(400).json({ error: 'priority query param is required' });

  const board = getBoard(db, req.params.id);
  if (!board) return res.status(404).json({ error: 'Board not found' });

  try {
    res.json({ tasks: getTasksByPriority(db, board.id, priority) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

function buildBoardPayload(db, board) {
  const columns = getColumnsForBoard(db, board.id);
  const tasks = getTasksForBoard(db, board.id);

  const byColumn = new Map(columns.map((c) => [c.id, { ...c, tasks: [] }]));
  for (const task of tasks) {
    byColumn.get(task.column_id)?.tasks.push(task);
  }

  return { ...board, columns: [...byColumn.values()] };
}

export default router;
