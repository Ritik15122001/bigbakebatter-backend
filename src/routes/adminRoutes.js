import { Router } from 'express';
import { z } from 'zod';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  listAdmins, createAdmin, removeAdmin, listSubscribers, deleteSubscriber,
  listAllComments, setCommentHidden, deleteComment,
} from '../controllers/adminController.js';

const createAdminSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/** Admin-only management endpoints that don't belong to a public resource. */
const router = Router();
router.use(protect, restrictTo('admin'));

router.get('/admins', listAdmins);
router.post('/admins', validateBody(createAdminSchema), createAdmin);
router.delete('/admins/:id', removeAdmin);

router.get('/subscribers', listSubscribers);
router.delete('/subscribers/:id', deleteSubscriber);

router.get('/comments', listAllComments);
router.patch('/comments/:id', setCommentHidden);
router.delete('/comments/:id', deleteComment);

export default router;
