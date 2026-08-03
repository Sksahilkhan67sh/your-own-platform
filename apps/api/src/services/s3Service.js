import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { s3Client } from '../config/s3.js';
import { env } from '../config/env.js';
import { LandImage } from '../models/LandImage.js';
import { ApiError } from '../utils/ApiError.js';
import { IMAGE_LIMITS, BRANDING_ASSET_LIMITS, BRANDING_ASSET_TYPE_VALUES } from '@your-own/shared';

const PRESIGN_EXPIRY_SECONDS = 5 * 60; // 5 minutes — long enough to start an upload, short enough to limit URL replay window

function extensionFromContentType(contentType) {
  return (
    {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'image/x-icon': 'ico',
      'image/vnd.microsoft.icon': 'ico',
    }[contentType] || 'bin'
  );
}

/**
 * Issues one presigned PUT URL per requested file, after enforcing the
 * 10-image-per-listing cap server-side. This is the actual enforcement
 * point — a client that ignores the disabled "add image" button in the
 * UI still cannot get this API to hand out an 11th presigned URL.
 *
 * Validation of file type/size happens twice: once here against the
 * declared values (defense in depth, cheap), and again implicitly via the
 * S3 presigned POST policy conditions baked into the signed URL itself
 * (so a client can't lie about content-type/size after the fact and have
 * S3 accept the upload anyway).
 */
export async function presignLandImageUploads(landId, files) {
  const existingCount = await LandImage.countDocuments({ land: landId });
  const remainingSlots = IMAGE_LIMITS.MAX_IMAGES_PER_LAND - existingCount;

  if (files.length > remainingSlots) {
    throw ApiError.badRequest(
      `This listing can have at most ${IMAGE_LIMITS.MAX_IMAGES_PER_LAND} images. ` +
        `${existingCount} already uploaded, ${remainingSlots} slot(s) remaining.`
    );
  }

  for (const file of files) {
    if (!IMAGE_LIMITS.ALLOWED_MIME_TYPES.includes(file.contentType)) {
      throw ApiError.badRequest(`Unsupported file type: ${file.contentType}`);
    }
    if (file.fileSizeBytes > IMAGE_LIMITS.MAX_FILE_SIZE_BYTES) {
      throw ApiError.badRequest(`File too large: ${file.fileName}`);
    }
  }

  const presigned = await Promise.all(
    files.map(async (file) => {
      const ext = extensionFromContentType(file.contentType);
      const storageKey = `lands/${landId}/${randomUUID()}.${ext}`;

      const command = new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: storageKey,
        ContentType: file.contentType,
        ContentLength: file.fileSizeBytes,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: PRESIGN_EXPIRY_SECONDS,
      });

      return {
        fileName: file.fileName,
        storageKey,
        uploadUrl,
        publicUrl: `${env.S3_PUBLIC_BASE_URL}/${storageKey}`,
        expiresInSeconds: PRESIGN_EXPIRY_SECONDS,
      };
    })
  );

  return presigned;
}

/**
 * Persists image metadata after the browser confirms the direct-to-S3
 * upload succeeded. Re-checks the image cap at confirm time too, since
 * presign and confirm are separate requests and a client could otherwise
 * race past the cap by presigning many uploads in parallel before any
 * confirm completes.
 */
export async function confirmLandImage(landId, { storageKey, imageUrl, altText, width, height }) {
  const existingCount = await LandImage.countDocuments({ land: landId });
  if (existingCount >= IMAGE_LIMITS.MAX_IMAGES_PER_LAND) {
    // Clean up the orphaned S3 object since we're rejecting the metadata write.
    await deleteObjectFromS3(storageKey);
    throw ApiError.badRequest(`This listing already has the maximum of ${IMAGE_LIMITS.MAX_IMAGES_PER_LAND} images.`);
  }

  const maxSortOrder = await LandImage.findOne({ land: landId }).sort({ sortOrder: -1 }).select('sortOrder');
  const nextSortOrder = maxSortOrder ? maxSortOrder.sortOrder + 1 : 0;

  const image = await LandImage.create({
    land: landId,
    imageUrl,
    storageKey,
    altText: altText || '',
    width,
    height,
    sortOrder: nextSortOrder,
  });

  return image;
}

export async function deleteObjectFromS3(storageKey) {
  await s3Client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: storageKey }));
}

export async function deleteLandImage(landId, imageId) {
  const image = await LandImage.findOne({ _id: imageId, land: landId });
  if (!image) throw ApiError.notFound('Image not found on this listing');

  await deleteObjectFromS3(image.storageKey);
  await image.deleteOne();
}

// ---------------------------------------------------------------------------
// Branding assets (logos, favicon, login background, OG/Twitter images)
//
// Same presign-then-confirm shape as land images above, but not tied to a
// LandImage document or a per-listing cap: there's exactly one active
// asset per BRANDING_ASSET_TYPE, stored directly on the Settings singleton
// by settingsService once the client confirms the upload succeeded.
// ---------------------------------------------------------------------------

/**
 * Issues a single presigned PUT URL for a branding asset upload.
 * Validates type/size server-side (defense in depth — the presigned PUT
 * itself is not constrained by content-type/length policies here since
 * branding assets, unlike land images, are uploaded one at a time from a
 * settings form rather than in a multi-file batch).
 */
export async function presignBrandingAsset({ assetType, fileName, contentType, fileSizeBytes }) {
  if (!BRANDING_ASSET_TYPE_VALUES.includes(assetType)) {
    throw ApiError.badRequest(`Unknown branding asset type: ${assetType}`);
  }
  if (!BRANDING_ASSET_LIMITS.ALLOWED_MIME_TYPES.includes(contentType)) {
    throw ApiError.badRequest(`Unsupported file type: ${contentType}`);
  }
  if (fileSizeBytes > BRANDING_ASSET_LIMITS.MAX_FILE_SIZE_BYTES) {
    throw ApiError.badRequest(`File too large: ${fileName} (max 5MB)`);
  }

  const ext = extensionFromContentType(contentType);
  // Unique filename per upload (never overwrites a previous asset's S3
  // object, even for the same assetType) — old objects are swept up by
  // deleteBrandingAsset() once the Settings doc no longer references them.
  const storageKey = `branding/${assetType}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: storageKey,
    ContentType: contentType,
    ContentLength: fileSizeBytes,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: PRESIGN_EXPIRY_SECONDS });

  return {
    assetType,
    fileName,
    storageKey,
    uploadUrl,
    publicUrl: `${env.S3_PUBLIC_BASE_URL}/${storageKey}`,
    expiresInSeconds: PRESIGN_EXPIRY_SECONDS,
  };
}

/** Deletes a previous branding asset's S3 object. Safe to call with a
 * blank/undefined key (no-op) since not every asset slot is always set. */
export async function deleteBrandingAssetByUrl(previousUrl) {
  if (!previousUrl) return;
  const prefix = `${env.S3_PUBLIC_BASE_URL}/`;
  if (!previousUrl.startsWith(prefix)) return; // external/manually-set URL, nothing of ours to delete
  const storageKey = previousUrl.slice(prefix.length);
  await deleteObjectFromS3(storageKey).catch(() => null); // best-effort cleanup, never blocks the save
}

export async function reorderLandImages(landId, order) {
  const imageIds = order.map((o) => o.imageId);
  const count = await LandImage.countDocuments({ _id: { $in: imageIds }, land: landId });

  // Object-level authorization check: every imageId in the request must
  // actually belong to this land. If counts don't match, at least one
  // imageId belongs to a different listing (or doesn't exist) — reject the
  // whole batch rather than silently applying the valid subset.
  if (count !== imageIds.length) {
    throw ApiError.badRequest('One or more images do not belong to this listing.');
  }

  await Promise.all(
    order.map(({ imageId, sortOrder }) =>
      LandImage.updateOne({ _id: imageId, land: landId }, { $set: { sortOrder } })
    )
  );
}
