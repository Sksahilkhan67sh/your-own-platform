/**
 * Sends a consistently-shaped success response per the API envelope
 * defined in Phase 1: { success, data, meta? }.
 */
export function sendSuccess(res, { statusCode = 200, data = null, meta = undefined } = {}) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}
