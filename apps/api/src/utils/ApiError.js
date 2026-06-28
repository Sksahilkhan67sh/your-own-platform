/**
 * Thrown deliberately anywhere in services/controllers to produce a
 * controlled, client-safe error response. The centralized error handler
 * trusts ApiError.message to be safe to show to clients — anything else
 * (raw exceptions, Mongoose errors, etc.) is treated as internal and
 * never has its message leaked to the client in production.
 */
export class ApiError extends Error {
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code; // machine-readable, e.g. 'VALIDATION_ERROR', 'NOT_FOUND'
    this.details = details;
    this.isOperational = true; // distinguishes expected errors from bugs
  }

  static badRequest(message, details) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message) {
    return new ApiError(409, 'CONFLICT', message);
  }

  static tooManyRequests(message = 'Too many requests. Please try again later.') {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message);
  }

  static validation(message, details) {
    return new ApiError(422, 'VALIDATION_ERROR', message, details);
  }

  static internal(message = 'Something went wrong. Please try again.') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}
