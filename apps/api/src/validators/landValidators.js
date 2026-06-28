import { z } from 'zod';
import { LAND_STATUS_VALUES, AREA_UNIT_VALUES, SORT_OPTION_VALUES } from '@your-own/shared';

const phoneE164Digits = z
  .string()
  .trim()
  .regex(/^\d{10,15}$/, 'Phone number must be 10-15 digits, no symbols (E.164 digits only)');

export const createLandSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(140),
    description: z.string().trim().min(10).max(5000),
    price: z.coerce.number().min(0),
    currency: z.string().trim().default('INR'),
    areaValue: z.coerce.number().min(0),
    areaUnit: z.enum(AREA_UNIT_VALUES),
    address: z.string().trim().min(3),
    city: z.string().trim().min(1),
    state: z.string().trim().min(1),
    country: z.string().trim().default('India'),
    postalCode: z.string().trim().optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    status: z.enum(LAND_STATUS_VALUES).optional(),
    featured: z.coerce.boolean().optional(),
    whatsappNumberOverride: phoneE164Digits.optional().or(z.literal('')),
    highlights: z.array(z.string().trim().max(120)).max(20).optional(),
    amenities: z.array(z.string().trim().max(120)).max(20).optional(),
  }),
});

// Partial update — same shape, nothing required.
export const updateLandSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
  body: createLandSchema.shape.body.partial(),
});

export const landIdParamSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
});

export const landSlugParamSchema = z.object({
  params: z.object({ slug: z.string().trim().min(1) }),
});

export const publicLandQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().max(140).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    minArea: z.coerce.number().min(0).optional(),
    maxArea: z.coerce.number().min(0).optional(),
    status: z.enum(LAND_STATUS_VALUES).optional(),
    featured: z.coerce.boolean().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    sort: z.enum(SORT_OPTION_VALUES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(12),
  }),
});

export const adminLandQuerySchema = z.object({
  query: publicLandQuerySchema.shape.query,
});

export const reorderImagesSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
  body: z.object({
    order: z
      .array(
        z.object({
          imageId: z.string().trim().min(1),
          sortOrder: z.coerce.number().int().min(0),
        })
      )
      .min(1)
      .max(10),
  }),
});

export const presignImagesSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
  body: z.object({
    files: z
      .array(
        z.object({
          fileName: z.string().trim().min(1).max(255),
          contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
          fileSizeBytes: z.coerce.number().int().min(1).max(8 * 1024 * 1024),
        })
      )
      .min(1)
      .max(10),
  }),
});

export const confirmImageSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
  body: z.object({
    storageKey: z.string().trim().min(1),
    imageUrl: z.string().trim().url(),
    altText: z.string().trim().max(150).optional(),
    width: z.coerce.number().int().min(1).optional(),
    height: z.coerce.number().int().min(1).optional(),
  }),
});

export const deleteImageParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
    imageId: z.string().trim().min(1),
  }),
});
