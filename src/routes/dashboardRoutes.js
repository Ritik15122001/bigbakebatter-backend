import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, restrictTo('admin'), getDashboardStats);

export default router;
