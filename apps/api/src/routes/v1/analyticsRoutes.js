import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { analyticsLimiter } from '../../middlewares/rateLimiters.js';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import {
  landAnalyticsSchema,
  locationAnalyticsSchema,
  updateAnalyticsSettingsSchema,
} from '../../validators/analyticsValidators.js';
import * as analyticsController from '../../controllers/analyticsController.js';

const router = Router();

router.use(analyticsLimiter);

router.get('/land/:landId', validate(landAnalyticsSchema), analyticsController.getLandAnalytics);
router.get('/location', validate(locationAnalyticsSchema), analyticsController.getLocationAnalytics);

export default router;

// ---- Admin: Analytics Management ----
export const adminAnalyticsSettingsRouter = Router();
adminAnalyticsSettingsRouter.use(requireAuth, requireRole('admin', 'super_admin'));
adminAnalyticsSettingsRouter.get('/', analyticsController.getAdminAnalyticsSettings);
adminAnalyticsSettingsRouter.put(
  '/',
  validate(updateAnalyticsSettingsSchema),
  analyticsController.updateAdminAnalyticsSettings
);
