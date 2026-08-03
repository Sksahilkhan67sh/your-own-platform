import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import * as analyticsService from '../services/analytics/analyticsService.js';

export const getLandAnalytics = asyncHandler(async (req, res) => {
  const { landId } = req.params;
  const { radius } = req.query;
  const data = await analyticsService.getLandAnalytics(landId, { radiusKm: radius });
  sendSuccess(res, { data });
});

export const getLocationAnalytics = asyncHandler(async (req, res) => {
  const { latitude, longitude, radius } = req.query;
  const data = await analyticsService.getLocationAnalytics({ latitude, longitude, radiusKm: radius });
  sendSuccess(res, { data });
});
