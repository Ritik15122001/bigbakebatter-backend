import { Router } from 'express';
import { listCustomers } from '../controllers/customerController.js';
import { getCustomer, setCustomerBlocked } from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, restrictTo('admin'), listCustomers);
router.get('/:id', protect, restrictTo('admin'), getCustomer);
router.patch('/:id/block', protect, restrictTo('admin'), setCustomerBlocked);

export default router;
