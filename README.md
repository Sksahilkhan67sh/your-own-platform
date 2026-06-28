# YOUR OWN — Land Listing Platform

A production-ready full-stack platform for listing and selling land. Visitors browse verified
listings and connect directly with the seller via a prefilled WhatsApp message — no forms, no
brokers, no middlemen. Admins manage listings, photos, and site settings through a dedicated
panel.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS, React Router, React Hook Form + Zod |
| Backend | Node.js + Express, MongoDB + Mongoose, JWT (access + rotating refresh tokens) |
| Image storage | AWS S3 (or any S3-compatible provider) via presigned uploads |
| Deployment target | Vercel (frontend) · Render/Railway (backend) · MongoDB Atlas (database) |

Monorepo layout:

```
apps/api/          Express backend
apps/web/           React frontend
packages/shared/     Code shared by both — WhatsApp link builder, slugify, enums
docs/                 Architecture notes, API reference, security checklist, deployment guide
infra/                docker-compose.yml for local development
```

See [`docs/PHASE_1_ARCHITECTURE.md`](docs/PHASE_1_ARCHITECTURE.md) for the full schema and API
design rationale.

---

## Local setup

### Option A — Docker Compose (recommended, includes MongoDB)

Requires Docker and Docker Compose installed locally.

```bash
# 1. Copy and fill in the API's environment file
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — at minimum set JWT_ACCESS_SECRET, AWS_* credentials,
# and SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD. MONGODB_URI is overridden
# automatically by docker-compose for local use, so you can leave the
# .env.example placeholder there.

# 2. Start everything
docker compose -f infra/docker-compose.yml up --build

# 3. In a separate terminal, seed the database (admin user + sample listings)
docker compose -f infra/docker-compose.yml exec api node seed.js
```

- Frontend: http://localhost:5173
- API: http://localhost:5000/api/v1
- API health check: http://localhost:5000/api/v1/health

### Option B — Run natively with npm workspaces (no Docker)

Requires Node.js 20+ and a MongoDB instance (local or [Atlas](https://www.mongodb.com/cloud/atlas) free tier).

```bash
# 1. Install all workspace dependencies from the repo root
npm install

# 2. Configure the API
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env: set a real MONGODB_URI (Atlas connection string or
# local mongod), JWT_ACCESS_SECRET, AWS_* credentials for S3, and
# SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.

# 3. Configure the frontend
cp apps/web/.env.example apps/web/.env.local
# Default VITE_API_BASE_URL=http://localhost:5000/api/v1 is correct for local dev.

# 4. Seed the database (creates the admin user, site settings, and sample listings)
npm run seed

# 5. Run both apps (in separate terminals)
npm run dev:api    # http://localhost:5000
npm run dev:web    # http://localhost:5173
```

Log in to the admin panel at `http://localhost:5173/admin/login` using the
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` you set in `apps/api/.env`.

**Before going live**, update the WhatsApp number in **Admin → Settings** — the seed script
inserts a placeholder number.

---

## Running tests

```bash
cd apps/api
npm test          # unit + integration tests (auth rotation, validators, middleware)

cd apps/web
npm run lint       # ESLint
npm run build      # production build sanity check
```

---

## Production deployment

Full step-by-step instructions: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

Summary:
1. **Database** — create a MongoDB Atlas cluster, allowlist Render/Railway's outbound IPs (or `0.0.0.0/0` if your plan requires it), copy the connection string into `MONGODB_URI`.
2. **Image storage** — create an S3 bucket (or Cloudflare R2 bucket), configure CORS on the bucket to allow PUT from your frontend's domain, generate an IAM user scoped to that bucket only.
3. **Backend** — deploy `apps/api` to Render or Railway using `apps/api/Dockerfile`; set all variables from `.env.example` in the platform's environment settings.
4. **Frontend** — deploy `apps/web` to Vercel; set `VITE_API_BASE_URL` to your deployed API's URL.
5. **CORS** — set `CORS_ALLOWED_ORIGINS` on the backend to your exact Vercel URL(s).
6. Run the seed script once against production (`node seed.js` via Render's shell, or a one-off job) to create the initial admin account, then **change the password expectation** by logging in and rotating credentials as needed — the seed script is meant for bootstrap, not ongoing use.

---

## Security checklist

See [`docs/SECURITY_CHECKLIST.md`](docs/SECURITY_CHECKLIST.md) for the full list of what's
implemented and what to verify before launch.

## API reference

See [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) for every endpoint, request/response
shapes, and a Postman collection.

## Brand credit

This deliverable references a "AlignCraft" credit that was requested but never specified by
the client. If this refers to a design system, partner, or attribution that should appear in
the footer or README, update [`docs/BRAND_CREDIT_TODO.md`](docs/BRAND_CREDIT_TODO.md) accordingly.
