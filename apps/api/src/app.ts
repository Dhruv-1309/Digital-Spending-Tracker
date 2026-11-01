import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/index.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { authMiddleware } from './middleware/auth.js';
import { idempotencyMiddleware } from './middleware/idempotency.js';
import { generalRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Support BigInt serialization in JSON responses (e.g. Prisma BigInt amountPaise)
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

import { healthRouter } from './routes/healthRoutes.js';
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
  app.use(helmet());

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

  // 3. Request ID tracking (BE-6.3)
  app.use(requestIdMiddleware);

  // 4. Body Parsers (SEC-3: 1MB general, up to 5MB for imports)
  app.use('/api/v1/transactions/import', express.json({ limit: '5mb' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 5. Rate Limiting (SEC-5)
  app.use(generalRateLimiter);

  // 6. Health Routes (Unauthenticated, BE-6.1)
  app.use('/', healthRouter);

  // 7. API v1 Endpoints (PRD §7)
  const apiV1 = express.Router();
  apiV1.use(authMiddleware());
  apiV1.use(idempotencyMiddleware());

  apiV1.use('/', userRouter);
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
