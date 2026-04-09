import dotenv from 'dotenv';

dotenv.config();

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    console.warn(`[config] Missing environment variable: ${key}`);
    return '';
  }
  return value;
}

function getEnvInt(key: string, defaultValue: number): number {
  const raw = process.env[key];
  if (!raw) return defaultValue;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function getEnvBool(key: string, defaultValue: boolean): boolean {
  const raw = process.env[key];
  if (!raw) return defaultValue;
  return raw.toLowerCase() === 'true' || raw === '1';
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.warn(
    '[config] DATABASE_URL is not set. Database operations will fail. ' +
    'Set DATABASE_URL in your .env file to a valid PostgreSQL connection string. ' +
    'Note: Prisma does not support SQLite as a drop-in fallback for PostgreSQL schemas.'
  );
}

export const config = {
  port: getEnvInt('PORT', 3000),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  isDevelopment: getEnv('NODE_ENV', 'development') === 'development',
  isProduction: getEnv('NODE_ENV', 'development') === 'production',

  database: {
    url: getEnv('DATABASE_URL', ''),
  },

  jwt: {
    secret: getEnv('JWT_SECRET', 'demo-jwt-secret-change-this-in-production-32chars'),
    refreshSecret: getEnv('JWT_REFRESH_SECRET', 'demo-refresh-secret-change-this-in-production-32'),
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
  },

  stripe: {
    secretKey: getEnv('STRIPE_SECRET_KEY', ''),
    webhookSecret: getEnv('STRIPE_WEBHOOK_SECRET', ''),
    prices: {
      premiumMonthly: getEnv('STRIPE_PRICE_PREMIUM_MONTHLY', ''),
      premiumYearly: getEnv('STRIPE_PRICE_PREMIUM_YEARLY', ''),
      eliteMonthly: getEnv('STRIPE_PRICE_ELITE_MONTHLY', ''),
      eliteYearly: getEnv('STRIPE_PRICE_ELITE_YEARLY', ''),
    },
  },

  cors: {
    frontendUrl: getEnv('FRONTEND_URL', 'http://localhost:8081'),
  },

  rateLimit: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 10,
    },
  },
} as const;

export default config;
