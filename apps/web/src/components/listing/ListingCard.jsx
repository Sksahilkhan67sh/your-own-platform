import { Link } from 'react-router-dom';
import { StatusBadge } from '../ui/StatusBadge.jsx';
import { formatPrice, formatArea, formatLocation } from '../../lib/format.js';

export function ListingCard({ land }) {
  const coverImage = land.coverImageUrl || land.images?.[0]?.imageUrl;

  return (
    <Link
      to={`/lands/${land.slug}`}
      className="group block overflow-hidden rounded-card border border-border bg-surface shadow-card
        transition-shadow duration-200 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-alt">
        {coverImage ? (
          <img
            src={coverImage}
            alt={land.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-soft">No image yet</div>
        )}
        {land.featured && (
          <span className="absolute left-3 top-3 rounded bg-surface/95 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-ink">
            Featured
          </span>
        )}
      </div>

      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 font-display text-lg leading-snug text-ink">{land.title}</h3>
        <p className="text-sm text-ink-soft">{formatLocation(land)}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="font-display text-base text-ink">{formatPrice(land.price, land.currency)}</span>
          <span className="text-sm text-ink-soft">{formatArea(land.areaValue, land.areaUnit)}</span>
        </div>
        <StatusBadge status={land.status} />
      </div>
    </Link>
  );
}
