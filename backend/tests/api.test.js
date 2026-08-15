import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { makeTestDb } from './helpers.js';
import { getTask } from '../src/db/queries.js';

describe('Task API', () => {
  let app, db, columns;

  beforeEach(() => {
    ({ db, columns } = makeTestDb());
    app = createApp(db);
  });

  it('rejects creating a task with an empty title', async () => {
    const res = await request(app)
      .post(`/api/columns/${columns.todo}/tasks`)
      .send({ title: '   ', priority: 'High' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  it('creates a task with a valid title', async () => {
    const res = await request(app)
      .post(`/api/columns/${columns.todo}/tasks`)
      .send({ title: 'Write the README', priority: 'Medium' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Write the README',
      priority: 'Medium',
      column_id: columns.todo,
    });
  });

  it('moving a task updates its column', async () => {
    const created = await request(app)
      .post(`/api/columns/${columns.todo}/tasks`)
      .send({ title: 'Move me' });
    const taskId = created.body.id;

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/move`)
      .send({ columnId: columns.done });

    expect(res.status).toBe(200);
    expect(res.body.column_id).toBe(columns.done);

    expect(getTask(db, taskId).column_id).toBe(columns.done);
  });

  it('returns 404 when moving a non-existent task', async () => {
    const res = await request(app)
      .patch('/api/tasks/9999/move')
      .send({ columnId: columns.done });
    expect(res.status).toBe(404);
  });
});
