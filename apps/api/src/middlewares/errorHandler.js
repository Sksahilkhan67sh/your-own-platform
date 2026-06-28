import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * 404 handler for unmatched routes. Mounted after all routes, before the
 * error handler.
 */
export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Single centralized error handler. This is the only place in the codebase
 * that decides what error information reaches the client.
 *
 * - ApiError instances (operational, expected) → message + code shown as-is.
 * - Mongoose validation/cast errors → translated into a clean 400/422, never
 *   the raw Mongoose error (which can include schema paths/internals).
 * - Anything else (programming errors, unexpected exceptions) → logged in
 *   full server-side, but the client only ever sees a generic message.
 *   This is what fulfills "no sensitive error leaks" for real, rather than
 *   just not printing stack traces — duplicate-key errors, cast errors, and
 *   raw driver errors are exactly the things that leak schema/internals if
 *   forwarded directly.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const requestId = req.id;

  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, 'Operational error (5xx)');
    } else {
      logger.warn({ errMessage: err.message, code: err.code, requestId }, 'Operational error');
    }
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
      requestId,
    });
  }

  // Mongoose duplicate key (e.g. slug or email collision)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: `A record with this ${field} already exists.` },
      requestId,
    });
  }

  // Mongoose schema validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details },
      requestId,
    });
  }

  // Mongoose bad ObjectId cast
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Invalid identifier supplied.' },
      requestId,
    });
  }

  // Unknown / programming error — log full detail, never expose it.
  logger.error({ err, requestId }, 'Unhandled error');
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong on our end. Please try again shortly.',
      ...(env.isProduction ? {} : { devMessage: err.message }),
    },
    requestId,
  });
}
