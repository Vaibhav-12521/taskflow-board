# TaskFlow

A lightweight Trello-style task board for small teams. A board has columns
("To Do", "In Progress", "Done"); each column holds tasks you can create, edit,
move between columns, delete, and filter by priority. Everything persists to a
real SQLite database via an Express API.

- **Frontend:** React + **TypeScript** + Vite, styled with **Tailwind CSS v4** and
  **shadcn/ui** components - responsive, with a light/dark theme
- **Backend:** Node.js + Express (JavaScript)
- **Database:** SQLite via `better-sqlite3`, with **hand-written SQL** (no ORM)
- **Tests:** Vitest + Supertest

---

## Quick start (from a fresh clone)

Requires **Node.js 18+** and npm.

```bash
# 1. Install dependencies for both backend and frontend
npm run install:all

# 2. Create and seed the database (1 board, 3 columns, 6 sample tasks)
npm run seed

# 3. Start the backend (:4000) and frontend (:5173) together
npm run dev
```

Then open **http://localhost:5173**.

The Vite dev server proxies `/api/*` to the backend on port 4000, so there's
nothing else to configure.

> Prefer to run them separately? Use two terminals:
> ```bash
> cd backend  && npm install && npm run seed && npm run dev   # API on :4000
> cd frontend && npm install && npm run dev                    # UI  on :5173
> ```

### Run the tests

```bash
npm test          # from the repo root (runs the backend test suite)
# or: cd backend && npm test
```

---

## Project structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql     # CREATE TABLE statements (the source of truth)
│   │   │   ├── index.js       # opens SQLite, enables foreign keys, applies schema
│   │   │   ├── queries.js     # ALL SQL lives here (hand-written)
│   │   │   └── seed.js        # wipes + repopulates sample data
│   │   ├── routes/
│   │   │   ├── board.js       # GET board, stats, tasks-by-priority
│   │   │   └── tasks.js       # create / edit / move / delete a task
│   │   ├── app.js             # builds the Express app around a db connection
│   │   └── server.js          # starts the server
│   └── tests/                 # api + query tests
└── frontend/
    ├── components.json        # shadcn/ui config
    └── src/
        ├── index.css          # Tailwind v4 + shadcn theme tokens (light/dark)
        ├── lib/
        │   ├── api.ts         # typed fetch wrapper
        │   ├── types.ts       # Board / Column / Task types
        │   └── utils.ts       # cn() class-name helper
        ├── components/
        │   ├── ui/            # shadcn: button, card, empty, empty-state-01
        │   ├── Column.tsx
        │   ├── TaskCard.tsx
        │   ├── TaskModal.tsx
        │   └── ErrorBanner.tsx
        └── App.tsx            # board state, filtering, mutations
```

---

## Data model

A task's **status is the column it lives in** - represented by `tasks.column_id`,
rather than a separate free-text status field that could drift out of sync with
the board. The full schema is in
[`backend/src/db/schema.sql`](backend/src/db/schema.sql):

```sql
CREATE TABLE boards (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE columns (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id INTEGER NOT NULL,
  name     TEXT    NOT NULL,
  position INTEGER NOT NULL,
  FOREIGN KEY (board_id) REFERENCES boards (id) ON DELETE CASCADE
);

CREATE TABLE tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  column_id   INTEGER NOT NULL,
  title       TEXT    NOT NULL,
  description TEXT,
  priority    TEXT    NOT NULL DEFAULT 'Medium'
              CHECK (priority IN ('Low', 'Medium', 'High')),
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (column_id) REFERENCES columns (id) ON DELETE CASCADE
);
```

Constraints worth calling out:

- **Primary key** on every table.
- **Foreign keys** `tasks.column_id → columns.id` and `columns.board_id → boards.id`,
  both `ON DELETE CASCADE` (deleting a board cleans up its columns and tasks).
  Foreign keys are enabled per-connection with `PRAGMA foreign_keys = ON`.
- **NOT NULL** on required fields (`title`, `name`, `priority`, `created_at`).
- **CHECK** constraint restricting `priority` to `Low` / `Medium` / `High`.
- Indexes on the columns we filter/join on (`board_id`, `column_id`, `priority`).

---

## The two required non-trivial queries

Both are in [`backend/src/db/queries.js`](backend/src/db/queries.js) and are run
by the database, not by filtering everything in JavaScript after fetching it.

**1. Count of tasks per column on a board** - a `LEFT JOIN` so that a column with
zero tasks still appears (a plain `GROUP BY` over `tasks` would drop it). Exposed
at `GET /api/boards/:id/stats`.

```sql
SELECT c.id   AS column_id,
       c.name AS column_name,
       COUNT(t.id) AS task_count
  FROM columns c
  LEFT JOIN tasks t ON t.column_id = c.id
 WHERE c.board_id = ?
 GROUP BY c.id, c.name
 ORDER BY c.position;
```

**2. Tasks with a given priority, newest first.** Exposed at
`GET /api/boards/:id/tasks?priority=High`.

```sql
SELECT t.id, t.column_id, t.title, t.description, t.priority, t.created_at
  FROM tasks t
  JOIN columns c ON c.id = t.column_id
 WHERE c.board_id = ?
   AND t.priority = ?
 ORDER BY t.created_at DESC, t.id DESC;
```

---

## API

| Method | Endpoint                              | Purpose                                  |
| ------ | ------------------------------------- | ---------------------------------------- |
| GET    | `/api/board`                          | Default board with columns + tasks nested |
| GET    | `/api/boards/:id`                     | A specific board (same shape)            |
| GET    | `/api/boards/:id/stats`               | Task count per column (query #1)         |
| GET    | `/api/boards/:id/tasks?priority=High` | Tasks by priority, newest first (query #2) |
| POST   | `/api/columns/:columnId/tasks`        | Create a task (`title` required)         |
| PATCH  | `/api/tasks/:id`                      | Edit title / description / priority      |
| PATCH  | `/api/tasks/:id/move`                 | Move a task to another column            |
| DELETE | `/api/tasks/:id`                      | Delete a task                            |

---

## Tests

`cd backend && npm test` runs the suite that covers the three required cases:

1. **Creating a task with no title fails** - `POST` with a blank title returns
   `400` (`tests/api.test.js`). Validated on the backend independent of the form.
2. **Moving a task updates its column** - after a move, both the response and a
   direct DB read show the new `column_id` (`tests/api.test.js`).
3. **A direct database-layer test** - `countTasksPerColumn` and
   `getTasksByPriority` run against a known in-memory seed and return the right
   rows in the right order (`tests/queries.test.js`).

Tests run against a fresh **in-memory** SQLite database (`:memory:`) built from
the same `schema.sql`, so they never touch your real `taskflow.db`.

---

## Notes for the reviewer

### Decisions & assumptions

- **Raw SQL over an ORM.** Since the database was called out for close review, I
  used `better-sqlite3` and wrote the SQL by hand so the schema and queries are
  plain and readable. `better-sqlite3` is synchronous, which keeps the data layer
  and tests simple, and it ships prebuilt binaries so `npm install` doesn't need a
  compiler.
- **Status = column.** I modelled a task's status as its `column_id` rather than a
  separate string column, so status and board position can never disagree.
- **Both move methods.** The brief said a working dropdown beats broken
  drag-and-drop, so each card has a reliable **"Move to" dropdown** *and*
  native HTML5 **drag-and-drop** between columns. No drag library - one less
  dependency to break on a fresh clone.
- **Filtering.** Priority (and an optional title search) filter the already-loaded
  board on the client for instant feedback. The two DB-backed query endpoints
  above exist and are tested independently, per the database requirement.
- **Single board.** No auth/multi-user (explicitly out of scope), so the app opens
  the first board. The schema already supports multiple boards.
- **Error handling.** Failed requests surface a dismissible banner with a Retry
  button instead of a blank screen or a console error; the create/edit form shows
  inline validation messages.
- **UI/UX.** The frontend is TypeScript + Tailwind v4 + **shadcn/ui**. Columns are
  built from the shadcn `Card`, and empty columns / no-results use the shadcn
  `Empty` component (in `components/ui`). The board fills the full width (columns
  stretch to share the row) and runs full height like a real kanban, with long
  columns scrolling internally. It's fully responsive - on phones the columns
  become swipeable (scroll-snap) and the task dialog becomes a bottom sheet. There's
  a **Board (kanban) and a List view** (toggled from the toolbar, remembered across
  reloads), a light/dark theme (defaults to light, remembers your choice), a
  segmented priority filter, and priority chips. Icons are from `lucide-react`.

### What I'd add with more time

- Reorder tasks *within* a column via drag (the `position` column already exists
  to support it).
- Optimistic UI everywhere with a proper toast system.
- A small frontend test with React Testing Library.
- Board/column CRUD from the UI (the backend model already allows it).

### Time spent

Roughly **4-5 hours**, most of it on the schema, the query layer, and testing.

### One thing I found interesting

SQLite has foreign-key enforcement **off by default** and it's a *per-connection*
`PRAGMA foreign_keys = ON` - not a property of the database file. So a schema can
declare foreign keys that are silently ignored unless every connection opts in. I
made sure the app enables it on connect (`db/index.js`), which is also why the
`ON DELETE CASCADE` on boards/columns actually does anything.

---

## Deploying

The repo includes a `render.yaml` blueprint that deploys the backend to
[Render](https://render.com) as a Node web service. On first boot the server
seeds itself if the database is empty, so the live API is never blank.

**Backend (Render):**

1. Push this repo to GitHub and connect it on Render (New > Blueprint), or create
   a Web Service manually with Root Directory `backend`, build `npm install`,
   start `npm start`.
2. Render sets `PORT` automatically; the server reads it.
3. On the free plan the SQLite file lives on an ephemeral disk (fine for a demo -
   it re-seeds on cold start). For durable storage, attach a Render Disk and set
   `DATABASE_PATH` to a path on it (e.g. `/data/taskflow.db`).

**Frontend (Vercel / Netlify):** build `npm run build` in `frontend`, and set the
`VITE_API_BASE` env var to the deployed backend URL so the app calls it directly.
