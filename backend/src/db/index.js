import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'taskflow.db');

export function openDb(filename = DB_PATH) {
  const db = new Database(filename);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  return db;
}

export function applySchema(db) {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
}

const db = openDb();
applySchema(db);

export default db;
