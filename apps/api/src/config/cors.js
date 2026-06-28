import { env } from './env.js';

/**
 * CORS allowlist, not a wildcard. credentials: true is required because the
 * refresh token travels in a cookie cross-origin (Vercel ↔ Render), and
 * cookies + credentials:true only work with explicit (non-wildcard) origins.
 */
export const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser requests (no Origin header, e.g. health checks, curl)
    if (!origin) return callback(null, true);

    if (env.CORS_ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Request-Id'],
};
