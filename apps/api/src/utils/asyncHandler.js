/**
 * Wraps an async route handler so any thrown error or rejected promise
 * is forwarded to next(), reaching the centralized error handler instead
 * of crashing the process or hanging the request.
 * @param {Function} fn - (req, res, next) => Promise
 */
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
