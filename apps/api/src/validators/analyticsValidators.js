import { z } from 'zod';
import {
  ANALYTICS_TOGGLE_KEYS,
  ANALYTICS_MANUAL_VALUE_KEYS,
  CHART_TYPE_VALUES,
} from '@your-own/shared';

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

const toggleShape = ANALYTICS_TOGGLE_KEYS.reduce((shape, key) => {
  shape[key] = z.boolean().optional();
  return shape;
}, {});

const manualValueShape = ANALYTICS_MANUAL_VALUE_KEYS.reduce((shape, key) => {
  shape[key] = key === 'manualDemand' ? z.string().trim().max(40).nullable().optional() : z.number().nullable().optional();
  return shape;
}, {});

const demandTierSchema = z.object({
  max: z.number().positive().nullable(),
  label: z.string().trim().min(1).max(40),
});

export const updateAnalyticsSettingsSchema = z.object({
  body: z
    .object({
      manualMode: z.boolean().optional(),
      growthUseManual: z.boolean().optional(),
      demandFormula: z.array(demandTierSchema).min(1).optional(),
      chartTypes: z
        .object(CHART_TYPE_VALUES.reduce((shape, type) => ({ ...shape, [type]: z.boolean().optional() }), {}))
        .optional(),
      ...toggleShape,
      ...manualValueShape,
    })
    .strict(),
});
