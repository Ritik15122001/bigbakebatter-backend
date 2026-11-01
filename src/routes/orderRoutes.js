import { Router } from 'express';
import {
  createOrder, getMyOrders, getMyOrderByCode, listOrders, getOrderByCode, getOrderById, updateOrderStatus, updateOrderDetails,
  setFulfillmentSelf, createShiprocketShipment, retryShiprocketAwb,
} from '../controllers/orderController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createOrderSchema, updateOrderStatusSchema, updateOrderDetailsSchema, createShiprocketShipmentSchema } from '../validators/orderValidators.js';

const router = Router();

router.post('/', protect, validateBody(createOrderSchema), createOrder);
router.get('/mine', protect, getMyOrders);
router.get('/mine/:code', protect, getMyOrderByCode);
router.get('/track/:code', getOrderByCode);
router.get('/', protect, restrictTo('admin'), listOrders);
router.get('/:id', protect, restrictTo('admin'), getOrderById);
router.patch('/:id', protect, restrictTo('admin'), validateBody(updateOrderDetailsSchema), updateOrderDetails);
router.patch('/:id/status', protect, restrictTo('admin'), validateBody(updateOrderStatusSchema), updateOrderStatus);
router.patch('/:id/fulfillment', protect, restrictTo('admin'), setFulfillmentSelf);
router.post('/:id/fulfillment/shiprocket', protect, restrictTo('admin'), validateBody(createShiprocketShipmentSchema), createShiprocketShipment);
router.post('/:id/fulfillment/shiprocket/retry-awb', protect, restrictTo('admin'), retryShiprocketAwb);

export default router;
