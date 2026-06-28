import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import { updateSettingsSchema } from '../../validators/settingsValidators.js';
import * as settingsController from '../../controllers/settingsController.js';

export const publicSettingsRouter = Router();
publicSettingsRouter.get('/public', settingsController.getPublicSettings);

export const adminSettingsRouter = Router();
adminSettingsRouter.use(requireAuth, requireRole('admin'));
adminSettingsRouter.get('/', settingsController.getAdminSettings);
adminSettingsRouter.put('/', validate(updateSettingsSchema), settingsController.updateAdminSettings);
