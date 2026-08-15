const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

export function getBoard(db, boardId) {
  return db
    .prepare('SELECT id, name, created_at FROM boards WHERE id = ?')
    .get(boardId);
}

export function getFirstBoard(db) {
  return db
    .prepare('SELECT id, name, created_at FROM boards ORDER BY id LIMIT 1')
    .get();
}

export function getColumnsForBoard(db, boardId) {
  return db
    .prepare(
      `SELECT id, board_id, name, position
         FROM columns
        WHERE board_id = ?
        ORDER BY position`
    )
    .all(boardId);
}

export function getColumn(db, columnId) {
  return db
    .prepare('SELECT id, board_id, name, position FROM columns WHERE id = ?')
    .get(columnId);
}

export function getTask(db, taskId) {
  return db
    .prepare(
      `SELECT id, column_id, title, description, priority, position, created_at
         FROM tasks
        WHERE id = ?`
    )
    .get(taskId);
}

export function getTasksForBoard(db, boardId) {
  return db
    .prepare(
      `SELECT t.id, t.column_id, t.title, t.description, t.priority,
              t.position, t.created_at
         FROM tasks t
         JOIN columns c ON c.id = t.column_id
        WHERE c.board_id = ?
        ORDER BY t.column_id, t.position, t.id`
    )
    .all(boardId);
}

export function createTask(db, { columnId, title, description = null, priority = 'Medium' }) {
  const nextPosition = db
    .prepare('SELECT COALESCE(MAX(position) + 1, 0) AS pos FROM tasks WHERE column_id = ?')
    .get(columnId).pos;

  const info = db
    .prepare(
      `INSERT INTO tasks (column_id, title, description, priority, position)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(columnId, title, description, priority, nextPosition);

  return getTask(db, info.lastInsertRowid);
}

export function updateTask(db, taskId, fields) {
  const allowed = ['title', 'description', 'priority'];
  const sets = [];
  const values = [];

  for (const key of allowed) {
    if (key in fields) {
      sets.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }
  if (sets.length === 0) return getTask(db, taskId);

  values.push(taskId);
  db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getTask(db, taskId);
}

export function moveTask(db, taskId, destColumnId) {
  const nextPosition = db
    .prepare('SELECT COALESCE(MAX(position) + 1, 0) AS pos FROM tasks WHERE column_id = ?')
    .get(destColumnId).pos;

  db.prepare('UPDATE tasks SET column_id = ?, position = ? WHERE id = ?')
    .run(destColumnId, nextPosition, taskId);

  return getTask(db, taskId);
}

export function deleteTask(db, taskId) {
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  return info.changes > 0;
}

export function countTasksPerColumn(db, boardId) {
  return db
    .prepare(
      `SELECT c.id   AS column_id,
              c.name AS column_name,
              COUNT(t.id) AS task_count
         FROM columns c
         LEFT JOIN tasks t ON t.column_id = c.id
        WHERE c.board_id = ?
        GROUP BY c.id, c.name
        ORDER BY c.position`
    )
    .all(boardId);
}

export function getTasksByPriority(db, boardId, priority) {
  if (!VALID_PRIORITIES.includes(priority)) {
    throw new Error(`Invalid priority: ${priority}`);
  }
  return db
    .prepare(
      `SELECT t.id, t.column_id, t.title, t.description, t.priority, t.created_at
         FROM tasks t
         JOIN columns c ON c.id = t.column_id
        WHERE c.board_id = ?
          AND t.priority = ?
        ORDER BY t.created_at DESC, t.id DESC`
    )
    .all(boardId, priority);
}

export { VALID_PRIORITIES };
