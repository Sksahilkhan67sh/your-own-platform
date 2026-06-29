import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import * as landService from '../services/landService.js';
import * as s3Service from '../services/s3Service.js';
import { Inquiry } from '../models/Inquiry.js';
import { ApiError } from '../utils/ApiError.js';
import { sendInquiryNotification } from '../services/emailService.js';
import { getSettings } from '../services/settingsService.js';

// ---------- Public ----------

export const listPublicLands = asyncHandler(async (req, res) => {
  const { items, meta } = await landService.listLands(req.query, { publicOnly: true });
  sendSuccess(res, { data: items, meta });
});

export const getPublicLandBySlug = asyncHandler(async (req, res) => {
  const land = await landService.getLandBySlugPublic(req.params.slug);
  sendSuccess(res, { data: land });
});

export const createInquiry = asyncHandler(async (req, res) => {
  const { landId, messagePreview } = req.body;

  // Verify the land actually exists and is publicly visible before logging
  // an inquiry against it — never trust a client-supplied landId blindly.
  const land = await landService.getLandByIdAdmin(landId).catch(() => null);
  if (!land || !land.land.publishedAt) {
    throw ApiError.notFound('Listing not found');
  }

  await Inquiry.create({ land: landId, messagePreview });

  // Best-effort notification — runs in the background, never blocks or
  // fails the actual inquiry log, and never delays the response sent back
  // to the buyer's browser (which is waiting to redirect to WhatsApp).
  getSettings()
    .then((settings) => {
      if (settings.contactEmail) {
        sendInquiryNotification({
          adminEmail: settings.contactEmail,
          landTitle: land.land.title,
          landSlug: land.land.slug,
          messagePreview,
        });
      }
    })
    .catch(() => null);

  sendSuccess(res, { statusCode: 201, data: { logged: true } });
});

// ---------- Admin ----------

export const listAdminLands = asyncHandler(async (req, res) => {
  const { items, meta } = await landService.listLands(req.query, { publicOnly: false });
  sendSuccess(res, { data: items, meta });
});

export const getAdminLandById = asyncHandler(async (req, res) => {
  const result = await landService.getLandByIdAdmin(req.params.id);
  sendSuccess(res, { data: result });
});

export const createLand = asyncHandler(async (req, res) => {
  const land = await landService.createLand(req.body, req.user.id);
  sendSuccess(res, { statusCode: 201, data: land });
});

export const updateLand = asyncHandler(async (req, res) => {
  const land = await landService.updateLand(req.params.id, req.body);
  sendSuccess(res, { data: land });
});

export const deleteLand = asyncHandler(async (req, res) => {
  await landService.deleteLand(req.params.id);
  sendSuccess(res, { data: { deleted: true } });
});

export const presignLandImages = asyncHandler(async (req, res) => {
  // Confirm the land exists before issuing any presigned URLs — prevents
  // generating valid upload URLs for a non-existent or already-deleted listing.
  await landService.getLandByIdAdmin(req.params.id);

  const presigned = await s3Service.presignLandImageUploads(req.params.id, req.body.files);
  sendSuccess(res, { data: presigned });
});

export const confirmLandImage = asyncHandler(async (req, res) => {
  await landService.getLandByIdAdmin(req.params.id);

  const image = await s3Service.confirmLandImage(req.params.id, req.body);
  sendSuccess(res, { statusCode: 201, data: image });
});

export const deleteLandImage = asyncHandler(async (req, res) => {
  await s3Service.deleteLandImage(req.params.id, req.params.imageId);
  sendSuccess(res, { data: { deleted: true } });
});

export const reorderLandImages = asyncHandler(async (req, res) => {
  await s3Service.reorderLandImages(req.params.id, req.body.order);
  sendSuccess(res, { data: { reordered: true } });
});
