import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computePriceGrowth,
  computeAveragePricePerUnit,
  computeDemandLevel,
  computeSoldVsActiveRatio,
} from '../../src/services/analytics/analyticsCalculator.js';

test('computePriceGrowth returns positive growth when recent > prior', () => {
  assert.equal(computePriceGrowth(1100, 1000), 10);
});

test('computePriceGrowth returns negative growth when recent < prior', () => {
  assert.equal(computePriceGrowth(900, 1000), -10);
});

test('computePriceGrowth returns null with no prior-period data (edge case: one sale / no history)', () => {
  assert.equal(computePriceGrowth(1000, null), null);
  assert.equal(computePriceGrowth(1000, 0), null);
});

test('computePriceGrowth treats a missing recent average as 0 (no recent sales)', () => {
  assert.equal(computePriceGrowth(null, 1000), -100);
});

test('computeAveragePricePerUnit averages price/sqft across valid sales of the same unit', () => {
  const avg = computeAveragePricePerUnit([
    { finalPrice: 1000, areaValue: 10, areaUnit: 'sqft' }, // 100
    { finalPrice: 2000, areaValue: 10, areaUnit: 'sqft' }, // 200
  ]);
  assert.equal(avg, 150);
});

test('computeAveragePricePerUnit converts acre/sqyd sales to sq.ft before averaging (edge case: mixed units)', () => {
  const avg = computeAveragePricePerUnit([
    { finalPrice: 43560, areaValue: 1, areaUnit: 'acre' }, // 43560 sqft -> 1/sqft
    { finalPrice: 9, areaValue: 1, areaUnit: 'sqyd' }, // 9 sqft -> 1/sqft
  ]);
  assert.equal(avg, 1);
});

test('computeAveragePricePerUnit excludes bigha sales rather than guessing a conversion (edge case: no standard bigha size)', () => {
  const avg = computeAveragePricePerUnit([
    { finalPrice: 1000, areaValue: 10, areaUnit: 'sqft' }, // 100
    { finalPrice: 5000, areaValue: 1, areaUnit: 'bigha' }, // excluded
  ]);
  assert.equal(avg, 100);
});

test('computeAveragePricePerUnit skips sales with missing/zero area instead of throwing (edge case: corrupt data)', () => {
  const avg = computeAveragePricePerUnit([
    { finalPrice: 1000, areaValue: 10, areaUnit: 'sqft' }, // 100
    { finalPrice: 2000, areaValue: 0, areaUnit: 'sqft' }, // excluded
    { finalPrice: 500, areaValue: null, areaUnit: 'sqft' }, // excluded
  ]);
  assert.equal(avg, 100);
});

test('computeAveragePricePerUnit returns null for no sales (edge case: no sales)', () => {
  assert.equal(computeAveragePricePerUnit([]), null);
});

test('computeSoldVsActiveRatio divides sold-in-year by active listings', () => {
  assert.equal(computeSoldVsActiveRatio(10, 5), 2);
});

test('computeSoldVsActiveRatio handles zero active listings without dividing by zero (edge case)', () => {
  assert.equal(computeSoldVsActiveRatio(0, 0), 0);
  assert.equal(computeSoldVsActiveRatio(5, 0), null);
});

test('computeDemandLevel classifies a hot market as Very High', () => {
  const demand = computeDemandLevel({ sold30Days: 25, soldVsActiveRatio: 3, priceGrowth: 12 });
  assert.equal(demand, 'Very High');
});

test('computeDemandLevel classifies a quiet market as Low', () => {
  const demand = computeDemandLevel({ sold30Days: 0, soldVsActiveRatio: 0, priceGrowth: null });
  assert.equal(demand, 'Low');
});

test('computeDemandLevel treats null priceGrowth as neutral, not a penalty (edge case: no sale history)', () => {
  const withNull = computeDemandLevel({ sold30Days: 6, soldVsActiveRatio: 1, priceGrowth: null });
  const withZero = computeDemandLevel({ sold30Days: 6, soldVsActiveRatio: 1, priceGrowth: 0 });
  assert.equal(withNull, withZero);
});

test('computeDemandLevel handles the all-empty edge case without throwing', () => {
  assert.equal(computeDemandLevel({}), 'Low');
});
