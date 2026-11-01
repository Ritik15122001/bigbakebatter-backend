import { Router } from 'express';
import { createRazorpayOrder, quoteCart } from '../controllers/paymentController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createRazorpayOrderSchema, quoteSchema } from '../validators/paymentValidators.js';

const router = Router();

// Anyone can see what their cart would cost (shown on the Cart page before sign-in);
// only a signed-in user can actually start paying, since an order requires an account.
router.post('/quote', optionalAuth, validateBody(quoteSchema), quoteCart);
router.post('/razorpay/order', protect, validateBody(createRazorpayOrderSchema), createRazorpayOrder);

export default router;
