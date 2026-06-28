import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { isDBConnected } from '../config/db.js';

export const healthCheck = asyncHandler(async (_req, res) => {
  const dbConnected = isDBConnected();

  sendSuccess(res, {
    statusCode: dbConnected ? 200 : 503,
    data: {
      status: dbConnected ? 'ok' : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    },
  });
});
