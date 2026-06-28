import mongoose from 'mongoose';

const socialLinksSchema = new mongoose.Schema(
  {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    youtube: { type: String, default: '' },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'singleton' },
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
  },
  { timestamps: true }
);

export const Settings = mongoose.model('Settings', settingsSchema);
