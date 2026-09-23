import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../controllers/notificationController.js';

const router = Router();

router.use(protect, restrictTo('admin'));
router.get('/', listNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

export default router;
