import axios from 'axios';
import { presignBrandingUpload, confirmBrandingUpload } from './brandingApi.js';

/**
 * Uploads a single branding asset File directly to S3 using a presigned
 * URL, then confirms with the API so the Settings singleton is updated.
 * Mirrors lib/uploadImage.js's presign/confirm flow for land images.
 *
 * @param {string} assetType - one of BRANDING_ASSET_TYPE (@your-own/shared)
 * @param {File} file
 * @param {(progress: number) => void} [onProgress] - 0-100
 */
export async function uploadBrandingAsset(assetType, file, onProgress) {
  const presigned = await presignBrandingUpload({
    assetType,
    fileName: file.name,
    contentType: file.type,
    fileSizeBytes: file.size,
  });

  await axios.put(presigned.uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });

  const branding = await confirmBrandingUpload({
    assetType,
    storageKey: presigned.storageKey,
    publicUrl: presigned.publicUrl,
  });

  return branding;
}
