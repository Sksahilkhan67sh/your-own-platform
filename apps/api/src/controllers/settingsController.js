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

// ---- Branding (same Settings singleton, dedicated endpoints per the
// Admin Branding Management spec: GET/PUT /admin/branding) ----

export const getAdminBranding = asyncHandler(async (_req, res) => {
  const branding = await settingsService.getBranding();
  sendSuccess(res, { data: branding });
});

export const updateAdminBranding = asyncHandler(async (req, res) => {
  const branding = await settingsService.updateBranding(req.body);
  sendSuccess(res, { data: branding });
});

export const presignBrandingUpload = asyncHandler(async (req, res) => {
  const presigned = await settingsService.presignBrandingUpload(req.body);
  sendSuccess(res, { data: presigned });
});

export const confirmBrandingUpload = asyncHandler(async (req, res) => {
  const branding = await settingsService.confirmBrandingUpload(req.body);
  sendSuccess(res, { data: branding });
});
