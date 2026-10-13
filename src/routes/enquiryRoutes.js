import { Router } from 'express';
import { createEnquiry, listEnquiries, getMyEnquiries, updateEnquiryStatus, updateEnquiry, deleteEnquiry } from '../controllers/enquiryController.js';
import { protect, restrictTo, optionalAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createEnquirySchema, updateEnquiryStatusSchema, updateEnquirySchema } from '../validators/enquiryValidators.js';

const router = Router();

router.post('/', optionalAuth, validateBody(createEnquirySchema), createEnquiry);
router.get('/mine', protect, getMyEnquiries);
router.get('/', protect, restrictTo('admin'), listEnquiries);
router.patch('/:id', protect, restrictTo('admin'), validateBody(updateEnquirySchema), updateEnquiry);
router.delete('/:id', protect, restrictTo('admin'), deleteEnquiry);
router.patch('/:id/status', protect, restrictTo('admin'), validateBody(updateEnquiryStatusSchema), updateEnquiryStatus);

export default router;
