import dotenv from 'dotenv';

dotenv.config();

export interface ApiConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  allowedOrigins: string[];
  firebase: {
    projectId: string;
    clientEmail?: string;
    privateKey?: string;
  };
}

export const config: ApiConfig = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://moneytracker:moneytracker_dev_password@localhost:5432/moneytracker_dev?schema=public',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173').split(',').map((o) => o.trim()),
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'digital-spending-tracker',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
};
