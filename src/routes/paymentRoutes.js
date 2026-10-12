import { Router } from 'express';
import { createRazorpayOrder, quoteCart } from '../controllers/paymentController.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createRazorpayOrderSchema, quoteSchema } from '../validators/paymentValidators.js';

const router = Router();

router.post('/quote', optionalAuth, validateBody(quoteSchema), quoteCart);
router.post('/razorpay/order', optionalAuth, validateBody(createRazorpayOrderSchema), createRazorpayOrder);

export default router;
