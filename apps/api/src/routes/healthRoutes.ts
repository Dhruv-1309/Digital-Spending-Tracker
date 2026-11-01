import { Router } from 'express';
import { prisma } from '../db/prisma.js';

export const healthRouter = Router();

healthRouter.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

healthRouter.get('/readyz', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready', database: 'connected' });
  } catch (err: any) {
    res.status(503).json({
      status: 'not_ready',
      database: 'disconnected',
      error: err?.message || 'Database unreachable',
    });
  }
});
