import { buildWhatsAppLink, normalizePhoneForWhatsApp } from '@your-own/shared';
import { Button } from '../ui/Button.jsx';
import { postInquiry } from '../../lib/landApi.js';

/**
 * The single accent-filled primary action on a listing details page, per
 * Phase 1's "one primary action per viewport" rule. Logs an inquiry
 * (fire-and-forget, never blocks the redirect) then opens WhatsApp.
 */
export function WantToBuyButton({ land, settings, className = '', size = 'lg' }) {
  const phone = normalizePhoneForWhatsApp(
    land.whatsappNumberOverride || settings?.defaultWhatsappNumber || ''
  );

  const handleClick = (e) => {
    if (!phone) {
      e.preventDefault();
      return;
    }
    postInquiry({ landId: land._id, messagePreview: `Want to Buy — ${land.title}` });
  };

  if (!phone) {
    return null;
  }

  const link = buildWhatsAppLink({
    phone,
    title: land.title,
    slug: land.slug,
    location: [land.city, land.state].filter(Boolean).join(', '),
    price: land.price,
  });

  return (
    <Button
      as="a"
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      variant="primary"
      size={size}
      className={className}
    >
      <WhatsAppIcon className="h-5 w-5" />
      Want to Buy
    </Button>
  );
}

function WhatsAppIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.5 14.4c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.2-.6.9-.8 1.1-.1.2-.3.2-.5.1-1.2-.6-2-1-2.8-2.3-.2-.3.2-.3.5-.9.1-.2 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.2-.6.4-.2.3-.7.7-.7 1.7s.7 2 .8 2.1c.1.1 1.4 2.2 3.4 3 2.4.9 2.4.6 2.8.6.4 0 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.1-.6-.2z" />
      <path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.2L2 22l5-1.4C8.4 21.5 10.2 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.6 0-3.2-.4-4.5-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4 15 3.6 13.5 3.6 12c0-4.6 3.8-8.4 8.4-8.4s8.4 3.8 8.4 8.4-3.8 8.2-8.4 8.2z" />
    </svg>
  );
}
