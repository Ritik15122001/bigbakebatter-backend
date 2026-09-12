import { Router } from 'express';
import {
  listBanners, getLiveBanners, createBanner, updateBanner, deleteBanner, reorderBanner,
} from '../controllers/bannerController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { bannerSchema, bannerUpdateSchema } from '../validators/bannerValidators.js';

const router = Router();

router.get('/live', getLiveBanners);
router.get('/', protect, restrictTo('admin'), listBanners);
router.post('/', protect, restrictTo('admin'), validateBody(bannerSchema), createBanner);
router.put('/:id', protect, restrictTo('admin'), validateBody(bannerUpdateSchema), updateBanner);
router.patch('/:id/reorder', protect, restrictTo('admin'), reorderBanner);
router.delete('/:id', protect, restrictTo('admin'), deleteBanner);

export default router;
