import axios from 'axios';
import { presignLandImages, confirmLandImage } from './landApi.js';

/**
 * Uploads a single image File directly to S3 using a presigned URL, then
 * confirms the upload with the API so metadata gets persisted. The raw
 * image bytes never pass through our Express server — see Phase 1's
 * rationale for presign/confirm over server-proxied uploads.
 *
 * @param {string} landId
 * @param {File} file
 * @param {(progress: number) => void} [onProgress] - 0-100
 */
export async function uploadLandImage(landId, file, onProgress) {
  const [presigned] = await presignLandImages(landId, [
    {
      fileName: file.name,
      contentType: file.type,
      fileSizeBytes: file.size,
    },
  ]);

  await axios.put(presigned.uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });

  const dimensions = await readImageDimensions(file);

  const image = await confirmLandImage(landId, {
    storageKey: presigned.storageKey,
    imageUrl: presigned.publicUrl,
    altText: '',
    ...dimensions,
  });

  return image;
}

function readImageDimensions(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({});
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}
