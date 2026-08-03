import { Land } from '../models/Land.js';
import { LandImage } from '../models/LandImage.js';
import { ApiError } from '../utils/ApiError.js';
import { slugify, withUniqueSuffix, SORT_OPTIONS } from '@your-own/shared';
import { deleteObjectFromS3 } from './s3Service.js';

const SORT_MAP = {
  [SORT_OPTIONS.NEWEST]: { createdAt: -1 },
  [SORT_OPTIONS.PRICE_LOW_HIGH]: { price: 1 },
  [SORT_OPTIONS.PRICE_HIGH_LOW]: { price: -1 },
  [SORT_OPTIONS.AREA]: { areaValue: -1 },
};

function buildFilterQuery(filters, { publicOnly }) {
  const query = {};

  if (publicOnly) {
    // Public browse never reveals listings that haven't been published yet.
    query.publishedAt = { $ne: null };
  }

  if (filters.q) query.$text = { $search: filters.q };
  if (filters.status) query.status = filters.status;
  if (filters.featured !== undefined) query.featured = filters.featured;
  if (filters.city) query.city = new RegExp(`^${escapeRegex(filters.city)}$`, 'i');
  if (filters.state) query.state = new RegExp(`^${escapeRegex(filters.state)}$`, 'i');

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query.price = {};
    if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
  }

  if (filters.minArea !== undefined || filters.maxArea !== undefined) {
    query.areaValue = {};
    if (filters.minArea !== undefined) query.areaValue.$gte = filters.minArea;
    if (filters.maxArea !== undefined) query.areaValue.$lte = filters.maxArea;
  }

  return query;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Attaches `coverImageUrl` (the lowest-sortOrder image per listing) to each
 * land in a list result. Done as a single batched query against LandImage
 * keyed by land id, rather than one query per land — the documented list
 * response (see docs/API_REFERENCE.md) includes `coverImageUrl` and the
 * frontend's ListingCard/dashboard rely on it being present.
 */
async function attachCoverImages(items) {
  if (items.length === 0) return items;

  const landIds = items.map((item) => item._id);
  const images = await LandImage.find({ land: { $in: landIds } })
    .sort({ land: 1, sortOrder: 1 })
    .select('land imageUrl sortOrder')
    .lean();

  const coverByLandId = new Map();
  for (const image of images) {
    const key = image.land.toString();
    // Images are sorted by sortOrder ascending per land, so the first one
    // seen for a given land id is its cover image — skip the rest.
    if (!coverByLandId.has(key)) {
      coverByLandId.set(key, image.imageUrl);
    }
  }

  return items.map((item) => ({
    ...item,
    coverImageUrl: coverByLandId.get(item._id.toString()) || null,
  }));
}

export async function listLands(filters, { publicOnly }) {
  const query = buildFilterQuery(filters, { publicOnly });
  const sort = SORT_MAP[filters.sort] || SORT_MAP[SORT_OPTIONS.NEWEST];
  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const skip = (page - 1) * limit;

  const [rawItems, total] = await Promise.all([
    Land.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Land.countDocuments(query),
  ]);

  const items = await attachCoverImages(rawItems);

  return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function getLandBySlugPublic(slug) {
  const land = await Land.findOne({ slug, publishedAt: { $ne: null } }).lean();
  if (!land) throw ApiError.notFound('Listing not found');

  const images = await LandImage.find({ land: land._id }).sort({ sortOrder: 1 }).lean();
  return { ...land, images };
}

/**
 * Lightweight lookup used only to validate a publicly-supplied landId (e.g.
 * from the /inquiries endpoint) and grab the couple of fields needed for a
 * notification email — without the cost of also loading every image for
 * that listing, which getLandByIdAdmin does and which is unnecessary here.
 */
export async function getPublishedLandSummary(id) {
  return Land.findOne({ _id: id, publishedAt: { $ne: null } })
    .select('title slug')
    .lean()
    .catch(() => null);
}

export async function getLandByIdAdmin(id) {
  const land = await Land.findById(id);
  if (!land) throw ApiError.notFound('Listing not found');

  const images = await LandImage.find({ land: land._id }).sort({ sortOrder: 1 }).lean();
  return { land: land.toJSON ? land.toJSON() : land, images };
}

async function generateUniqueSlug(title) {
  const base = slugify(title);
  const existing = await Land.findOne({ slug: base }).lean();
  if (!existing) return base;
  return withUniqueSuffix(base);
}

export async function createLand(payload, createdByUserId) {
  const slug = await generateUniqueSlug(payload.title);

  const land = await Land.create({
    ...payload,
    slug,
    createdBy: createdByUserId,
    // A listing only counts as "published" (and visible publicly) once it
    // has at least been created through this admin-only path with intent —
    // we set publishedAt immediately on creation since this platform has
    // no separate draft workflow in scope. Kept as an explicit field
    // (rather than relying on createdAt) so a future draft/schedule
    // feature can null this out without a schema change.
    publishedAt: new Date(),
  });

  return land;
}

export async function updateLand(id, payload) {
  const land = await Land.findById(id);
  if (!land) throw ApiError.notFound('Listing not found');

  // Slug is immutable after first publish, even if title changes — this is
  // what keeps already-shared WhatsApp links (which embed the slug) valid
  // forever. Title can change freely; slug cannot.
  const { title, ...rest } = payload;
  if (title !== undefined) land.title = title;
  Object.assign(land, rest);

  await land.save();
  return land;
}

export async function deleteLand(id) {
  const land = await Land.findById(id);
  if (!land) throw ApiError.notFound('Listing not found');

  const images = await LandImage.find({ land: land._id });

  // Best-effort S3 cleanup — if one delete fails we still proceed with the
  // rest, since an orphaned S3 object is a cost/cleanup issue, not a
  // correctness or security issue, and we never want a flaky S3 call to
  // block the admin from deleting a listing.
  await Promise.allSettled(images.map((img) => deleteObjectFromS3(img.storageKey)));

  await LandImage.deleteMany({ land: land._id });
  await land.deleteOne();
}
