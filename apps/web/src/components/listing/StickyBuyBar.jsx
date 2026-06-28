import { WantToBuyButton } from './WantToBuyButton.jsx';
import { formatPrice } from '../../lib/format.js';

/**
 * Mobile-only (hidden on lg+ via Tailwind), and only ever rendered on the
 * listing details page — per Phase 1's direction, this is NOT a site-wide
 * sticky element.
 */
export function StickyBuyBar({ land, settings }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t
        border-border bg-surface px-4 py-3 shadow-sticky lg:hidden"
    >
      <div>
        <p className="font-display text-lg text-ink">{formatPrice(land.price, land.currency)}</p>
        <p className="text-xs text-ink-soft">{land.city}, {land.state}</p>
      </div>
      <WantToBuyButton land={land} settings={settings} size="md" />
    </div>
  );
}
