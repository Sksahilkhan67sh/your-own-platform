import { z } from 'zod';
import { BRANDING_ASSET_TYPE_VALUES, BRANDING_ASSET_LIMITS, BRANDING_COLOR_KEYS } from '@your-own/shared';

const phoneE164Digits = z
  .string()
  .trim()
  .regex(/^\d{10,15}$/, 'Phone number must be 10-15 digits, no symbols (E.164 digits only)');

const urlOrEmpty = z.string().trim().url().optional().or(z.literal(''));

const colorsSchema = z
  .object(
    BRANDING_COLOR_KEYS.reduce((shape, key) => {
      // Accept hex codes (#fff, #ffffff) or empty string ("use theme default").
      shape[key] = z
        .string()
        .trim()
        .regex(/^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}))?$/, 'Enter a hex color like #2563eb')
        .optional()
        .or(z.literal(''));
      return shape;
    }, {})
  )
  .partial()
  .optional();

// Combined schema: covers both the original site-identity fields and the
// new branding fields, since both live on the same Settings singleton and
// both /admin/settings and /admin/branding PUT through the same service.
export const updateSettingsSchema = z.object({
  body: z.object({
    siteName: z.string().trim().min(1).max(80).optional(),
    logoUrl: urlOrEmpty,
    defaultWhatsappNumber: phoneE164Digits,
    contactEmail: z.string().trim().email().optional().or(z.literal('')),
    heroHeadline: z.string().trim().max(140).optional(),
    heroSubheadline: z.string().trim().max(240).optional(),
    seoDefaultTitle: z.string().trim().max(140).optional(),
    seoDefaultDescription: z.string().trim().max(300).optional(),
    socialLinks: z
      .object({
        instagram: urlOrEmpty,
        facebook: urlOrEmpty,
        twitter: urlOrEmpty,
        youtube: urlOrEmpty,
      })
      .optional(),

    // Logos (URLs are only ever set server-side via confirmBrandingUpload,
    // but accepted here too so an admin can paste an external URL instead
    // of uploading a file, or clear a slot with '').
    navbarLogoUrl: urlOrEmpty,
    sidebarLogoUrl: urlOrEmpty,
    footerLogoUrl: urlOrEmpty,
    loginLogoUrl: urlOrEmpty,
    faviconUrl: urlOrEmpty,

    websiteTitle: z.string().trim().min(1).max(80).optional(),

    metaTitle: z.string().trim().max(140).optional().or(z.literal('')),
    metaDescription: z.string().trim().max(300).optional().or(z.literal('')),
    metaKeywords: z.string().trim().max(300).optional().or(z.literal('')),
    ogImageUrl: urlOrEmpty,
    twitterImageUrl: urlOrEmpty,

    loginBackgroundUrl: urlOrEmpty,
    loginWelcomeHeading: z.string().trim().max(140).optional().or(z.literal('')),
    loginWelcomeDescription: z.string().trim().max(300).optional().or(z.literal('')),

    colors: colorsSchema,
  }),
});

export const presignBrandingUploadSchema = z.object({
  body: z.object({
    assetType: z.enum(BRANDING_ASSET_TYPE_VALUES),
    fileName: z.string().trim().min(1).max(255),
    contentType: z.enum(BRANDING_ASSET_LIMITS.ALLOWED_MIME_TYPES),
    fileSizeBytes: z
      .number()
      .int()
      .positive()
      .max(BRANDING_ASSET_LIMITS.MAX_FILE_SIZE_BYTES, 'File exceeds the 5MB limit'),
  }),
});

export const confirmBrandingUploadSchema = z.object({
  body: z.object({
    assetType: z.enum(BRANDING_ASSET_TYPE_VALUES),
    storageKey: z.string().trim().min(1),
    publicUrl: z.string().trim().url(),
  }),
});

export const createInquirySchema = z.object({
  body: z.object({
    landId: z.string().trim().min(1),
    messagePreview: z.string().trim().max(500).optional(),
  }),
});
