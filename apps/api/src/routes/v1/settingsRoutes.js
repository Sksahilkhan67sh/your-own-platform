import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import {
  updateSettingsSchema,
  presignBrandingUploadSchema,
  confirmBrandingUploadSchema,
} from '../../validators/settingsValidators.js';
import * as settingsController from '../../controllers/settingsController.js';

export const publicSettingsRouter = Router();
publicSettingsRouter.get('/public', settingsController.getPublicSettings);

export const adminSettingsRouter = Router();
adminSettingsRouter.use(requireAuth, requireRole('admin', 'super_admin'));
adminSettingsRouter.get('/', settingsController.getAdminSettings);
adminSettingsRouter.put('/', validate(updateSettingsSchema), settingsController.updateAdminSettings);

// ---- Branding: Admin Dashboard → Branding Settings ----
// Only super_admin and admin may reach any route on this router.
export const adminBrandingRouter = Router();
adminBrandingRouter.use(requireAuth, requireRole('admin', 'super_admin'));
adminBrandingRouter.get('/', settingsController.getAdminBranding);
adminBrandingRouter.put('/', validate(updateSettingsSchema), settingsController.updateAdminBranding);
adminBrandingRouter.post(
  '/upload/presign',
  validate(presignBrandingUploadSchema),
  settingsController.presignBrandingUpload
);
adminBrandingRouter.post(
  '/upload/confirm',
  validate(confirmBrandingUploadSchema),
  settingsController.confirmBrandingUpload
);
