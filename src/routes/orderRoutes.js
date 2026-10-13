import { Router } from 'express';
import {
  createOrder, getMyOrders, getMyOrderByCode, listOrders, getOrderByCode, getOrderById, updateOrderStatus, updateOrderDetails,
} from '../controllers/orderController.js';
import { protect, restrictTo, optionalAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createOrderSchema, updateOrderStatusSchema, updateOrderDetailsSchema } from '../validators/orderValidators.js';

const router = Router();

router.post('/', optionalAuth, validateBody(createOrderSchema), createOrder);
router.get('/mine', protect, getMyOrders);
router.get('/mine/:code', protect, getMyOrderByCode);
router.get('/track/:code', getOrderByCode);
router.get('/', protect, restrictTo('admin'), listOrders);
router.get('/:id', protect, restrictTo('admin'), getOrderById);
router.patch('/:id', protect, restrictTo('admin'), validateBody(updateOrderDetailsSchema), updateOrderDetails);
router.patch('/:id/status', protect, restrictTo('admin'), validateBody(updateOrderStatusSchema), updateOrderStatus);

export default router;
