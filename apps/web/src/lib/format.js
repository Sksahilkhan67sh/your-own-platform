import { AREA_UNIT_LABELS } from '@your-own/shared';

export function formatPrice(price, currency = 'INR') {
  if (currency === 'INR') {
    return `₹${Number(price).toLocaleString('en-IN')}`;
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(price);
}

export function formatArea(areaValue, areaUnit) {
  const label = AREA_UNIT_LABELS[areaUnit] || areaUnit;
  return `${Number(areaValue).toLocaleString('en-IN')} ${label}`;
}

export function formatLocation(land) {
  return [land.city, land.state].filter(Boolean).join(', ');
}

/**
 * Compact Indian-notation price for tight UI (stat cards, chart axes) —
 * e.g. 4850000 -> "₹48.5 L", 12600000 -> "₹1.26 Cr". Falls back to a plain
 * formatted number when the value is null/missing rather than "₹NaN".
 */
export function formatCompactPrice(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)} L`;
  if (abs >= 1_000) return `₹${(value / 1_000).toFixed(1)} K`;
  return `₹${value.toLocaleString('en-IN')}`;
}

export function formatDate(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
