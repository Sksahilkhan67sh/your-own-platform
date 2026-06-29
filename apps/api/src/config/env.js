import 'dotenv/config';

/**
 * Centralized, validated environment config.
 * The app refuses to boot if a required variable is missing — failing fast
 * at startup is far safer than discovering a missing JWT_ACCESS_SECRET
 * at the first login request in production.
 */

const REQUIRED_IN_ALL_ENVS = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'CORS_ALLOWED_ORIGINS',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'S3_PUBLIC_BASE_URL',
];

function requireEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable: ${name}. Check .env against .env.example.`
    );
  }
  return value;
}

for (const name of REQUIRED_IN_ALL_ENVS) {
  requireEnv(name);
}

if (process.env.NODE_ENV === 'production' && process.env.JWT_ACCESS_SECRET.length < 32) {
  throw new Error('JWT_ACCESS_SECRET is too short for production use. Use at least 64 random bytes.');
}

export const env = {
  RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
  EMAIL_FROM: process.env.EMAIL_FROM || 'onboarding@resend.dev',
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  PORT: Number(process.env.PORT) || 5000,

  MONGODB_URI: process.env.MONGODB_URI,

  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS.split(',').map((s) => s.trim()),

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN_DAYS: Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS) || 30,

  REFRESH_COOKIE_DOMAIN: process.env.REFRESH_COOKIE_DOMAIN || 'localhost',

  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,

  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL,
  S3_ENDPOINT: process.env.S3_ENDPOINT || undefined,

  SEED_ADMIN_NAME: process.env.SEED_ADMIN_NAME || 'Admin',
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,

  LOGIN_RATE_LIMIT_WINDOW_MIN: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MIN) || 15,
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: Number(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS) || 5,
  ACCOUNT_LOCK_THRESHOLD: Number(process.env.ACCOUNT_LOCK_THRESHOLD) || 5,
  ACCOUNT_LOCK_DURATION_MIN: Number(process.env.ACCOUNT_LOCK_DURATION_MIN) || 15,
};
