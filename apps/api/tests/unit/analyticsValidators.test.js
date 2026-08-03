import { test } from 'node:test';
import assert from 'node:assert/strict';
import { landAnalyticsSchema, locationAnalyticsSchema } from '../../src/validators/analyticsValidators.js';

test('landAnalyticsSchema accepts a bare landId and defaults the radius', () => {
  const result = landAnalyticsSchema.safeParse({ params: { landId: 'abc123' }, query: {} });
  assert.equal(result.success, true);
  assert.equal(result.data.query.radius, 5);
});

test('landAnalyticsSchema rejects a radius above the cap (edge case: abuse/DoS via huge radius)', () => {
  const result = landAnalyticsSchema.safeParse({ params: { landId: 'abc123' }, query: { radius: '5000' } });
  assert.equal(result.success, false);
});

test('landAnalyticsSchema rejects an empty landId', () => {
  const result = landAnalyticsSchema.safeParse({ params: { landId: '' }, query: {} });
  assert.equal(result.success, false);
});

test('locationAnalyticsSchema requires latitude and longitude', () => {
  const result = locationAnalyticsSchema.safeParse({ query: { latitude: '12.9', longitude: '77.5' } });
  assert.equal(result.success, true);
});

test('locationAnalyticsSchema rejects out-of-range coordinates', () => {
  const result = locationAnalyticsSchema.safeParse({ query: { latitude: '200', longitude: '77.5' } });
  assert.equal(result.success, false);
});

test('locationAnalyticsSchema rejects missing coordinates', () => {
  const result = locationAnalyticsSchema.safeParse({ query: {} });
  assert.equal(result.success, false);
});
