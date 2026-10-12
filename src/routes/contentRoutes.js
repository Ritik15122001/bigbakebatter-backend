import { Router } from 'express';
import { getAllContent, getContentSchema, updateContent, resetContent } from '../controllers/contentController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllContent);
router.get('/schema', protect, restrictTo('admin'), getContentSchema);
router.put('/:key', protect, restrictTo('admin'), updateContent);
router.delete('/:key', protect, restrictTo('admin'), resetContent);

export default router;
