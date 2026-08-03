import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { analyticsLimiter } from '../../middlewares/rateLimiters.js';
import { landAnalyticsSchema, locationAnalyticsSchema } from '../../validators/analyticsValidators.js';
import * as analyticsController from '../../controllers/analyticsController.js';

const router = Router();

router.use(analyticsLimiter);

router.get('/land/:landId', validate(landAnalyticsSchema), analyticsController.getLandAnalytics);
router.get('/location', validate(locationAnalyticsSchema), analyticsController.getLocationAnalytics);

export default router;
