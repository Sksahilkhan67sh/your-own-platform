const STATUS_CONFIG = {
  available: { label: 'Available', className: 'text-status-available' },
  pending: { label: 'Under negotiation', className: 'text-status-pending' },
  sold: { label: 'Sold', className: 'text-status-sold' },
};

/**
 * Deliberately a small-caps text label with a dot, not a rounded pill —
 * per Phase 1's direction against "over-rounded toy-like" badges.
 */
export function StatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.available;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide ${config.className} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {config.label}
    </span>
  );
}
