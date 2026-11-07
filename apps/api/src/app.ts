import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { config } from './config/index.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { authMiddleware } from './middleware/auth.js';
import { idempotencyMiddleware } from './middleware/idempotency.js';
import { generalRateLimiter, globalIpRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Support BigInt serialization in JSON responses (e.g. Prisma BigInt amountPaise)
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

import { healthRouter } from './routes/healthRoutes.js';
import { docsRouter } from './routes/docsRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import { userRouter } from './routes/userRoutes.js';
import { transactionRouter } from './routes/transactionRoutes.js';
import { categoryRouter } from './routes/categoryRoutes.js';
import { autopayRouter } from './routes/autopayRoutes.js';
import { budgetRouter } from './routes/budgetRoutes.js';
import { dashboardRouter } from './routes/dashboardRoutes.js';
import { analyticsRouter } from './routes/analyticsRoutes.js';
import { anomalyRouter } from './routes/anomalyRoutes.js';
import { syncRouter } from './routes/syncRoutes.js';

export function createApp() {
  const app = express();

  // 1. Security Headers (SEC-4)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Additional Permissions-Policy header for API endpoints (SEC-4)
  app.use((_req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // 2. CORS Allowlist (SEC-4)
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || config.allowedOrigins.includes(origin) || config.nodeEnv === 'development' || config.nodeEnv === 'test') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id', 'X-Cache', 'Content-Disposition'],
    }),
  );

  // 3. HTTP Compression (PERF-13: gzip/deflate for payloads > 1KB)
  app.use(
    compression({
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );

  // 4. Request ID tracking (BE-6.3)
  app.use(requestIdMiddleware);

  // 4. Body Parsers (SEC-3: 1MB general, up to 5MB for imports)
  app.use('/api/v1/transactions/import', express.json({ limit: '5mb' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 5. Global IP Rate Limiting (SEC-5: DDoS protection per IP)
  app.use(globalIpRateLimiter);

  // 6. Public, Health & Documentation Routes (Unauthenticated, BE-6.1, WEB-8)
  app.use('/', healthRouter);
  app.use('/', docsRouter);
  app.use('/auth', authRouter);
  app.use('/api/v1/auth', authRouter);

  // 7. API v1 Endpoints (PRD §7)
  const apiV1 = express.Router();
  apiV1.use(authMiddleware());
  // User-level rate limiting (BE-7: 100 requests per minute per authenticated user)
  apiV1.use(generalRateLimiter);
  apiV1.use(idempotencyMiddleware());

  apiV1.use('/', userRouter);
  apiV1.use('/users', userRouter);
  apiV1.use('/transactions', transactionRouter);
  apiV1.use('/categories', categoryRouter);
  apiV1.use('/autopay', autopayRouter);
  apiV1.use('/budget', budgetRouter);
  apiV1.use('/dashboard', dashboardRouter);
  apiV1.use('/analytics', analyticsRouter);
  apiV1.use('/anomalies', anomalyRouter);
  apiV1.use('/sync', syncRouter);

  app.use('/api/v1', apiV1);

  // 9. Centralized Error Handling (BE-6.2)
  app.use(errorHandler);

  return app;
}
