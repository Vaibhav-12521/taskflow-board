import express from 'express';
import cors from 'cors';
import boardRoutes from './routes/board.js';
import taskRoutes from './routes/tasks.js';

export function createApp(db) {
  const app = express();
  app.locals.db = db;

  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) =>
    res.json({
      name: 'TaskFlow API',
      status: 'ok',
      app: 'https://taskflow-board-rho.vercel.app',
      endpoints: ['/api/health', '/api/board', '/api/boards/:id/stats', '/api/boards/:id/tasks?priority=High'],
    })
  );

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', boardRoutes);
  app.use('/api', taskRoutes);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  app.use((err, _req, res, _next) => {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
  });

  return app;
}
