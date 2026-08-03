# API Reference — YOUR OWN

Base URL: `{API_BASE_URL}/api/v1` (e.g. `http://localhost:5000/api/v1` locally)

All responses use this envelope:

```json
// success
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 12, "total": 47 } }

// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] }, "requestId": "..." }
```

`meta` is only present on paginated list endpoints. `details` is only present on validation errors.

Admin endpoints require `Authorization: Bearer <accessToken>`, obtained from `/auth/login` or `/auth/refresh`.

---

## Health

### `GET /health`
No auth required.

```json
{ "success": true, "data": { "status": "ok", "uptimeSeconds": 1234, "database": "connected", "timestamp": "2026-06-27T..." } }
```

---

## Auth

### `POST /auth/login`
Rate-limited (default: 5 attempts / 15 min / IP). Sets the refresh token as an httpOnly cookie.

**Body:**
```json
{ "email": "admin@yourown.com", "password": "..." }
```

**Response `200`:**
```json
{ "success": true, "data": { "accessToken": "eyJ...", "user": { "id": "...", "name": "...", "email": "...", "role": "admin" } } }
```

**Errors:** `401 UNAUTHORIZED` (wrong credentials — same message for unknown email), `423 ACCOUNT_LOCKED` (too many failed attempts).

### `POST /auth/refresh`
No body required — reads the refresh token from the httpOnly cookie. Rotates the token and sets a new cookie.

**Response `200`:** same shape as login.
**Errors:** `401 UNAUTHORIZED` if the cookie is missing, expired, invalid, or has already been used (theft detection).

### `POST /auth/logout`
Revokes the current refresh token family and clears the cookie.

**Response `200`:**
```json
{ "success": true, "data": { "loggedOut": true } }
```

### `GET /auth/me`
Requires `Authorization: Bearer`.

**Response `200`:**
```json
{ "success": true, "data": { "user": { "_id": "...", "name": "...", "email": "...", "role": "admin", "isActive": true } } }
```

---

## Public listings

### `GET /lands`
Query parameters (all optional):

| Param | Type | Notes |
|---|---|---|
| `q` | string | Free-text search across title, description, city |
| `minPrice`, `maxPrice` | number | |
| `minArea`, `maxArea` | number | |
| `status` | `available` \| `pending` \| `sold` | |
| `featured` | boolean | |
| `city`, `state` | string | Exact match, case-insensitive |
| `sort` | `newest` \| `price_asc` \| `price_desc` \| `area_desc` | Default `newest` |
| `page` | integer | Default `1` |
| `limit` | integer | Default `12`, max `48` |

**Response `200`:**
```json
{
  "success": true,
  "data": [ { "_id": "...", "title": "...", "slug": "...", "price": 8500000, "areaValue": 2, "areaUnit": "acre", "city": "Mysuru", "state": "Karnataka", "status": "available", "featured": true, "coverImageUrl": "..." } ],
  "meta": { "page": 1, "limit": 12, "total": 5, "pages": 1 }
}
```

### `GET /lands/:slug`
Returns a single published listing with its images.

**Response `200`:**
```json
{ "success": true, "data": { "_id": "...", "title": "...", "slug": "...", "description": "...", "price": 8500000, "images": [ { "_id": "...", "imageUrl": "...", "sortOrder": 0 } ], "highlights": ["..."], "latitude": 12.29, "longitude": 76.63 } }
```

**Errors:** `404 NOT_FOUND` if the slug doesn't exist or the listing isn't published.

### `GET /settings/public`
Public subset of site settings — no auth required.

**Response `200`:**
```json
{ "success": true, "data": { "siteName": "YOUR OWN", "defaultWhatsappNumber": "919876543210", "heroHeadline": "...", "heroSubheadline": "...", "socialLinks": { "instagram": "...", "facebook": "" } } }
```

### `POST /inquiries`
Rate-limited (default 30/hour/IP). Logs WhatsApp-click intent. Fire-and-forget from the frontend's perspective.

**Body:**
```json
{ "landId": "...", "messagePreview": "Want to Buy — 2 Acre Farmland" }
```

**Response `201`:**
```json
{ "success": true, "data": { "logged": true } }
```

---

## Land Market Analytics

Public, read-only, rate-limited (60 req/min/IP). Backed by paid `Deal` records within a radius of a point — see `docs/PHASE_1_ARCHITECTURE.md`-style note below on why there's no separate sales table.

> Sales data comes from the existing `Deal` model (a deal with `status: "paid"` *is* a completed sale — it already stores final price, buyer/seller, and a `soldDate` set the moment it's marked paid). Analytics is computed on top of that instead of duplicating it into a new `LandSales` collection.

### `GET /analytics/land/:landId`
Market analytics for the area around a specific listing.

| Param | Type | Notes |
|---|---|---|
| `radius` | number | Kilometers, default `5`, min `0.5`, max `50` |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "sold30Days": 3,
    "sold1Year": 21,
    "lifetimeSold": 64,
    "averagePrice": 4850000,
    "highestSale": 12600000,
    "lowestSale": 920000,
    "averagePricePerSqFt": 2450.5,
    "priceGrowth": 12.7,
    "priceTrend": { "priorWindowAvg": 4300000, "recentWindowAvg": 4850000 },
    "demand": "High",
    "activeListings": 18,
    "soldVsActive": 1.17,
    "lastSaleDate": "2026-07-18T00:00:00.000Z",
    "nearbySoldProperties": [
      { "landId": "...", "title": "...", "slug": "...", "city": "...", "state": "...", "latitude": 12.29, "longitude": 76.63, "soldPrice": 4850000, "soldDate": "2026-07-18T00:00:00.000Z" }
    ]
  }
}
```

Notes:
- `priceGrowth` and `averagePricePerSqFt` are `null` (not `0`) when there isn't enough sale history to compute them — the UI must distinguish "no data yet" from "0% growth."
- `averagePricePerSqFt` only averages sales measured in a directly convertible unit (sqft, sqyd, acre, hectare); sales measured in `bigha` are excluded, since bigha's real-world size varies several-fold by state with no fixed conversion.
- A listing with no `latitude`/`longitude` returns a well-formed response with all counts at `0`/`null`, not an error.
- Cached in-process for 5 minutes; a deal changing status invalidates the cache for its listing immediately.
- **Errors:** `404 NOT_FOUND` if the listing doesn't exist, `422 VALIDATION_ERROR` for a bad `radius`.

### `GET /analytics/location`
Same response shape as above, for an arbitrary point instead of a listing.

| Param | Type | Notes |
|---|---|---|
| `latitude` | number | Required, `-90`–`90` |
| `longitude` | number | Required, `-180`–`180` |
| `radius` | number | Kilometers, default `5`, min `0.5`, max `50` |

---

## Admin — Listings

All endpoints below require `Authorization: Bearer <accessToken>` with role `admin`.

### `GET /admin/lands`
Same query parameters as the public `/lands` endpoint, but returns listings of every status,
including unpublished ones, with full field data.

### `POST /admin/lands`
Creates a new listing. The server generates the `slug` (immutable afterward) and sets `createdBy`
from the authenticated user — these cannot be supplied by the client.

**Body:**
```json
{
  "title": "2 Acre Riverside Farmland",
  "description": "A quiet, well-irrigated plot...",
  "price": 8500000,
  "areaValue": 2,
  "areaUnit": "acre",
  "address": "Survey No. 142, Off Mysuru Road",
  "city": "Mysuru",
  "state": "Karnataka",
  "postalCode": "570001",
  "latitude": 12.2958,
  "longitude": 76.6394,
  "status": "available",
  "featured": true,
  "whatsappNumberOverride": "919876543210",
  "highlights": ["Borewell on site", "Clear title"]
}
```
Only `title`, `description`, `price`, `areaValue`, `areaUnit`, `address`, `city`, `state` are required.

**Response `201`:** the created land document.

### `GET /admin/lands/:id`
**Response `200`:**
```json
{ "success": true, "data": { "land": { ... }, "images": [ { ... } ] } }
```

### `PATCH /admin/lands/:id`
Partial update — send only the fields you want to change. `slug` cannot be changed via this
endpoint (it's immutable after creation, by design, so previously shared WhatsApp links never break).

### `DELETE /admin/lands/:id`
Deletes the listing and all its images, including their S3 objects (best-effort cleanup).

**Response `200`:**
```json
{ "success": true, "data": { "deleted": true } }
```

---

## Admin — Images

### `POST /admin/lands/:id/images/presign`
Requests presigned upload URLs. Enforces the 10-image-per-listing cap server-side before
issuing any URL.

**Body:**
```json
{ "files": [ { "fileName": "plot-1.jpg", "contentType": "image/jpeg", "fileSizeBytes": 2456789 } ] }
```

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "fileName": "plot-1.jpg",
      "storageKey": "lands/<landId>/<uuid>.jpg",
      "uploadUrl": "https://your-own-land-images.s3.amazonaws.com/...(presigned, expires in 5 min)",
      "publicUrl": "https://your-own-land-images.s3.amazonaws.com/lands/<landId>/<uuid>.jpg",
      "expiresInSeconds": 300
    }
  ]
}
```
The client then `PUT`s the raw file bytes directly to `uploadUrl`.

### `POST /admin/lands/:id/images/confirm`
Call after the direct-to-S3 upload succeeds, to persist the image's metadata.

**Body:**
```json
{ "storageKey": "lands/<landId>/<uuid>.jpg", "imageUrl": "https://.../<uuid>.jpg", "altText": "", "width": 1600, "height": 1200 }
```

**Response `201`:** the created `LandImage` document.

### `PATCH /admin/lands/:id/images/reorder`
**Body:**
```json
{ "order": [ { "imageId": "...", "sortOrder": 0 }, { "imageId": "...", "sortOrder": 1 } ] }
```
Rejects the entire request if any `imageId` doesn't belong to this listing.

### `DELETE /admin/lands/:id/images/:imageId`
Deletes the image from both S3 and the database.

---

## Admin — Settings

### `GET /admin/settings`
Returns the full settings document (including fields not exposed by `/settings/public`).

### `PUT /admin/settings`
Upserts the settings singleton.

**Body:**
```json
{
  "siteName": "YOUR OWN",
  "defaultWhatsappNumber": "919876543210",
  "contactEmail": "hello@yourown.com",
  "heroHeadline": "Land worth owning.",
  "heroSubheadline": "Carefully verified plots, presented honestly, sold directly.",
  "socialLinks": { "instagram": "https://instagram.com/...", "facebook": "" }
}
```
`defaultWhatsappNumber` is required and must be digits only (E.164 without the `+`).

---

## Postman collection

A ready-to-import Postman collection covering every endpoint above is at
[`docs/postman_collection.json`](postman_collection.json). Import it, then set the collection
variable `baseUrl` (default `http://localhost:5000/api/v1`) and `accessToken` (populate after
calling Login) to use it.
