import { Router } from 'express';

import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import landRoutes, { inquiryRouter } from './landRoutes.js';
import adminLandRoutes from './adminLandRoutes.js';
import { publicSettingsRouter, adminSettingsRouter } from './settingsRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

router.use('/lands', landRoutes);
router.use('/inquiries', inquiryRouter);
router.use('/admin/lands', adminLandRoutes);

router.use('/settings', publicSettingsRouter);
router.use('/admin/settings', adminSettingsRouter);

export default router;
