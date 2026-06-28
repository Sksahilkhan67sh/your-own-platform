import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { inquiryLimiter } from '../../middlewares/rateLimiters.js';
import {
  publicLandQuerySchema,
  landSlugParamSchema,
} from '../../validators/landValidators.js';
import { createInquirySchema } from '../../validators/settingsValidators.js';
import * as landController from '../../controllers/landController.js';

const router = Router();

router.get('/', validate(publicLandQuerySchema), landController.listPublicLands);
router.get('/:slug', validate(landSlugParamSchema), landController.getPublicLandBySlug);

export default router;

// Mounted separately in app.js: POST /api/v1/inquiries
export const inquiryRouter = Router();
inquiryRouter.post('/', inquiryLimiter, validate(createInquirySchema), landController.createInquiry);
