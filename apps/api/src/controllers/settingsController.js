import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import * as settingsService from '../services/settingsService.js';

export const getPublicSettings = asyncHandler(async (_req, res) => {
  const settings = await settingsService.getPublicSettings();
  sendSuccess(res, { data: settings });
});

export const getAdminSettings = asyncHandler(async (_req, res) => {
  const settings = await settingsService.getSettings();
  sendSuccess(res, { data: settings });
});

export const updateAdminSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSettings(req.body);
  sendSuccess(res, { data: settings });
});
