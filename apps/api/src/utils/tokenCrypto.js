import crypto from 'node:crypto';

/**
 * Generates a cryptographically random opaque refresh token (not a JWT).
 * Opaque tokens carry no decodable claims, so a leaked log line or error
 * message can never expose user data the way a leaked JWT might.
 * @returns {string} 64 hex characters (32 random bytes)
 */
export function generateOpaqueToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * SHA-256 hashes a token for storage. We never store the raw refresh token —
 * only this hash — so a database read/leak alone cannot be used to
 * impersonate a session; the attacker would still need the original token.
 * @param {string} token
 * @returns {string}
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a random family ID grouping all refresh tokens descended
 * from a single login. Used for reuse-detection-based revocation.
 * @returns {string}
 */
export function generateTokenFamily() {
  return crypto.randomBytes(16).toString('hex');
}
