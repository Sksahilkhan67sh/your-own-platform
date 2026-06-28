// Shared constants — single source of truth for both apps/api and apps/web.
// Importing the same literal values prevents enum drift between backend
// validation and frontend forms/filters.

export const LAND_STATUS = Object.freeze({
  AVAILABLE: 'available',
  PENDING: 'pending',
  SOLD: 'sold',
});

export const LAND_STATUS_VALUES = Object.values(LAND_STATUS);

export const AREA_UNIT = Object.freeze({
  SQFT: 'sqft',
  SQYD: 'sqyd',
  ACRE: 'acre',
  HECTARE: 'hectare',
  BIGHA: 'bigha',
});

export const AREA_UNIT_VALUES = Object.values(AREA_UNIT);

export const AREA_UNIT_LABELS = Object.freeze({
  sqft: 'sq. ft.',
  sqyd: 'sq. yd.',
  acre: 'acre',
  hectare: 'hectare',
  bigha: 'bigha',
});

export const IMAGE_LIMITS = Object.freeze({
  MAX_IMAGES_PER_LAND: 10,
  MAX_FILE_SIZE_BYTES: 8 * 1024 * 1024, // 8MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
});

export const SORT_OPTIONS = Object.freeze({
  NEWEST: 'newest',
  PRICE_LOW_HIGH: 'price_asc',
  PRICE_HIGH_LOW: 'price_desc',
  AREA: 'area_desc',
});

export const SORT_OPTION_VALUES = Object.values(SORT_OPTIONS);

export const SITE_NAME = 'YOUR OWN';
