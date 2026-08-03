import { z } from 'zod';

// Reused for both endpoints — kept small and clamped since a huge radius
// turns the geo query + downstream aggregation into a near-full-collection
// scan.
const radiusSchema = z.coerce.number().min(0.5).max(50).default(5);

export const landAnalyticsSchema = z.object({
  params: z.object({
    landId: z.string().trim().min(1),
  }),
  query: z.object({
    radius: radiusSchema,
  }),
});

export const locationAnalyticsSchema = z.object({
  query: z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    radius: radiusSchema,
  }),
});
