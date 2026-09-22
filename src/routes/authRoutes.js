import { Router } from 'express';
import {
  register, login, me, updateMe, changePassword,
  addAddress, updateAddress, deleteAddress, setDefaultAddress,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  registerSchema, loginSchema, changePasswordSchema, addressSchema, addressUpdateSchema,
} from '../validators/authValidators.js';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', protect, me);
router.patch('/me', protect, updateMe);
router.patch('/me/password', protect, validateBody(changePasswordSchema), changePassword);

router.post('/me/addresses', protect, validateBody(addressSchema), addAddress);
router.patch('/me/addresses/:addressId', protect, validateBody(addressUpdateSchema), updateAddress);
router.patch('/me/addresses/:addressId/default', protect, setDefaultAddress);
router.delete('/me/addresses/:addressId', protect, deleteAddress);

export default router;
