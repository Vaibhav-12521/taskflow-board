import { openDb, applySchema } from '../src/db/index.js';

export function makeTestDb() {
  const db = openDb(':memory:');
  applySchema(db);

  const boardId = db.prepare('INSERT INTO boards (name) VALUES (?)').run('Test Board')
    .lastInsertRowid;

  const insertColumn = db.prepare(
    'INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)'
  );
  const todo = insertColumn.run(boardId, 'To Do', 0).lastInsertRowid;
  const inProgress = insertColumn.run(boardId, 'In Progress', 1).lastInsertRowid;
  const done = insertColumn.run(boardId, 'Done', 2).lastInsertRowid;

  const insertTask = db.prepare(
    `INSERT INTO tasks (column_id, title, description, priority, position, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  insertTask.run(todo, 'Old high task', null, 'High', 0, '2026-01-01 09:00:00');
  insertTask.run(todo, 'New high task', null, 'High', 1, '2026-08-01 09:00:00');
  insertTask.run(inProgress, 'A medium task', null, 'Medium', 0, '2026-05-01 09:00:00');

  return { db, boardId, columns: { todo, inProgress, done } };
}
