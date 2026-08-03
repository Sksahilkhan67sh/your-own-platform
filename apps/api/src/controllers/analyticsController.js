import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import * as analyticsService from '../services/analytics/analyticsService.js';
import * as analyticsSettingsService from '../services/analytics/analyticsSettingsService.js';

export const getLandAnalytics = asyncHandler(async (req, res) => {
  const { landId } = req.params;
  const { radius } = req.query;
  const raw = await analyticsService.getLandAnalytics(landId, { radiusKm: radius });
  const data = await analyticsSettingsService.applyViewerSettings(raw);
  sendSuccess(res, { data });
});

export const getLocationAnalytics = asyncHandler(async (req, res) => {
  const { latitude, longitude, radius } = req.query;
  const raw = await analyticsService.getLocationAnalytics({ latitude, longitude, radiusKm: radius });
  const data = await analyticsSettingsService.applyViewerSettings(raw);
  sendSuccess(res, { data });
});

// ---- Admin: Analytics Management (toggle visibility, manual values, formula) ----

export const getAdminAnalyticsSettings = asyncHandler(async (_req, res) => {
  const settings = await analyticsSettingsService.getAnalyticsSettings();
  sendSuccess(res, { data: settings });
});

export const updateAdminAnalyticsSettings = asyncHandler(async (req, res) => {
  const settings = await analyticsSettingsService.updateAnalyticsSettings(req.body);
  sendSuccess(res, { data: settings });
});
