/**
 * One-off backfill for the Land Market Analytics feature.
 *
 * Run once after deploying this feature (existing docs predate the new
 * Land.location / Deal.soldDate fields, so they need a pass to populate):
 *
 *   node scripts/backfillAnalyticsFields.js
 *
 * Safe to re-run — every write is conditional on the field being unset.
 */
import { env } from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { logger } from '../src/config/logger.js';
import { Land } from '../src/models/Land.js';
import { Deal } from '../src/models/Deal.js';

async function backfillLandLocations() {
  const lands = await Land.find({
    latitude: { $type: 'number' },
    longitude: { $type: 'number' },
    location: { $exists: false },
  }).select('_id latitude longitude');

  let updated = 0;
  for (const land of lands) {
    land.location = { type: 'Point', coordinates: [land.longitude, land.latitude] };
    await land.save();
    updated += 1;
  }
  logger.info({ updated }, 'Backfilled Land.location');
}

async function backfillDealSoldDates() {
  // For already-paid deals with no soldDate, updatedAt is the closest
  // available signal for when they became paid (timestamps was already
  // enabled on Deal, so this is real historical data, not a guess pulled
  // from nothing).
  const result = await Deal.updateMany(
    { status: 'paid', $or: [{ soldDate: { $exists: false } }, { soldDate: null }] },
    [{ $set: { soldDate: '$updatedAt' } }]
  );
  logger.info({ matched: result.matchedCount, modified: result.modifiedCount }, 'Backfilled Deal.soldDate');
}

async function main() {
  await connectDB();
  try {
    await backfillLandLocations();
    await backfillDealSoldDates();
  } finally {
    await disconnectDB();
  }
}

main().catch((err) => {
  logger.error({ err }, 'Backfill failed');
  process.exitCode = 1;
});
