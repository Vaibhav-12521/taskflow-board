import db from './db/index.js';
import { createApp } from './app.js';
import { getFirstBoard } from './db/queries.js';

const PORT = process.env.PORT || 4000;

if (!getFirstBoard(db)) {
  console.warn('No board found in the database. Run `npm run seed` to populate it.');
}

const app = createApp(db);
app.listen(PORT, () => {
  console.log(`TaskFlow API listening on http://localhost:${PORT}`);
});
