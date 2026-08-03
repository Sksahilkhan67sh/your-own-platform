/**
 * Pure calculation helpers for Land Market Analytics.
 *
 * Deliberately free of any DB/Mongoose imports — analyticsRepository.js
 * fetches raw numbers, analyticsService.js orchestrates, and everything
 * that's actually "logic" (growth %, demand classification, per-sqft
 * price) lives here where it can be unit tested without a database.
 */

/**
 * Percentage change between two averages (e.g. last 6 months vs the
 * previous 6 months). Returns null — not 0 — when there's no prior-period
 * data to compare against, since 0% growth and "unknown" are different
 * facts and callers/UI must be able to tell them apart.
 */
export function computePriceGrowth(recentAvg, priorAvg) {
  if (!isFinitePositive(priorAvg)) return null;
  if (!isFinitePositive(recentAvg)) recentAvg = 0;
  const growth = ((recentAvg - priorAvg) / priorAvg) * 100;
  return Math.round(growth * 10) / 10; // one decimal place
}

// Standard conversions to sq. ft. 'bigha' is deliberately omitted — its
// size varies by a factor of several times between Indian states with no
// single standard, so silently guessing a conversion would produce a
// confidently wrong number. Sales in bigha are excluded from the
// price-per-sqft average rather than mis-converted (see
// computeAveragePricePerUnit below).
const SQFT_PER_UNIT = Object.freeze({
  sqft: 1,
  sqyd: 9,
  acre: 43560,
  hectare: 107639,
});

/**
 * Average price per sq. ft. across a set of sales, converting each sale's
 * area to sq. ft. first so an acre-priced sale and a sqft-priced sale
 * don't get blended into a meaningless number. Sales in an unconvertible
 * unit (bigha) or missing data are excluded, not zero-filled.
 * @param {{ finalPrice: number, areaValue: number, areaUnit: string }[]} sales
 */
export function computeAveragePricePerUnit(sales) {
  const valid = sales
    .filter((s) => isFinitePositive(s.finalPrice) && isFinitePositive(s.areaValue) && SQFT_PER_UNIT[s.areaUnit])
    .map((s) => s.finalPrice / (s.areaValue * SQFT_PER_UNIT[s.areaUnit]));

  if (valid.length === 0) return null;
  const total = valid.reduce((sum, pricePerSqFt) => sum + pricePerSqFt, 0);
  return Math.round((total / valid.length) * 100) / 100;
}

const DEMAND_LEVELS = Object.freeze({
  VERY_HIGH: 'Very High',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
});

/**
 * Classifies demand from three independent signals:
 *  - sold30Days: raw sales velocity in the last month
 *  - soldVsActiveRatio: sold-in-last-year ÷ currently-active-listings
 *    (>1 means the area is selling faster than new supply appears)
 *  - priceGrowth: recent price trend (null is treated as neutral/0)
 *
 * Each signal contributes 0-2 points; the total (0-6) maps to a label.
 * Thresholds are intentionally conservative/documented here rather than
 * scattered across the codebase, so they're the one place to tune.
 */
export function computeDemandLevel({ sold30Days = 0, soldVsActiveRatio = 0, priceGrowth = null }) {
  let score = 0;

  if (sold30Days >= 20) score += 2;
  else if (sold30Days >= 5) score += 1;

  if (soldVsActiveRatio >= 2) score += 2;
  else if (soldVsActiveRatio >= 0.75) score += 1;

  const growth = priceGrowth ?? 0;
  if (growth >= 8) score += 2;
  else if (growth >= 2) score += 1;

  if (score >= 5) return DEMAND_LEVELS.VERY_HIGH;
  if (score >= 3) return DEMAND_LEVELS.HIGH;
  if (score >= 1) return DEMAND_LEVELS.MEDIUM;
  return DEMAND_LEVELS.LOW;
}

export function computeSoldVsActiveRatio(sold1Year, activeListings) {
  if (!isFinitePositive(activeListings)) return sold1Year > 0 ? null : 0;
  return Math.round((sold1Year / activeListings) * 100) / 100;
}

function isFinitePositive(n) {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}

export { DEMAND_LEVELS };
