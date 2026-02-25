import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import type { RequestHandler } from 'express';
import { env } from './config/env';
import { requestLogger } from './middleware/request-logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { analyzeRouter } from './routes/analyze';
import { proxyRouter } from './routes/proxy';

const app = express();
let helmetMiddleware: ((...args: unknown[]) => unknown) | null = null;
let rateLimitMiddleware: ((...args: unknown[]) => unknown) | null = null;

try {
  helmetMiddleware = require('helmet');
} catch {
  console.warn('[startup] helmet not installed; continuing without helmet middleware');
}

try {
  rateLimitMiddleware = require('express-rate-limit');
} catch {
  console.warn('[startup] express-rate-limit not installed; continuing without rate limiting');
}

app.disable('x-powered-by');

if (helmetMiddleware) {
  const middleware = helmetMiddleware({
    crossOriginResourcePolicy: false,
  }) as RequestHandler;

  app.use(
    middleware
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

      if (origin === env.CORS_ORIGIN || localOriginPattern.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'POST'],
  })
);

if (rateLimitMiddleware) {
  const middleware = rateLimitMiddleware({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  }) as RequestHandler;

  app.use(
    middleware
  );
}

app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'DevAPI backend is running.',
    endpoints: ['GET /health', 'POST /api/proxy', 'POST /api/analyze'],
  });
});

app.use('/api', proxyRouter);
app.use('/api', analyzeRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`DevAPI Server running on http://localhost:${env.PORT}`);
});
