# Deployment Guide — YOUR OWN

Target architecture: **Vercel** (frontend) · **Render or Railway** (backend) · **MongoDB Atlas**
(database) · **AWS S3** (image storage). This matches the decisions locked in during Phase 1.

---

## 1. MongoDB Atlas

1. Create a free or paid cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. **Database Access** → create a database user with a strong, generated password (not your
   personal password). Grant it read/write on the `your-own` database only if you're using a
   shared cluster with other projects.
3. **Network Access** → add an IP allowlist entry. Render and Railway use dynamic outbound IPs
   on most plans, so you'll likely need `0.0.0.0/0` here — if so, your security boundary is the
   database user's password strength and the `MONGODB_URI` secret, so treat that connection
   string as highly sensitive.
4. Copy the connection string (Atlas → Connect → "Drivers" → Node.js) and use it as
   `MONGODB_URI`. It looks like:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/your-own?retryWrites=true&w=majority
   ```

## 2. AWS S3 (image storage)

1. Create a bucket, e.g. `your-own-land-images`, in a region close to your users (e.g.
   `ap-south-1` for India).
2. **Block Public Access settings**: keep "Block all public access" OFF only for the specific
   read access you need — the simplest correct setup is to keep the bucket private and instead
   make individual objects readable, OR set a bucket policy allowing public `GetObject` only
   (no `ListBucket`, no `PutObject` publicly). The app never needs public `PutObject` — all
   uploads go through presigned URLs signed by your backend's IAM credentials.
3. **CORS configuration** (Bucket → Permissions → CORS) — required so the browser can `PUT`
   directly to S3 using a presigned URL:
   ```json
   [
     {
       "AllowedOrigins": ["https://your-own.vercel.app"],
       "AllowedMethods": ["PUT", "GET"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
   Update `AllowedOrigins` to your real deployed frontend URL(s).
4. **IAM user**: create a dedicated IAM user (not your root account) with a policy scoped to
   only this bucket:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:DeleteObject", "s3:GetObject"],
         "Resource": "arn:aws:s3:::your-own-land-images/*"
       }
     ]
   }
   ```
   Generate an access key for this user — use it as `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.
5. Set `S3_PUBLIC_BASE_URL` to `https://your-own-land-images.s3.<region>.amazonaws.com`.

**Using Cloudflare R2 instead?** Same steps, but also set `S3_ENDPOINT` to your R2 account's
S3-compatible endpoint, and `S3_PUBLIC_BASE_URL` to your R2 public bucket URL or custom domain.

## 3. Backend → Render (or Railway)

### Render
1. New → Web Service → connect your repo.
2. **Root directory**: leave as the repo root (the Dockerfile path is set separately).
3. **Dockerfile path**: `apps/api/Dockerfile`. **Docker build context**: repo root (`.`).
4. **Environment**: add every variable from `apps/api/.env.example` with real production values.
   Do not set `NODE_ENV` manually if Render sets it for you — otherwise set it to `production`.
5. **Health check path**: `/api/v1/health`.
6. Deploy. Note the resulting URL, e.g. `https://your-own-api.onrender.com`.

### Railway
Equivalent steps: New Project → Deploy from repo → set the Dockerfile path to
`apps/api/Dockerfile` with root build context → add environment variables → deploy.

### After first deploy — seed the database
Open a shell against the running service (Render: "Shell" tab; Railway: `railway run`) and run:
```bash
node seed.js
```
This creates the admin user, the settings singleton (with a **placeholder WhatsApp number** —
update it immediately via the admin panel), and sample listings you can delete once you've
added real ones.

## 4. Frontend → Vercel

1. New Project → import your repo.
2. **Root Directory**: `apps/web`.
3. **Framework Preset**: Vite.
4. **Build Command**: `npm run build` (Vercel auto-detects this for the `apps/web` workspace
   once you set the root directory).
5. **Environment Variables**: `VITE_API_BASE_URL` = `https://your-own-api.onrender.com/api/v1`
   (your real backend URL from step 3, with `/api/v1` appended).
6. Deploy. Note the resulting URL, e.g. `https://your-own.vercel.app`.

## 5. Close the loop — CORS

Go back to your backend's environment variables (Render/Railway) and set:
```
CORS_ALLOWED_ORIGINS=https://your-own.vercel.app
```
(Add any custom domain here too, comma-separated, no trailing slashes.) Redeploy the backend
for this to take effect.

If you also set `REFRESH_COOKIE_DOMAIN`, it should be your **backend's** domain (e.g.
`your-own-api.onrender.com`), not the frontend's — the refresh cookie is set by, and only ever
read by, the API.

## 6. Verify end-to-end

1. Visit your Vercel URL — the homepage and `/lands` should load real data.
2. Visit `/admin/login`, sign in with your seed admin credentials.
3. Go to **Settings** and replace the placeholder WhatsApp number with your real business number.
4. Create a test listing with at least one image, confirm the upload completes and the image
   appears on the public listing page.
5. Click **Want to Buy** on the public listing page and confirm it opens WhatsApp with the
   correct prefilled message.
6. Delete the test listing and any remaining seed sample listings once you're satisfied.

## 7. Custom domain (optional)

- **Frontend**: Vercel → Project → Settings → Domains → add your domain, follow their DNS
  instructions.
- **Backend**: Render/Railway both support custom domains under their respective settings.
  If you add a custom API domain, update `REFRESH_COOKIE_DOMAIN` to match it and redeploy.
