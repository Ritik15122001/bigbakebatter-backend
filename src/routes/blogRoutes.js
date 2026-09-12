import { Router } from 'express';
import {
  listPosts, getPublishedPosts, getPost, createPost, updatePost, deletePost,
  listComments, createComment,
} from '../controllers/blogController.js';
import { protect, restrictTo, optionalAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { blogPostSchema, blogPostUpdateSchema, commentSchema } from '../validators/blogValidators.js';

const router = Router();

router.get('/published', getPublishedPosts);
router.get('/', protect, restrictTo('admin'), listPosts);
router.get('/:id', getPost);
router.post('/', protect, restrictTo('admin'), validateBody(blogPostSchema), createPost);
router.put('/:id', protect, restrictTo('admin'), validateBody(blogPostUpdateSchema), updatePost);
router.delete('/:id', protect, restrictTo('admin'), deletePost);
router.get('/:id/comments', listComments);
router.post('/:id/comments', optionalAuth, validateBody(commentSchema), createComment);

export default router;
