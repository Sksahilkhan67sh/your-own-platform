import { Settings } from '../models/Settings.js';
import { ApiError } from '../utils/ApiError.js';
import { BRANDING_ASSET_FIELD } from '@your-own/shared';
import * as s3Service from './s3Service.js';
import { getCached, setCached, invalidate } from './settingsCache.js';

const SINGLETON_ID = 'singleton';
const PUBLIC_CACHE_KEY = 'settings:public';

export async function getSettings() {
  const settings = await Settings.findById(SINGLETON_ID);
  if (!settings) {
    throw ApiError.internal('Settings have not been initialized. Run the seed script.');
  }
  return settings;
}

/**
 * Public, unauthenticated shape of settings — everything the storefront
 * needs to render branding (title, logos, favicon, meta tags, colors,
 * login page) without exposing anything admin-only. Cached briefly since
 * this is called on effectively every page load.
 */
export async function getPublicSettings() {
  const cached = getCached(PUBLIC_CACHE_KEY);
  if (cached) return cached;

  const settings = await getSettings();
  const publicSettings = {
    siteName: settings.siteName,
    logoUrl: settings.logoUrl,
    navbarLogoUrl: settings.navbarLogoUrl,
    sidebarLogoUrl: settings.sidebarLogoUrl,
    footerLogoUrl: settings.footerLogoUrl,
    loginLogoUrl: settings.loginLogoUrl,
    faviconUrl: settings.faviconUrl,
    websiteTitle: settings.websiteTitle,
    defaultWhatsappNumber: settings.defaultWhatsappNumber,
    contactEmail: settings.contactEmail,
    heroHeadline: settings.heroHeadline,
    heroSubheadline: settings.heroSubheadline,
    seoDefaultTitle: settings.seoDefaultTitle,
    seoDefaultDescription: settings.seoDefaultDescription,
    metaTitle: settings.metaTitle,
    metaDescription: settings.metaDescription,
    metaKeywords: settings.metaKeywords,
    ogImageUrl: settings.ogImageUrl,
    twitterImageUrl: settings.twitterImageUrl,
    loginBackgroundUrl: settings.loginBackgroundUrl,
    loginWelcomeHeading: settings.loginWelcomeHeading,
    loginWelcomeDescription: settings.loginWelcomeDescription,
    colors: settings.colors,
    socialLinks: settings.socialLinks,
  };

  setCached(PUBLIC_CACHE_KEY, publicSettings);
  return publicSettings;
}

/** Full settings document, admin-only (includes everything public settings
 * has plus anything not meant for the storefront — currently identical,
 * but kept as a separate read path so admin-only fields can be added
 * later without touching the public shape). */
export async function getAdminSettings() {
  return getSettings();
}

export async function updateSettings(payload) {
  const settings = await Settings.findByIdAndUpdate(
    SINGLETON_ID,
    { $set: payload },
    { new: true, upsert: true, runValidators: true }
  );
  invalidate(PUBLIC_CACHE_KEY);
  return settings;
}

// Kept as an explicit alias so branding-specific call sites read clearly,
// even though branding lives on the same Settings singleton as everything
// else — see docs/BRAND_CREDIT_TODO.md-adjacent rationale: one document,
// one admin form, fewer round trips, no risk of the two ever drifting out
// of sync with each other.
export const updateBranding = updateSettings;
export const getBranding = getAdminSettings;

/**
 * Presigns a branding asset upload (logo/favicon/login background/etc.).
 * Does not touch the Settings document — that only happens on confirm,
 * once the browser has actually finished uploading to S3.
 */
export async function presignBrandingUpload({ assetType, fileName, contentType, fileSizeBytes }) {
  return s3Service.presignBrandingAsset({ assetType, fileName, contentType, fileSizeBytes });
}

/**
 * Confirms a branding asset upload succeeded and persists its public URL
 * onto the Settings singleton, replacing (and best-effort deleting) any
 * previous asset of the same type.
 */
export async function confirmBrandingUpload({ assetType, publicUrl }) {
  const field = BRANDING_ASSET_FIELD[assetType];
  if (!field) {
    throw ApiError.badRequest(`Unknown branding asset type: ${assetType}`);
  }

  const current = await getSettings();
  const previousUrl = current[field];

  const settings = await Settings.findByIdAndUpdate(
    SINGLETON_ID,
    { $set: { [field]: publicUrl } },
    { new: true, runValidators: true }
  );

  invalidate(PUBLIC_CACHE_KEY);

  if (previousUrl && previousUrl !== publicUrl) {
    await s3Service.deleteBrandingAssetByUrl(previousUrl);
  }

  return settings;
}
