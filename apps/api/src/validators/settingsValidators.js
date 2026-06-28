import { z } from 'zod';

const phoneE164Digits = z
  .string()
  .trim()
  .regex(/^\d{10,15}$/, 'Phone number must be 10-15 digits, no symbols (E.164 digits only)');

export const updateSettingsSchema = z.object({
  body: z.object({
    siteName: z.string().trim().min(1).max(80).optional(),
    logoUrl: z.string().trim().url().optional().or(z.literal('')),
    defaultWhatsappNumber: phoneE164Digits,
    contactEmail: z.string().trim().email().optional().or(z.literal('')),
    heroHeadline: z.string().trim().max(140).optional(),
    heroSubheadline: z.string().trim().max(240).optional(),
    seoDefaultTitle: z.string().trim().max(140).optional(),
    seoDefaultDescription: z.string().trim().max(300).optional(),
    socialLinks: z
      .object({
        instagram: z.string().trim().url().optional().or(z.literal('')),
        facebook: z.string().trim().url().optional().or(z.literal('')),
        twitter: z.string().trim().url().optional().or(z.literal('')),
        youtube: z.string().trim().url().optional().or(z.literal('')),
      })
      .optional(),
  }),
});

export const createInquirySchema = z.object({
  body: z.object({
    landId: z.string().trim().min(1),
    messagePreview: z.string().trim().max(500).optional(),
  }),
});
