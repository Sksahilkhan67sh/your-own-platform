import mongoose from 'mongoose';
import { Land } from '../../models/Land.js';
import { Deal } from '../../models/Deal.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Finds land ids within radiusKm of a coordinate, using the 2dsphere index
 * on Land.location (a single indexed geo query — not a full collection
 * scan with haversine math in JS).
 * @returns {Promise<string[]>} land ids, including the origin land itself if it matches
 */
export async function findNearbyLandIds({ latitude, longitude, radiusKm, excludeLandId } = {}) {
  const query = {
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [longitude, latitude] },
        $maxDistance: radiusKm * 1000,
      },
    },
  };
  if (excludeLandId) query._id = { $ne: excludeLandId };

  const lands = await Land.find(query).select('_id').lean();
  return lands.map((l) => l._id.toString());
}

/**
 * Aggregated sale statistics (paid deals only) across a set of land ids,
 * computed in a single pipeline via $facet so Mongo does the counting/
 * averaging work instead of pulling every deal into Node and reducing
 * over it — this is the piece most exposed to N+1 / full-scan risk if
 * done naively.
 */
export async function getSalesStats(landIds, { now = new Date() } = {}) {
  if (landIds.length === 0) return emptySalesStats();

  const objectIds = toObjectIds(landIds);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const oneYearAgo = new Date(now.getTime() - 365 * DAY_MS);
  const oneEightyDaysAgo = new Date(now.getTime() - 180 * DAY_MS);
  const threeSixtyDaysAgo = new Date(now.getTime() - 360 * DAY_MS);

  const [result] = await Deal.aggregate([
    { $match: { land: { $in: objectIds }, status: 'paid', soldDate: { $ne: null, $lte: now } } },
    {
      $facet: {
        sold30Days: [{ $match: { soldDate: { $gte: thirtyDaysAgo } } }, { $count: 'count' }],
        sold1Year: [{ $match: { soldDate: { $gte: oneYearAgo } } }, { $count: 'count' }],
        lifetime: [{ $count: 'count' }],
        priceStats: [
          {
            $group: {
              _id: null,
              averagePrice: { $avg: '$finalPrice' },
              highestSale: { $max: '$finalPrice' },
              lowestSale: { $min: '$finalPrice' },
            },
          },
        ],
        lastSale: [{ $sort: { soldDate: -1 } }, { $limit: 1 }, { $project: { soldDate: 1, finalPrice: 1, land: 1 } }],
        recentWindow: [
          { $match: { soldDate: { $gte: oneEightyDaysAgo } } },
          { $group: { _id: null, avgPrice: { $avg: '$finalPrice' } } },
        ],
        priorWindow: [
          { $match: { soldDate: { $gte: threeSixtyDaysAgo, $lt: oneEightyDaysAgo } } },
          { $group: { _id: null, avgPrice: { $avg: '$finalPrice' } } },
        ],
        // Raw finalPrice + the sold land's areaValue, for price-per-unit-area —
        // finalPrice alone can't give that, we need each sale's land size too.
        salesWithArea: [
          {
            $lookup: {
              from: 'lands',
              localField: 'land',
              foreignField: '_id',
              as: 'landDoc',
            },
          },
          { $unwind: '$landDoc' },
          { $project: { finalPrice: 1, areaValue: '$landDoc.areaValue', areaUnit: '$landDoc.areaUnit' } },
        ],
      },
    },
  ]);

  return {
    sold30Days: result.sold30Days[0]?.count || 0,
    sold1Year: result.sold1Year[0]?.count || 0,
    lifetimeSold: result.lifetime[0]?.count || 0,
    averagePrice: round(result.priceStats[0]?.averagePrice),
    highestSale: round(result.priceStats[0]?.highestSale),
    lowestSale: round(result.priceStats[0]?.lowestSale),
    lastSaleDate: result.lastSale[0]?.soldDate || null,
    recentWindowAvg: round(result.recentWindow[0]?.avgPrice),
    priorWindowAvg: round(result.priorWindow[0]?.avgPrice),
    salesWithArea: result.salesWithArea.map((s) => ({
      finalPrice: s.finalPrice,
      areaValue: s.areaValue,
      areaUnit: s.areaUnit,
    })),
  };
}

/** Currently-active (still on-market) listings among a set of land ids. */
export async function getActiveListingsCount(landIds) {
  if (landIds.length === 0) return 0;
  return Land.countDocuments({
    _id: { $in: toObjectIds(landIds) },
    status: { $in: ['available', 'pending'] },
    publishedAt: { $ne: null },
  });
}

/**
 * Most recent sold properties among a set of land ids, joined with their
 * listing summary — used for the "Nearby Sold Properties" list/map.
 */
export async function getRecentNearbySales(landIds, { limit = 12 } = {}) {
  if (landIds.length === 0) return [];

  return Deal.aggregate([
    { $match: { land: { $in: toObjectIds(landIds) }, status: 'paid', soldDate: { $ne: null } } },
    { $sort: { soldDate: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'lands',
        localField: 'land',
        foreignField: '_id',
        as: 'landDoc',
      },
    },
    { $unwind: '$landDoc' },
    {
      $project: {
        _id: 0,
        landId: '$landDoc._id',
        title: '$landDoc.title',
        slug: '$landDoc.slug',
        city: '$landDoc.city',
        state: '$landDoc.state',
        latitude: '$landDoc.latitude',
        longitude: '$landDoc.longitude',
        soldPrice: '$finalPrice',
        soldDate: 1,
      },
    },
  ]);
}

export async function getLandById(landId) {
  return Land.findById(landId).select('title slug latitude longitude city state areaValue status').lean();
}

function toObjectIds(ids) {
  return ids.map((id) => new mongoose.Types.ObjectId(id));
}

function round(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  return Math.round(n);
}

function emptySalesStats() {
  return {
    sold30Days: 0,
    sold1Year: 0,
    lifetimeSold: 0,
    averagePrice: null,
    highestSale: null,
    lowestSale: null,
    lastSaleDate: null,
    recentWindowAvg: null,
    priorWindowAvg: null,
    salesWithArea: [],
  };
}
