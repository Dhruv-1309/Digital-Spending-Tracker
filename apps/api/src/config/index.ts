import dotenv from 'dotenv';

dotenv.config();

export interface ConnectionPoolConfig {
  connectionLimit: number;
  poolTimeout: number;
  connectTimeout: number;
  statementTimeoutMs: number;
}

export interface ApiConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  allowedOrigins: string[];
  dbPool: ConnectionPoolConfig;
  firebase: {
    projectId: string;
    clientEmail?: string;
    privateKey?: string;
  };
}

export function buildDatabaseUrl(
  rawUrl: string,
  poolConfig: Partial<ConnectionPoolConfig> = {},
): string {
  const connectionLimit = poolConfig.connectionLimit ?? parseInt(process.env.DB_POOL_LIMIT || '10', 10);
  const poolTimeout = poolConfig.poolTimeout ?? parseInt(process.env.DB_POOL_TIMEOUT || '10', 10);
  const connectTimeout = poolConfig.connectTimeout ?? parseInt(process.env.DB_CONNECT_TIMEOUT || '10', 10);
  const statementTimeoutMs = poolConfig.statementTimeoutMs ?? parseInt(process.env.DB_STATEMENT_TIMEOUT_MS || '15000', 10);

  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', String(connectionLimit));
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', String(poolTimeout));
    }
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', String(connectTimeout));
    }
    if (!url.searchParams.has('statement_timeout')) {
      url.searchParams.set('statement_timeout', String(statementTimeoutMs));
    }
    return url.toString();
  } catch (_err: unknown) {
    return rawUrl;
  }
}

const dbPoolConfig: ConnectionPoolConfig = {
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '10', 10),
  poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT || '10', 10),
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10', 10),
  statementTimeoutMs: parseInt(process.env.DB_STATEMENT_TIMEOUT_MS || '15000', 10),
};

export const config: ApiConfig = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: buildDatabaseUrl(
    process.env.DATABASE_URL || 'postgresql://moneytracker:moneytracker_dev_password@localhost:5432/moneytracker_dev?schema=public',
    dbPoolConfig,
  ),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173').split(',').map((o) => o.trim()),
  dbPool: dbPoolConfig,
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'digital-spending-tracker',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
};
