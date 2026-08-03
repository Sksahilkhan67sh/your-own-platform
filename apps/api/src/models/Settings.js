import mongoose from 'mongoose';
import { BRANDING_COLOR_KEYS } from '@your-own/shared';

const socialLinksSchema = new mongoose.Schema(
  {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    youtube: { type: String, default: '' },
  },
  { _id: false }
);

// One String field per BRANDING_COLOR_KEYS entry, all defaulting to ''
// (meaning "use the built-in theme default" on the frontend). Built from
// the shared constant so the schema and the frontend color picker list
// can never drift apart.
const colorFields = BRANDING_COLOR_KEYS.reduce((fields, key) => {
  fields[key] = { type: String, default: '', trim: true };
  return fields;
}, {});

const colorsSchema = new mongoose.Schema(colorFields, { _id: false });

const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'singleton' },

    // ---- Site identity (existing) ----
    siteName: { type: String, default: 'YOUR OWN' },
    logoUrl: { type: String, default: '' },
    defaultWhatsappNumber: { type: String, required: true }, // E.164 digits only
    contactEmail: { type: String, default: '' },
    heroHeadline: { type: String, default: 'Land worth owning.' },
    heroSubheadline: {
      type: String,
      default: 'Carefully verified plots, presented honestly, sold directly.',
    },
    seoDefaultTitle: { type: String, default: 'YOUR OWN — Land Listings' },
    seoDefaultDescription: {
      type: String,
      default: 'Browse verified land listings and connect directly with the seller on WhatsApp.',
    },
    socialLinks: { type: socialLinksSchema, default: () => ({}) },

    // ---- Branding: logos ----
    navbarLogoUrl: { type: String, default: '' },
    sidebarLogoUrl: { type: String, default: '' },
    footerLogoUrl: { type: String, default: '' },
    loginLogoUrl: { type: String, default: '' },
    faviconUrl: { type: String, default: '' },

    // ---- Branding: website title (distinct from SEO default title —
    // this is the always-on browser tab / app title) ----
    websiteTitle: { type: String, default: 'YOUR OWN', trim: true, maxlength: 80 },

    // ---- Branding: meta tags ----
    metaTitle: { type: String, default: '', trim: true, maxlength: 140 },
    metaDescription: { type: String, default: '', trim: true, maxlength: 300 },
    metaKeywords: { type: String, default: '', trim: true, maxlength: 300 },
    ogImageUrl: { type: String, default: '' },
    twitterImageUrl: { type: String, default: '' },

    // ---- Branding: login page ----
    loginBackgroundUrl: { type: String, default: '' },
    loginWelcomeHeading: { type: String, default: '', trim: true, maxlength: 140 },
    loginWelcomeDescription: { type: String, default: '', trim: true, maxlength: 300 },

    // ---- Branding: theme colors ----
    colors: { type: colorsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const Settings = mongoose.model('Settings', settingsSchema);
