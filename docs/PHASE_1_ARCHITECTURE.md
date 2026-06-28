# YOUR OWN — Phase 1: Architecture, Schema, API & Design System

> Land listing platform. Public marketing/browse site + secure admin panel + REST API.
> Monorepo: `apps/web` (React/Vite, → Vercel), `apps/api` (Express, → Render/Railway), `packages/shared` (shared types + WhatsApp utility).

---

## 1. Monorepo Layout

```
your-own-platform/
├── apps/
│   ├── api/                          # Express backend → Render/Railway
│   │   ├── src/
│   │   │   ├── config/               # env loading, db connection, cors, s3 client
│   │   │   ├── models/                # Mongoose schemas
│   │   │   ├── controllers/           # HTTP layer: parse req, call service, shape res
│   │   │   ├── services/              # business logic, framework-agnostic
│   │   │   ├── middlewares/           # auth, error handling, rate limit, validation runner
│   │   │   ├── validators/            # Zod schemas for every write endpoint
│   │   │   ├── utils/                 # slugify, asyncHandler, ApiError, ApiResponse, logger
│   │   │   ├── routes/v1/             # route definitions, mounted under /api/v1
│   │   │   ├── jobs/                  # e.g. orphaned-image cleanup cron
│   │   │   ├── app.js                 # express app assembly (no listen())
│   │   │   └── server.js              # entrypoint: connect db, app.listen()
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── seed.js
│   │   ├── .env.example
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                          # React + Vite frontend → Vercel
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/                # Button, Input, Select, Badge, Skeleton, etc.
│       │   │   ├── listing/           # ListingCard, Gallery, FilterBar, StickyBuyBar
│       │   │   ├── admin/             # LandForm, ImageUploader, AdminTable
│       │   │   └── layout/            # Navbar, Footer, AdminSidebar
│       │   ├── pages/
│       │   │   ├── public/            # Home, BrowseLands, LandDetails, NotFound, About, Contact
│       │   │   └── admin/             # Login, Dashboard, LandsList, LandEditor, Settings
│       │   ├── layouts/               # PublicLayout, AdminLayout
│       │   ├── hooks/                 # useAuth, useLands, useDebouncedValue
│       │   ├── lib/                   # axios instance, query client, whatsapp link builder (re-exports shared)
│       │   ├── store/                 # Zustand: authStore (access token + user only)
│       │   ├── styles/                # tailwind.css, tokens
│       │   ├── routes/                # router config incl. ProtectedRoute
│       │   ├── App.jsx
│       │   └── main.jsx
│       ├── public/
│       ├── .env.example
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   └── shared/                       # imported by both apps via workspace alias
│       └── src/
│           ├── whatsapp.js            # buildWhatsAppLink() — single source of truth
│           ├── constants.js           # LAND_STATUS, AREA_UNITS, IMAGE_LIMITS
│           └── slugify.js
│
├── infra/
│   ├── docker-compose.yml             # local: api + web + mongo (no S3 — uses real S3 creds via env)
│   └── nginx/ (optional, VPS-only notes)
│
├── docs/
│   ├── PHASE_1_ARCHITECTURE.md        # this file
│   ├── API_REFERENCE.md               # Phase 4
│   ├── SECURITY_CHECKLIST.md          # Phase 4
│   └── DEPLOYMENT.md                  # Phase 4
│
├── package.json                       # npm workspaces root
└── README.md
```

**Why npm workspaces, not two unrelated repos:** `packages/shared` guarantees the WhatsApp message format, status enums, and area units can't drift between frontend and backend — they import the literal same function and constant, not a re-implementation.

---

## 2. Database Schema (MongoDB / Mongoose)

### 2.1 `User`
```
_id
name            String, required, trim, maxlength 80
email           String, required, unique, lowercase, trim, indexed
passwordHash    String, required, select:false (never returned by default)
role            String, enum ['admin'], default 'admin'   // extensible, see note
isActive        Boolean, default true
lastLoginAt     Date
failedLoginAttempts  Number, default 0     // brute-force tracking
lockUntil       Date                        // set when attempts exceed threshold
createdAt / updatedAt  (timestamps: true)
```
Index: `{ email: 1 }` unique.
**Extensibility note:** role is an enum of one today. Adding `editor`/`agent` later is a one-line enum change + new `requireRole()` calls — no schema migration of existing logic.

### 2.2 `RefreshToken` (supports rotation + theft detection — not in original list, required for the chosen auth strategy)
```
_id
user            ObjectId → User, required, indexed
tokenHash       String, required          // sha256 of the actual token; raw token never stored
family          String, required, indexed // groups all tokens descended from one login
revokedAt       Date
replacedByHash  String
userAgent       String
ip              String
expiresAt       Date, required, indexed (TTL index)
createdAt
```
TTL index on `expiresAt` so Mongo auto-purges expired tokens. This is the mechanism that makes "refresh-token strategy" actually secure instead of a long-lived JWT pretending to be one.

### 2.3 `Land`
```
_id
title               String, required, trim, maxlength 140
slug                String, required, unique, indexed, immutable-after-publish
description         String, required, maxlength 5000
price               Number, required, min 0
currency            String, default 'INR'
areaValue           Number, required, min 0
areaUnit            String, enum ['sqft','sqyd','acre','hectare','bigha'], required
address             String, required
city                String, required, indexed
state               String, required, indexed
country             String, default 'India'
postalCode          String
latitude            Number, min -90, max 90
longitude           Number, min -180, max 180
status              String, enum ['available','pending','sold'], default 'available', indexed
featured            Boolean, default false, indexed
whatsappNumberOverride  String, validated E.164-ish, optional
highlights          [String], maxlength 20 items
amenities           [String], maxlength 20 items
createdBy           ObjectId → User, required
publishedAt         Date
createdAt / updatedAt
```
Compound indexes:
- `{ status: 1, featured: -1, createdAt: -1 }` — homepage/featured queries
- `{ city: 1, state: 1 }` — location filters
- `{ price: 1 }`, `{ areaValue: 1 }` — range filters
- Text index `{ title: 'text', description: 'text', city: 'text' }` — search box

### 2.4 `LandImage`
```
_id
land            ObjectId → Land, required, indexed
imageUrl        String, required          // public CDN/S3 URL
storageKey      String, required          // S3 object key, used for deletion
altText         String, maxlength 150
sortOrder       Number, required, default 0
width / height  Number
createdAt / updatedAt
```
Index: `{ land: 1, sortOrder: 1 }`.
**Max 10 enforced at service layer** (pre-write count check), not just UI — see Security section.

### 2.5 `Settings` (singleton document)
```
_id
siteName            String, default 'YOUR OWN'
logoUrl             String
defaultWhatsappNumber  String, required, E.164-ish validated
contactEmail        String
heroHeadline         String
heroSubheadline      String
seoDefaultTitle      String
seoDefaultDescription String
socialLinks         { instagram, facebook, twitter, youtube } — all optional Strings
updatedAt
```
Enforced singleton via a fixed `_id: 'singleton'` and upsert-only write path.

### 2.6 `Inquiry` (optional log, included — low cost, high value for a sales business)
```
_id
land            ObjectId → Land, indexed
source          String, enum ['whatsapp_cta']
contactMethod   String, default 'whatsapp'
messagePreview  String, maxlength 500
createdAt
```
This is fire-and-forget logging from the public side (no auth) hit right before the WhatsApp redirect — gives the business a lead count per listing without storing any PII beyond what's already public.

---

## 3. API Design

Base path: `/api/v1`. Consistent envelope on every response:

```json
// success
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 12, "total": 47 } }

// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] }, "requestId": "..." }
```

### Public (no auth)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/health` | uptime, db connectivity |
| GET | `/api/v1/lands` | filters: `q, minPrice, maxPrice, minArea, maxArea, status, featured, city, state, sort, page, limit` |
| GET | `/api/v1/lands/:slug` | only returns `available`/`pending`/`sold` published lands |
| GET | `/api/v1/settings/public` | site name, logo, hero content, whatsapp number, socials — public subset only |
| POST | `/api/v1/inquiries` | rate-limited, logs WhatsApp-click intent, fire-and-forget |

### Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/auth/login` | strict rate limit (e.g. 5/15min/IP), account lockout after N failures |
| POST | `/api/v1/auth/refresh` | reads httpOnly cookie, rotates token |
| POST | `/api/v1/auth/logout` | revokes current token family |
| GET | `/api/v1/auth/me` | current admin profile, requires access token |

### Admin (JWT required, `role: admin`)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/admin/lands` | all statuses, all data, paginated |
| POST | `/api/v1/admin/lands` | create |
| GET | `/api/v1/admin/lands/:id` | full detail incl. unpublished |
| PATCH | `/api/v1/admin/lands/:id` | partial update |
| DELETE | `/api/v1/admin/lands/:id` | soft constraints: cascades image deletion (S3 + DB) |
| POST | `/api/v1/admin/lands/:id/images/presign` | issue presigned S3 PUT URL(s); enforces 10-image cap **before** issuing |
| POST | `/api/v1/admin/lands/:id/images/confirm` | persists `LandImage` doc after browser confirms S3 upload succeeded |
| PATCH | `/api/v1/admin/lands/:id/images/reorder` | bulk sortOrder update |
| DELETE | `/api/v1/admin/lands/:id/images/:imageId` | deletes from S3 + DB |
| GET | `/api/v1/admin/settings` | full settings doc |
| PUT | `/api/v1/admin/settings` | upsert singleton |

**Why presign/confirm instead of direct multipart upload through Express:** keeps large binary payloads off the Render dyno entirely — Express only ever issues a signed URL and later records metadata, both tiny JSON payloads. This is the production-correct pattern for "Multer-style" uploads when actually using S3, and it avoids request-size/timeout issues with 10 images per listing.

---

## 4. Security Architecture (carried into Phase 2)

- **AuthN:** bcrypt (cost 12) password hashing; JWT access token (15 min) signed with `JWT_ACCESS_SECRET`; refresh token (30 days) opaque random value, only its SHA-256 hash stored, delivered via `httpOnly, Secure, SameSite=None` cookie scoped to the API's own domain.
- **Refresh rotation + reuse detection:** each `/auth/refresh` call issues a new token and immediately revokes the old hash; if a revoked hash is ever presented again, the entire token *family* is revoked (signals theft/replay).
- **AuthZ:** `requireAuth` middleware verifies the access token; `requireRole('admin')` middleware checks role; every admin mutation re-fetches the target `Land`/`LandImage` from the DB inside the controller before acting — client-supplied IDs are never trusted as proof of existence or state.
- **Rate limiting:** global limiter on all `/api/v1/*`; a much stricter limiter on `/auth/login` and `/inquiries`.
- **Upload validation:** content-type allowlist (`image/jpeg, image/png, image/webp`) and max size (e.g. 8MB) enforced server-side when issuing the presigned URL (via S3 policy conditions), not just client-side; image count capped at 10 server-side at presign time.
- **Headers/CORS:** Helmet defaults + explicit CSP; CORS allowlist = the deployed Vercel URL(s) only, credentials: true.
- **No secrets in repo:** all secrets via `.env`, `.env.example` documents required keys with placeholder values only.
- **Logging:** structured JSON logs with request IDs; passwords, tokens, and full Authorization headers are explicitly redacted in the logger config, never logged even at debug level.

Full checklist with verification steps ships in Phase 4.

---

## 5. UI / Design System Direction

**Palette** (CSS custom properties, Tailwind extended):
- `--surface: #F7F4EE` (warm ivory) / `--surface-alt: #EFE9DD` (sand)
- `--ink: #2B2620` (warm charcoal, not pure black)
- `--accent: #44574A` (deep olive-green) / `--accent-hover: #36463B`
- `--border: #DDD5C5`
- `--danger: #8C3D2E` (muted terracotta, not stock red)

**Typography:** a serif display face (e.g. "Fraunces" or "Source Serif 4") for headlines paired with a clean grotesk (e.g. "Inter") for body/UI — editorial pairing, deliberately not a single geometric sans doing both jobs (the single-typeface, single-weight-scale look is one of the strongest "AI-generated" tells).

**Layout principles carried into Phase 3:**
- Hero is asymmetric: large image block right-aligned, headline + CTA left-aligned on a 60/40 split, not centered.
- Listing cards: subtle 1px border (`--border`) + soft single-direction shadow, image aspect-ratio locked 4:3, price and area as the visual anchors, status as a small text badge (not a loud pill).
- One primary action per viewport — on listing details, the "Want to Buy" button is the only filled/accent button on the page; everything else is outline or text-style.
- Sticky bottom CTA bar on mobile listing-details pages only (not site-wide).
- No card-in-circle icons; section dividers are typographic (numbers, small caps labels) rather than icon grids.

---

## 6. What Phase 2 builds on this

Phase 2 implements: config/env loading, DB connection, all Mongoose models above, the auth system (User, RefreshToken, login/refresh/logout/me), `requireAuth`/`requireRole` middleware, Zod validators for every write route, the Land + LandImage admin CRUD controllers/services, the S3 presign/confirm upload flow, Settings CRUD, Helmet/CORS/rate-limit/compression wiring, centralized error handler, and the health endpoint — as real, runnable code, file by file.
