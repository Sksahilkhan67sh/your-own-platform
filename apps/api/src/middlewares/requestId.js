import { v4 as uuidv4 } from 'uuid';

/**
 * Attaches a unique request ID to every request, surfaced in error
 * responses and log lines so a user-reported issue can be traced to
 * exact server logs without exposing any internal detail to the client.
 */
export function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || uuidv4();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
