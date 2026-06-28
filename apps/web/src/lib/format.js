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
