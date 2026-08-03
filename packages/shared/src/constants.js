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

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export const USER_ROLE = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  VIEWER: 'viewer',
});

export const USER_ROLE_VALUES = Object.values(USER_ROLE);

// Roles allowed to manage branding & analytics configuration.
export const BRANDING_MANAGER_ROLES = Object.freeze([USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]);

// ---------------------------------------------------------------------------
// Branding assets
// ---------------------------------------------------------------------------

export const BRANDING_ASSET_TYPE = Object.freeze({
  LOGO: 'logo',
  NAVBAR_LOGO: 'navbarLogo',
  SIDEBAR_LOGO: 'sidebarLogo',
  LOGIN_LOGO: 'loginLogo',
  FOOTER_LOGO: 'footerLogo',
  FAVICON: 'favicon',
  LOGIN_BACKGROUND: 'loginBackground',
  OG_IMAGE: 'ogImage',
  TWITTER_IMAGE: 'twitterImage',
});

export const BRANDING_ASSET_TYPE_VALUES = Object.values(BRANDING_ASSET_TYPE);

// Maps each branding asset type to the Settings field that stores its URL.
export const BRANDING_ASSET_FIELD = Object.freeze({
  logo: 'logoUrl',
  navbarLogo: 'navbarLogoUrl',
  sidebarLogo: 'sidebarLogoUrl',
  loginLogo: 'loginLogoUrl',
  footerLogo: 'footerLogoUrl',
  favicon: 'faviconUrl',
  loginBackground: 'loginBackgroundUrl',
  ogImage: 'ogImageUrl',
  twitterImage: 'twitterImageUrl',
});

export const BRANDING_ASSET_LIMITS = Object.freeze({
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: ['image/png', 'image/svg+xml', 'image/jpeg', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/webp'],
});

export const BRANDING_COLOR_KEYS = Object.freeze([
  'primaryColor',
  'secondaryColor',
  'accentColor',
  'buttonColor',
  'navbarColor',
  'footerColor',
  'sidebarColor',
  'backgroundColor',
  'textColor',
]);

// ---------------------------------------------------------------------------
// Analytics visibility toggles (admin-configurable, viewer-facing)
// ---------------------------------------------------------------------------

export const ANALYTICS_TOGGLE_KEYS = Object.freeze([
  'showMonthlySales',
  'showYearlySales',
  'showLifetimeSales',
  'showAveragePrice',
  'showHighestPrice',
  'showLowestPrice',
  'showGrowth',
  'showNearbySales',
  'showDemand',
  'showInvestmentScore',
  'showActiveListings',
  'showSoldVsActiveRatio',
  'showCharts',
  'showHeatmap',
]);

export const ANALYTICS_MANUAL_VALUE_KEYS = Object.freeze([
  'manualMonthlySales',
  'manualYearlySales',
  'manualLifetimeSales',
  'manualAveragePrice',
  'manualHighestPrice',
  'manualLowestPrice',
  'manualGrowth',
  'manualDemand',
  'manualInvestmentScore',
  'manualNearbySales',
]);

export const CHART_TYPE = Object.freeze({
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  PIE: 'pie',
  BAR: 'bar',
  AREA: 'area',
});

export const CHART_TYPE_VALUES = Object.values(CHART_TYPE);

export const DEMAND_TIER_DEFAULTS = Object.freeze([
  { max: 100, label: 'Low' },
  { max: 300, label: 'Medium' },
  { max: 700, label: 'High' },
  { max: null, label: 'Very High' }, // null max = "and above"
]);

