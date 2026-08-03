import mongoose from 'mongoose';
import {
  ANALYTICS_TOGGLE_KEYS,
  ANALYTICS_MANUAL_VALUE_KEYS,
  CHART_TYPE_VALUES,
  DEMAND_TIER_DEFAULTS,
} from '@your-own/shared';

// One Boolean per ANALYTICS_TOGGLE_KEYS entry, all defaulting to true — by
// default every analytics panel that already exists stays visible; admins
// opt OUT of specific ones rather than having to opt everything back in
// after this feature ships.
const toggleFields = ANALYTICS_TOGGLE_KEYS.reduce((fields, key) => {
  fields[key] = { type: Boolean, default: true };
  return fields;
}, {});

// One (nullable) Number per ANALYTICS_MANUAL_VALUE_KEYS entry, used only
// when manualMode is true. manualDemand is a label string, not a number.
const manualFields = ANALYTICS_MANUAL_VALUE_KEYS.reduce((fields, key) => {
  fields[key] = key === 'manualDemand' ? { type: String, default: '' } : { type: Number, default: null };
  return fields;
}, {});

const chartTogglesSchema = new mongoose.Schema(
  CHART_TYPE_VALUES.reduce((fields, chartType) => {
    fields[chartType] = { type: Boolean, default: true };
    return fields;
  }, {}),
  { _id: false }
);

// Admin-configurable demand classification tiers, e.g.
// [{ max: 100, label: 'Low' }, { max: 300, label: 'Medium' }, ...,
//  { max: null, label: 'Very High' }] — null max means "and above".
// Tiers must be evaluated in ascending `max` order (nulls last).
const demandTierSchema = new mongoose.Schema(
  {
    max: { type: Number, default: null }, // null = no upper bound
    label: { type: String, required: true, trim: true, maxlength: 40 },
  },
  { _id: false }
);

const analyticsSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'singleton' },

    ...toggleFields,

    // Master switch: when true, viewer-facing analytics use the manual*
    // fields below instead of live database aggregation.
    manualMode: { type: Boolean, default: false },
    ...manualFields,

    // Demand score → label thresholds, used only when a demand score is
    // being classified (live mode) — manual mode uses manualDemand directly.
    demandFormula: { type: [demandTierSchema], default: () => DEMAND_TIER_DEFAULTS },

    // Price growth: either recompute live (default) or force a fixed %
    // (the fixed % lives in manualGrowth, above, so it's a single source
    // of truth whether reached via manualMode or this override alone).
    growthUseManual: { type: Boolean, default: false },

    chartTypes: { type: chartTogglesSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const AnalyticsSettings = mongoose.model('AnalyticsSettings', analyticsSettingsSchema);
