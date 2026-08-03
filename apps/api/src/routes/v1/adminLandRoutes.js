import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import {
  createLandSchema,
  updateLandSchema,
  landIdParamSchema,
  adminLandQuerySchema,
  presignImagesSchema,
  confirmImageSchema,
  deleteImageParamsSchema,
  reorderImagesSchema,
} from '../../validators/landValidators.js';
import * as landController from '../../controllers/landController.js';

const router = Router();

// Every route below requires a valid admin session.
router.use(requireAuth, requireRole('admin', 'super_admin'));

router.get('/', validate(adminLandQuerySchema), landController.listAdminLands);
router.post('/', validate(createLandSchema), landController.createLand);
router.get('/:id', validate(landIdParamSchema), landController.getAdminLandById);
router.patch('/:id', validate(updateLandSchema), landController.updateLand);
router.delete('/:id', validate(landIdParamSchema), landController.deleteLand);

router.post(
  '/:id/images/presign',
  validate(presignImagesSchema),
  landController.presignLandImages
);
router.post(
  '/:id/images/confirm',
  validate(confirmImageSchema),
  landController.confirmLandImage
);
router.patch(
  '/:id/images/reorder',
  validate(reorderImagesSchema),
  landController.reorderLandImages
);
router.delete(
  '/:id/images/:imageId',
  validate(deleteImageParamsSchema),
  landController.deleteLandImage
);

export default router;
