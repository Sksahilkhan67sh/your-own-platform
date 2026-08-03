import { ApiError } from '../../utils/ApiError.js';
import * as repo from './analyticsRepository.js';
import { getCached, setCached, invalidateLand } from './analyticsCache.js';
import {
  computePriceGrowth,
  computeAveragePricePerUnit,
  computeDemandLevel,
  computeSoldVsActiveRatio,
} from './analyticsCalculator.js';

const DEFAULT_RADIUS_KM = 5;

/**
 * GET /api/v1/analytics/land/:landId
 * Analytics for the market immediately around a specific listing.
 */
export async function getLandAnalytics(landId, { radiusKm = DEFAULT_RADIUS_KM } = {}) {
  const cacheKey = `land:${landId}:r${radiusKm}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const land = await repo.getLandById(landId);
  if (!land) throw ApiError.notFound('Listing not found');

  if (typeof land.latitude !== 'number' || typeof land.longitude !== 'number') {
    // A listing without coordinates has no "nearby" market to analyze —
    // this is a legitimate, expected state (not an error), so the caller
    // gets a well-formed empty response rather than a 4xx/5xx.
    const empty = buildResponse({ sales: emptySales(), activeListings: 0, nearby: [] });
    setCached(cacheKey, empty);
    return empty;
  }

  const result = await computeForLocation({
    latitude: land.latitude,
    longitude: land.longitude,
    radiusKm,
    excludeLandId: null, // include the land's own sale history in its own stats
  });

  setCached(cacheKey, result);
  return result;
}

/**
 * GET /api/v1/analytics/location?latitude=&longitude=&radius=
 * Analytics for an arbitrary point (no specific listing required).
 */
export async function getLocationAnalytics({ latitude, longitude, radiusKm = DEFAULT_RADIUS_KM }) {
  const cacheKey = `location:${latitude.toFixed(4)}:${longitude.toFixed(4)}:r${radiusKm}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const result = await computeForLocation({ latitude, longitude, radiusKm, excludeLandId: null });
  setCached(cacheKey, result);
  return result;
}

async function computeForLocation({ latitude, longitude, radiusKm, excludeLandId }) {
  const nearbyLandIds = await repo.findNearbyLandIds({ latitude, longitude, radiusKm, excludeLandId });

  const [sales, activeListings, nearby] = await Promise.all([
    repo.getSalesStats(nearbyLandIds),
    repo.getActiveListingsCount(nearbyLandIds),
    repo.getRecentNearbySales(nearbyLandIds, { limit: 12 }),
  ]);

  return buildResponse({ sales, activeListings, nearby });
}

function buildResponse({ sales, activeListings, nearby }) {
  const priceGrowth = computePriceGrowth(sales.recentWindowAvg, sales.priorWindowAvg);
  const averagePricePerSqFt = computeAveragePricePerUnit(sales.salesWithArea);
  const soldVsActive = computeSoldVsActiveRatio(sales.sold1Year, activeListings);
  const demand = computeDemandLevel({
    sold30Days: sales.sold30Days,
    soldVsActiveRatio: soldVsActive || 0,
    priceGrowth,
  });

  return {
    sold30Days: sales.sold30Days,
    sold1Year: sales.sold1Year,
    lifetimeSold: sales.lifetimeSold,
    averagePrice: sales.averagePrice,
    highestSale: sales.highestSale,
    lowestSale: sales.lowestSale,
    averagePricePerSqFt,
    priceGrowth,
    priceTrend: { priorWindowAvg: sales.priorWindowAvg, recentWindowAvg: sales.recentWindowAvg },
    demand,
    activeListings,
    soldVsActive,
    lastSaleDate: sales.lastSaleDate,
    nearbySoldProperties: nearby,
  };
}

function emptySales() {
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

/** Called by dealService whenever a deal's status changes, so analytics
 * reflect a new sale immediately instead of waiting out the cache TTL. */
export function invalidateAnalyticsForLand(landId) {
  invalidateLand(landId);
}
