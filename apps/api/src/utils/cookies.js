import { env } from '../config/env.js';

/**
 * httpOnly + Secure + SameSite=None is required because the API and the
 * Vercel-hosted frontend are different origins. SameSite=None mandates
 * Secure, so this cookie will only ever be set/sent over HTTPS — which is
 * correct for both Render (always HTTPS) and matches the project's
 * "HTTPS assumptions in production" requirement. In local dev (NODE_ENV
 * !== production) we relax Secure/SameSite so it still works over http://localhost.
 */
export function getRefreshCookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    domain: env.isProduction ? env.REFRESH_COOKIE_DOMAIN : undefined,
    path: '/api/v1/auth',
    maxAge: maxAgeMs,
  };
}

export const REFRESH_COOKIE_NAME = 'your_own_rt';
