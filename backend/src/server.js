import db from './db/index.js';
import { createApp } from './app.js';
import { getFirstBoard } from './db/queries.js';
import { seedDatabase } from './db/seed.js';

const PORT = process.env.PORT || 4000;

if (!getFirstBoard(db)) {
  seedDatabase(db);
  console.log('Database was empty, seeded initial data.');
}

const app = createApp(db);
app.listen(PORT, () => {
  console.log(`TaskFlow API listening on port ${PORT}`);
});
