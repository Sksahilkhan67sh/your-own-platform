import { Router } from 'express';

import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import landRoutes, { inquiryRouter } from './landRoutes.js';
import adminLandRoutes from './adminLandRoutes.js';
import dealRoutes from './dealRoutes.js';
import analyticsRoutes, { adminAnalyticsSettingsRouter } from './analyticsRoutes.js';
import { publicSettingsRouter, adminSettingsRouter, adminBrandingRouter } from './settingsRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

router.use('/lands', landRoutes);
router.use('/inquiries', inquiryRouter);
router.use('/admin/lands', adminLandRoutes);
router.use('/admin/deals', dealRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin/analytics/settings', adminAnalyticsSettingsRouter);

router.use('/settings', publicSettingsRouter);
router.use('/admin/settings', adminSettingsRouter);
router.use('/admin/branding', adminBrandingRouter);

export default router;
