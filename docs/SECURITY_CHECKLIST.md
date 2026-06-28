# Security Checklist — YOUR OWN

This reflects what is actually implemented in this codebase (verified against the source, not
a generic template), plus a separate list of configuration steps that depend on your specific
hosting setup and must be verified before launch.

## ✅ Implemented in code

### Authentication & session management
- [x] Passwords hashed with bcrypt, configurable cost factor (`BCRYPT_SALT_ROUNDS`, default 12) — `src/models/User.js`
- [x] JWT access tokens, short-lived (default 15m), never stored in a cookie — `src/services/authService.js`
- [x] Refresh tokens are opaque random values (not JWTs); only their SHA-256 hash is stored — `src/utils/tokenCrypto.js`
- [x] Refresh token rotation on every use — `src/services/authService.js: refreshSession()`
- [x] Refresh token reuse detection: presenting an already-rotated token revokes the entire token family — same function, covered by `tests/integration/authService.test.js`
- [x] Refresh cookie is `httpOnly`, `Secure` (in production), `SameSite=None` (cross-origin) — `src/utils/cookies.js`
- [x] Per-account brute-force lockout after `ACCOUNT_LOCK_THRESHOLD` failed attempts — `src/services/authService.js`
- [x] IP-based rate limiting on `/auth/login`, separate from the account lockout — `src/middlewares/rateLimiters.js`
- [x] No user-enumeration: identical error for "no such user" and "wrong password" — verified by test
- [x] Deactivated/deleted users are rejected even with a still-valid access token (`requireAuth` re-checks `isActive` on every request)

### Authorization
- [x] Role-based middleware (`requireRole`), checked after authentication — `src/middlewares/auth.js`
- [x] Every admin land/image mutation re-fetches the target resource from the database before acting — client-supplied IDs are never trusted as proof a resource exists or belongs to the caller
- [x] Image reorder requests are validated so every `imageId` actually belongs to the target `landId` — rejects the whole batch otherwise (`src/services/s3Service.js: reorderLandImages`)

### Input validation
- [x] Every write endpoint validated with Zod before reaching a controller — `src/validators/*.js`, applied via `src/middlewares/validate.js`
- [x] Numeric bounds enforced (price ≥ 0, area ≥ 0, lat/lng ranges, etc.)
- [x] Enum fields (status, area unit) restricted to the shared enum, not free text
- [x] Pagination `limit` capped at 48 — prevents a single request from requesting unbounded data (OWASP API4: Unrestricted Resource Consumption)

### File upload security
- [x] Uploads go directly browser → S3 via presigned URLs; raw image bytes never pass through the Express process
- [x] 10-image-per-listing cap enforced server-side at both presign time and confirm time (a race between parallel presigns can't bypass it) — `src/services/s3Service.js`
- [x] MIME type allowlist (`image/jpeg`, `image/png`, `image/webp`) and 8MB size limit enforced server-side, not just in the UI
- [x] Presigned URLs expire after 5 minutes

### Transport & headers
- [x] Helmet applied with an explicit Content-Security-Policy (not just defaults) — `src/app.js`
- [x] CORS restricted to an explicit origin allowlist (`CORS_ALLOWED_ORIGINS`), not a wildcard — `src/config/cors.js`
- [x] `express-mongo-sanitize` strips `$`/`.` operators from request bodies/query/params — prevents NoSQL operator injection
- [x] JSON body size capped at 100kb — image bytes never hit this path, so this is intentionally tight

### Error handling & logging
- [x] Centralized error handler; unknown/unexpected errors return a generic message in production, full detail only in server logs — `src/middlewares/errorHandler.js`
- [x] Mongoose internals (cast errors, duplicate-key errors, validation errors) are translated into clean client-safe responses, never forwarded raw
- [x] Structured logging (pino) with explicit redaction of passwords, tokens, and Authorization/Cookie headers — `src/config/logger.js`
- [x] Every request gets a request ID, surfaced in error responses, so a user-reported issue can be traced without exposing internals

### Secrets management
- [x] `.env` is gitignored; `.env.example` contains placeholders only, never real values
- [x] App refuses to boot if required env vars are missing — `src/config/env.js`
- [x] Production mode additionally requires `JWT_ACCESS_SECRET` to be at least 32 characters

---

## ⚠️ Verify before launch (depends on your hosting/account setup, not just code)

These are correct in the code but their *effectiveness* depends on configuration outside this
repository — verify each one for your actual deployment:

- [ ] **HTTPS everywhere.** Render/Railway provide this automatically; if you self-host, ensure
  TLS is terminated before traffic reaches the API (the cookie's `Secure` flag means cookies
  silently stop working over plain HTTP in production).
- [ ] **S3 bucket CORS policy** allows `PUT` only from your actual frontend domain(s), not `*`.
- [ ] **S3 bucket is not publicly listable/writable** beyond the presigned-URL flow — check the
  bucket policy directly, since a misconfigured bucket policy can override what the app intends.
- [ ] **IAM credentials used by the API** are scoped to only this one S3 bucket (least privilege),
  not a broad AWS account-level key.
- [ ] **MongoDB Atlas network access** is restricted to your hosting provider's IP range where
  possible, rather than `0.0.0.0/0`. If your platform requires `0.0.0.0/0` (common for serverless/
  dynamic-IP hosts like Render), make sure the database user's password is strong and rotated.
- [ ] **Rotate `JWT_ACCESS_SECRET`** if it was ever shared, committed, or pasted anywhere outside
  your secrets manager.
- [ ] **Change the seed admin password** immediately after first deploy — the seed script is a
  bootstrap mechanism, and the password lives in your deploy environment's variable history.
- [ ] **CORS_ALLOWED_ORIGINS** in production contains your exact Vercel URL (and any custom
  domain), with no trailing slash, and nothing else.
- [ ] **Backups.** This checklist covers attack-surface security, not data durability — confirm
  Atlas backup/point-in-time-recovery is enabled at whatever tier you choose.

---

## Known limitations / explicitly out of scope

- **No 2FA/MFA** for the admin account. With one admin role today, this is a reasonable v1
  trade-off, but should be revisited before adding multiple admin users.
- **No CSRF token** beyond `SameSite` cookie protection. Because the refresh token cookie uses
  `SameSite=None` (required for cross-origin Vercel↔Render), it does not get CSRF protection
  from `SameSite` alone — but the cookie is only ever read by `/auth/refresh` and `/auth/logout`,
  which don't mutate listing data, and every state-changing admin request additionally requires
  a valid `Authorization: Bearer` access token that cannot be inferred or replayed cross-site.
  If you add cookie-authenticated state-changing endpoints later, add explicit CSRF tokens then.
- **No WAF / DDoS protection** is configured in this codebase — rely on your hosting provider's
  platform-level protections (Render, Vercel, and Cloudflare in front of either all provide this).
- **No automated dependency vulnerability scanning** is wired into CI in this deliverable —
  add `npm audit` or Dependabot/Snyk as a follow-up.
