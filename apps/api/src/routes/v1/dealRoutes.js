import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import {
  createDealSchema,
  updateDealSchema,
  dealIdParamSchema,
  dealListQuerySchema,
} from '../../validators/dealValidators.js';
import * as dealController from '../../controllers/dealController.js';

const router = Router();

// Every route here requires a valid admin session — deals are 100% internal.
router.use(requireAuth, requireRole('admin', 'super_admin'));

router.get('/summary', dealController.getCommissionSummary);
router.get('/', validate(dealListQuerySchema), dealController.listDeals);
router.post('/', validate(createDealSchema), dealController.createDeal);
router.get('/:id', validate(dealIdParamSchema), dealController.getDealById);
router.patch('/:id', validate(updateDealSchema), dealController.updateDeal);
router.delete('/:id', validate(dealIdParamSchema), dealController.deleteDeal);

export default router;
