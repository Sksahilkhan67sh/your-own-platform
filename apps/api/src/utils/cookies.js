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
    // Only set Domain when explicitly configured — omitting it scopes the
    // cookie to the exact host that set it, which is correct for the
    // common case of one API host with no subdomain-sharing requirement,
    // and avoids ever emitting a Domain the browser will reject.
    domain: env.REFRESH_COOKIE_DOMAIN,
    path: '/api/v1/auth',
    maxAge: maxAgeMs,
  };
}

/**
 * Options used to clear the refresh cookie on logout. Must mirror the
 * path/domain/secure/sameSite used when the cookie was set — browsers only
 * recognize a clear (Max-Age=0) as targeting the same cookie if these
 * attributes match, otherwise the stale cookie is left behind client-side.
 */
export function getClearCookieOptions() {
  const { httpOnly, secure, sameSite, domain, path } = getRefreshCookieOptions(0);
  return { httpOnly, secure, sameSite, domain, path };
}

export const REFRESH_COOKIE_NAME = 'your_own_rt';
