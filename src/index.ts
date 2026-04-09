import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { corsMiddleware } from './middleware/cors';
import { generalLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import * as subscriptionController from './controllers/subscription.controller';
import routes from './routes';

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(corsMiddleware);

// ─── Logging ─────────────────────────────────────────────────────────────────
app.use(morgan(config.isDevelopment ? 'dev' : 'combined'));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
app.use(generalLimiter);

// ─── Stripe Webhook (needs raw body, must be before express.json) ────────────
app.post(
  '/api/subscriptions/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionController.handleWebhook as (req: Request, res: Response, next: NextFunction) => void
);

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = config.port;

async function startServer(): Promise<void> {
  // Attempt database connection (non-blocking -- server starts regardless)
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║           DeepQuad Backend API Server                ║
╠══════════════════════════════════════════════════════╣
║  Environment : ${config.nodeEnv.padEnd(37)}║
║  Port        : ${String(PORT).padEnd(37)}║
║  URL         : ${'http://localhost:' + PORT.toString().padEnd(20)}║
╠══════════════════════════════════════════════════════╣
║  Available Routes:                                   ║
║  GET    /api/health                                  ║
║  POST   /api/auth/signup                             ║
║  POST   /api/auth/login                              ║
║  POST   /api/auth/refresh                            ║
║  POST   /api/auth/reset-password                     ║
║  POST   /api/auth/change-password                    ║
║  POST   /api/auth/logout                             ║
║  GET    /api/users/me                                ║
║  PUT    /api/users/me                                ║
║  PATCH  /api/users/me/preferences                    ║
║  GET    /api/workouts                                ║
║  POST   /api/workouts                                ║
║  GET    /api/workouts/active                         ║
║  GET    /api/workouts/:id                            ║
║  POST   /api/workouts/:id/exercises                  ║
║  PATCH  /api/workouts/:wid/sets/:sid                 ║
║  POST   /api/workouts/:id/finish                     ║
║  GET    /api/exercises                               ║
║  GET    /api/exercises/:id                           ║
║  GET    /api/nutrition/foods                         ║
║  POST   /api/nutrition/foods                         ║
║  GET    /api/nutrition/logs                          ║
║  POST   /api/nutrition/logs                          ║
║  GET    /api/nutrition/water                         ║
║  PUT    /api/nutrition/water                         ║
║  GET    /api/nutrition/goals                         ║
║  PUT    /api/nutrition/goals                         ║
║  GET    /api/nutrition/summary                       ║
║  GET    /api/progress/metrics                        ║
║  POST   /api/progress/metrics                        ║
║  GET    /api/progress/stats                          ║
║  GET    /api/gamification/profile                    ║
║  POST   /api/gamification/xp                         ║
║  GET    /api/gamification/achievements               ║
║  GET    /api/subscriptions/status                    ║
║  POST   /api/subscriptions/trial                     ║
║  POST   /api/subscriptions/checkout                  ║
║  POST   /api/subscriptions/webhook                   ║
╚══════════════════════════════════════════════════════╝
    `);
  });
}

startServer().catch((error) => {
  console.error('[server] Failed to start:', error);
  process.exit(1);
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('[server] SIGTERM received. Shutting down gracefully...');
  const { disconnectDatabase } = await import('./config/database');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[server] SIGINT received. Shutting down gracefully...');
  const { disconnectDatabase } = await import('./config/database');
  await disconnectDatabase();
  process.exit(0);
});

export default app;
