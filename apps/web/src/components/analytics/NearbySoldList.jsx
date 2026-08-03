import { formatCompactPrice, formatDate } from '../../lib/format.js';

/**
 * The project has no client-side map library (React Leaflet, Google Maps
 * JS SDK, etc.) — LandDetailsPage only embeds a read-only Google Maps
 * <iframe>, which can't render custom/colored markers. Rather than bolt on
 * a whole new mapping dependency for this one feature, nearby sold
 * properties are shown as a list — real data, gracefully within what the
 * current stack actually supports.
 */
export function NearbySoldList({ properties }) {
  if (properties.length === 0) {
    return <p className="text-sm text-ink-soft">No recently sold properties nearby yet.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {properties.map((p) => (
        <li key={`${p.landId}-${p.soldDate}`} className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{p.title}</p>
            <p className="text-sm text-ink-soft">
              {[p.city, p.state].filter(Boolean).join(', ')} · Sold {formatDate(p.soldDate)}
            </p>
          </div>
          <span className="flex-shrink-0 font-display text-ink">{formatCompactPrice(p.soldPrice)}</span>
        </li>
      ))}
    </ul>
  );
}
