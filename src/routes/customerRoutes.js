import { Router } from 'express';
import { listCustomers } from '../controllers/customerController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, restrictTo('admin'), listCustomers);

export default router;
