import { AnalyticsSettings } from '../../models/AnalyticsSettings.js';
import { getCached, setCached, invalidate } from '../settingsCache.js';
import { DEMAND_TIER_DEFAULTS } from '@your-own/shared';

const SINGLETON_ID = 'singleton';
const CACHE_KEY = 'analyticsSettings:singleton';

/** Reads (creating with defaults on first access, so there's no separate
 * seed step required for this collection) the singleton settings doc. */
export async function getAnalyticsSettings() {
  const cached = getCached(CACHE_KEY);
  if (cached) return cached;

  let settings = await AnalyticsSettings.findById(SINGLETON_ID);
  if (!settings) {
    settings = await AnalyticsSettings.create({ _id: SINGLETON_ID });
  }

  setCached(CACHE_KEY, settings);
  return settings;
}

export async function updateAnalyticsSettings(payload) {
  const settings = await AnalyticsSettings.findByIdAndUpdate(
    SINGLETON_ID,
    { $set: payload },
    { new: true, upsert: true, runValidators: true }
  );
  invalidate(CACHE_KEY);
  return settings;
}

/**
 * A single 0-1000ish "demand score" derived from the same raw signals
 * analyticsCalculator.computeDemandLevel() already uses, but kept as a
 * plain number here (rather than calculator's internal 0-6 point scale)
 * specifically so it can be run through an admin-configurable formula —
 * see demandFormula on AnalyticsSettings. Deliberately independent of
 * analyticsCalculator so that file's existing tests/behavior are untouched.
 */
function computeDemandScore({ sold30Days = 0, soldVsActiveRatio = 0, priceGrowth = null }) {
  const growth = priceGrowth ?? 0;
  const score = sold30Days * 20 + soldVsActiveRatio * 150 + Math.max(growth, 0) * 10;
  return Math.round(Math.max(0, score));
}

/** Classifies a numeric score against admin-configured tiers, ascending by
 * `max`, with a null `max` tier treated as "and above" (matched last). */
function classifyByFormula(score, tiers) {
  const list = Array.isArray(tiers) && tiers.length > 0 ? tiers : DEMAND_TIER_DEFAULTS;
  const bounded = list.filter((t) => t.max !== null).sort((a, b) => a.max - b.max);
  const openEnded = list.find((t) => t.max === null);

  for (const tier of bounded) {
    if (score <= tier.max) return tier.label;
  }
  return openEnded ? openEnded.label : bounded[bounded.length - 1]?.label || 'Low';
}

function clampScore(n, min, max) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

/**
 * Applies admin-configured visibility toggles, manual value overrides, and
 * the custom demand formula to a raw analytics response (as returned by
 * analyticsService.getLandAnalytics / getLocationAnalytics) before it's
 * sent to a viewer. Hidden fields are set to `undefined` (dropped from the
 * JSON response entirely, not just null) so a viewer truly cannot see them
 * — including via the network tab.
 *
 * @param {object} raw - analyticsService's buildResponse() output
 * @returns {Promise<object>} the same shape, filtered/overridden, plus a
 *   `visibility` map so the frontend doesn't have to re-derive which
 *   panels are enabled from which fields are present.
 */
export async function applyViewerSettings(raw) {
  const s = await getAnalyticsSettings();

  const priceGrowth = s.growthUseManual && s.manualGrowth !== null ? s.manualGrowth : raw.priceGrowth;

  let demand = raw.demand;
  let investmentScore = null;
  if (s.manualMode && s.manualDemand) {
    demand = s.manualDemand;
  } else {
    const score = computeDemandScore({
      sold30Days: raw.sold30Days,
      soldVsActiveRatio: raw.soldVsActive || 0,
      priceGrowth,
    });
    demand = classifyByFormula(score, s.demandFormula);
  }
  investmentScore =
    s.manualMode && s.manualInvestmentScore !== null
      ? s.manualInvestmentScore
      : clampScore(
          computeDemandScore({ sold30Days: raw.sold30Days, soldVsActiveRatio: raw.soldVsActive || 0, priceGrowth }) /
            10,
          0,
          100
        );

  const manual = (key, fallback) => (s.manualMode && s[key] !== null && s[key] !== undefined ? s[key] : fallback);

  const result = {
    sold30Days: s.showMonthlySales ? manual('manualMonthlySales', raw.sold30Days) : undefined,
    sold1Year: s.showYearlySales ? manual('manualYearlySales', raw.sold1Year) : undefined,
    lifetimeSold: s.showLifetimeSales ? manual('manualLifetimeSales', raw.lifetimeSold) : undefined,
    averagePrice: s.showAveragePrice ? manual('manualAveragePrice', raw.averagePrice) : undefined,
    averagePricePerSqFt: s.showAveragePrice ? raw.averagePricePerSqFt : undefined,
    highestSale: s.showHighestPrice ? manual('manualHighestPrice', raw.highestSale) : undefined,
    lowestSale: s.showLowestPrice ? manual('manualLowestPrice', raw.lowestSale) : undefined,
    priceGrowth: s.showGrowth ? manual('manualGrowth', priceGrowth) : undefined,
    priceTrend: s.showGrowth ? raw.priceTrend : undefined,
    demand: s.showDemand ? demand : undefined,
    investmentScore: s.showInvestmentScore ? investmentScore : undefined,
    activeListings: s.showActiveListings ? raw.activeListings : undefined,
    soldVsActive: s.showSoldVsActiveRatio ? raw.soldVsActive : undefined,
    lastSaleDate: raw.lastSaleDate,
    nearbySoldProperties: s.showNearbySales
      ? manual('manualNearbySales', raw.nearbySoldProperties)
      : undefined,
    visibility: {
      charts: s.showCharts,
      heatmap: s.showHeatmap,
      chartTypes: s.chartTypes,
    },
  };

  // Strip undefined keys so hidden analytics are truly absent from the
  // JSON payload, not just falsy.
  Object.keys(result).forEach((key) => result[key] === undefined && delete result[key]);
  return result;
}
