import db, { applySchema } from './index.js';

function seed() {
  applySchema(db);

  db.exec('DELETE FROM tasks; DELETE FROM columns; DELETE FROM boards;');
  db.exec(
    "DELETE FROM sqlite_sequence WHERE name IN ('tasks', 'columns', 'boards');"
  );

  const insertBoard = db.prepare('INSERT INTO boards (name) VALUES (?)');
  const insertColumn = db.prepare(
    'INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)'
  );
  const insertTask = db.prepare(
    `INSERT INTO tasks (column_id, title, description, priority, position)
     VALUES (?, ?, ?, ?, ?)`
  );

  const seedAll = db.transaction(() => {
    const boardId = insertBoard.run('My First Board').lastInsertRowid;

    const columns = ['To Do', 'In Progress', 'Done'].map((name, i) =>
      insertColumn.run(boardId, name, i).lastInsertRowid
    );
    const [todo, inProgress, done] = columns;

    const tasks = [
      [todo, 'Set up the project repo', 'Init git, add README', 'High'],
      [todo, 'Design the database schema', 'Boards, columns, tasks', 'High'],
      [todo, 'Sketch the board UI', null, 'Low'],
      [inProgress, 'Build the task API', 'CRUD + move endpoints', 'Medium'],
      [inProgress, 'Wire up the React board', null, 'Medium'],
      [done, 'Read the assignment brief', 'Twice, carefully', 'Medium'],
    ];

    tasks.forEach(([columnId, title, description, priority], i) => {
      insertTask.run(columnId, title, description, priority, i);
    });
  });

  seedAll();
  console.log('Seeded database: 1 board, 3 columns, 6 tasks.');
}

seed();
db.close();
