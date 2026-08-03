import { formatCompactPrice, formatDate } from '../../lib/format.js';

const DEMAND_STYLES = {
  'Very High': 'text-status-sold',
  High: 'text-status-pending',
  Medium: 'text-ink',
  Low: 'text-ink-soft',
};

function Stat({ label, value, hint }) {
  return (
    <div className="border-b border-border py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:py-0 sm:pr-4 [&:nth-child(2n)]:sm:border-r-0 sm:[&:nth-child(2n)]:pr-0">
      <dt className="text-xs uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="mt-1 font-display text-lg text-ink">
        {value}
        {hint && <span className="ml-1.5 text-sm font-body text-ink-soft">{hint}</span>}
      </dd>
    </div>
  );
}

export function MarketInsightsSkeleton() {
  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card">
      <div className="h-5 w-40 animate-pulse rounded bg-surface-alt" />
      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-surface-alt" />
            <div className="h-5 w-20 animate-pulse rounded bg-surface-alt" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketInsightsEmpty() {
  return (
    <div className="rounded-card border border-dashed border-border px-6 py-10 text-center">
      <h3 className="font-display text-lg text-ink">Market insights unavailable</h3>
      <p className="mt-2 text-sm text-ink-soft">
        This listing doesn't have map coordinates yet, so we can't analyze the surrounding market.
      </p>
    </div>
  );
}

/**
 * Core stats grid. Renders a well-formed "no data yet" state per-field
 * (via formatCompactPrice/formatDate's own "—" fallback) instead of
 * hiding the whole card — a brand-new micro-market with zero sales is a
 * legitimate, expected state, not an error.
 */
export function MarketInsightsCard({ data }) {
  const priceGrowthLabel =
    data.priceGrowth === null
      ? 'Not enough history'
      : `${data.priceGrowth > 0 ? '+' : ''}${data.priceGrowth}%`;

  const demandClass = DEMAND_STYLES[data.demand] || 'text-ink';

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card">
      <h2 className="font-display text-xl text-ink">Market Insights</h2>
      <p className="mt-1 text-sm text-ink-soft">Based on sales within a 5&nbsp;km radius of this listing.</p>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
        <Stat label="Sold Last 30 Days" value={data.sold30Days} />
        <Stat label="Sold Last Year" value={data.sold1Year} />
        <Stat label="Lifetime Sales" value={data.lifetimeSold} />

        <Stat label="Avg Sale Price" value={formatCompactPrice(data.averagePrice)} />
        <Stat label="Highest Sale" value={formatCompactPrice(data.highestSale)} />
        <Stat label="Lowest Sale" value={formatCompactPrice(data.lowestSale)} />

        <Stat label="Avg Price / Sq.Ft" value={data.averagePricePerSqFt ? `₹${data.averagePricePerSqFt}` : '—'} />
        <Stat
          label="Price Growth"
          value={<span className={data.priceGrowth > 0 ? 'text-status-available' : data.priceGrowth < 0 ? 'text-danger' : ''}>{priceGrowthLabel}</span>}
        />
        <Stat label="Demand" value={<span className={demandClass}>{data.demand}</span>} />

        <Stat label="Active Listings" value={data.activeListings} />
        <Stat label="Sold / Active" value={data.soldVsActive ?? '—'} />
        <Stat label="Last Sale" value={formatDate(data.lastSaleDate)} />
      </dl>
    </div>
  );
}
