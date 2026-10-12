import { Router } from 'express';
import { crudFactory } from '../utils/crudFactory.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { Coupon } from '../models/Coupon.js';
import { couponSchema, couponUpdateSchema } from '../validators/catalogValidators.js';

// Admin-only in full — listing coupons publicly would leak every code.
// Customers apply codes through POST /payments/quote.
const router = Router();
const { list, getOne, create, update, remove } = crudFactory(Coupon, { label: 'Coupon', sort: 'code' });

router.use(protect, restrictTo('admin'));
router.get('/', list);
router.get('/:id', getOne);
router.post('/', validateBody(couponSchema), create);
router.put('/:id', validateBody(couponUpdateSchema), update);
router.delete('/:id', remove);

export default router;
