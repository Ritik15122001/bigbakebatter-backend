import { Router } from 'express';
import { createRazorpayOrder } from '../controllers/paymentController.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createRazorpayOrderSchema } from '../validators/paymentValidators.js';

const router = Router();

router.post('/razorpay/order', optionalAuth, validateBody(createRazorpayOrderSchema), createRazorpayOrder);

export default router;
