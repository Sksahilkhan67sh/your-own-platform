import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

/**
 * Single shared S3 client instance.
 * If S3_ENDPOINT is set (e.g. for Cloudflare R2 or another S3-compatible
 * provider), it's used; otherwise the SDK talks to real AWS S3 in AWS_REGION.
 */
export const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
  ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT, forcePathStyle: true } : {}),
});
