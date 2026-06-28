import { Settings } from '../models/Settings.js';
import { ApiError } from '../utils/ApiError.js';

const SINGLETON_ID = 'singleton';

export async function getSettings() {
  const settings = await Settings.findById(SINGLETON_ID);
  if (!settings) {
    throw ApiError.internal('Settings have not been initialized. Run the seed script.');
  }
  return settings;
}

export async function getPublicSettings() {
  const settings = await getSettings();
  return {
    siteName: settings.siteName,
    logoUrl: settings.logoUrl,
    defaultWhatsappNumber: settings.defaultWhatsappNumber,
    contactEmail: settings.contactEmail,
    heroHeadline: settings.heroHeadline,
    heroSubheadline: settings.heroSubheadline,
    seoDefaultTitle: settings.seoDefaultTitle,
    seoDefaultDescription: settings.seoDefaultDescription,
    socialLinks: settings.socialLinks,
  };
}

export async function updateSettings(payload) {
  const settings = await Settings.findByIdAndUpdate(
    SINGLETON_ID,
    { $set: payload },
    { new: true, upsert: true, runValidators: true }
  );
  return settings;
}
