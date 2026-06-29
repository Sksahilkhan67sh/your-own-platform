import { z } from 'zod';

export const createDealSchema = z.object({
  body: z.object({
    landId: z.string().trim().min(1),
    finalPrice: z.coerce.number().min(0),
    buyerName: z.string().trim().min(1).max(120),
    buyerContact: z.string().trim().min(1).max(120),
    sellerName: z.string().trim().min(1).max(120),
    sellerContact: z.string().trim().min(1).max(120),
    commissionRate: z.coerce.number().min(0).max(100).optional(),
    notes: z.string().trim().max(1000).optional(),
  }),
});

export const updateDealSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
  body: z.object({
    status: z.enum(['pending_payment', 'paid', 'cancelled']).optional(),
    notes: z.string().trim().max(1000).optional(),
  }),
});

export const dealIdParamSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
});

export const dealListQuerySchema = z.object({
  query: z.object({
    status: z.enum(['pending_payment', 'paid', 'cancelled']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
