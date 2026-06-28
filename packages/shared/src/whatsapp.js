import { SITE_NAME } from './constants.js';

/**
 * Builds a wa.me deep link with a safely URL-encoded, prefilled message.
 * This is the single implementation used by the frontend "Want to Buy" button.
 * Phone numbers must already be in E.164 digits-only format (no '+', spaces, or dashes)
 * per wa.me requirements — use normalizePhoneForWhatsApp() first if unsure.
 *
 * @param {Object} params
 * @param {string} params.phone - E.164 digits only, e.g. "919876543210"
 * @param {string} params.title - Land listing title
 * @param {string} params.slug - Land listing slug (used as reference)
 * @param {string} params.location - e.g. "Whitefield, Bengaluru"
 * @param {number|string} params.price - Listing price
 * @param {string} [params.currencyLabel] - e.g. "₹" or "INR"
 * @returns {string} Full https://wa.me/... URL
 */
export function buildWhatsAppLink({ phone, title, slug, location, price, currencyLabel = '₹' }) {
  if (!phone || !/^\d{10,15}$/.test(phone)) {
    throw new Error('buildWhatsAppLink: phone must be E.164 digits only (10-15 digits)');
  }
  if (!title || !slug || !location || price === undefined || price === null) {
    throw new Error('buildWhatsAppLink: title, slug, location, and price are required');
  }

  const formattedPrice = typeof price === 'number' ? price.toLocaleString('en-IN') : price;

  const message =
    `Hi, I am interested in the land listing "${title}" on ${SITE_NAME}. ` +
    `Please share full details. Listing reference: ${slug}. ` +
    `Location: ${location}. Price: ${currencyLabel}${formattedPrice}.`;

  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${phone}?text=${encodedMessage}`;
}

/**
 * Strips formatting characters from a human-entered phone number so it's
 * safe to pass to buildWhatsAppLink. Does NOT validate country code correctness —
 * admin-entered numbers should be reviewed once at Settings save time.
 * @param {string} raw
 * @returns {string}
 */
export function normalizePhoneForWhatsApp(raw) {
  return String(raw).replace(/[^\d]/g, '');
}
