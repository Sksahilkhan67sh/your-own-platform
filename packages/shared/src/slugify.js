/**
 * Converts a land title into a URL-safe slug.
 * Used server-side at creation time. Slugs are immutable after first publish
 * (enforced in the Land service, not here) so shared WhatsApp links never break.
 *
 * @param {string} input
 * @returns {string}
 */
export function slugify(input) {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw new Error('slugify: input must be a non-empty string');
  }

  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Appends a short random suffix to guarantee uniqueness on collision.
 * The service layer calls this only if the base slug already exists.
 * @param {string} baseSlug
 * @returns {string}
 */
export function withUniqueSuffix(baseSlug) {
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${baseSlug}-${suffix}`;
}
