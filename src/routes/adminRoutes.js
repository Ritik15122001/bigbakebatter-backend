import { Router } from 'express';
import { z } from 'zod';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  listAdmins, createAdmin, removeAdmin, listSubscribers, deleteSubscriber,
  listAllComments, setCommentHidden, deleteComment,
} from '../controllers/adminController.js';
import { getSmtp, updateSmtp, testSmtp } from '../controllers/smtpController.js';
import { getShiprocketConfig, updateShiprocketConfig, testShiprocketConnection } from '../controllers/shiprocketConfigController.js';

const createAdminSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const email = z.string().trim().toLowerCase().email('Enter a valid email');
const optionalEmail = z.union([email, z.literal('')]);
const smtpSchema = z.object({
  enabled: z.boolean().optional(),
  host: z.string().trim().max(200).regex(/^[a-z0-9.-]*$/i, 'Enter a server name like smtp.gmail.com').optional(),
  port: z.coerce.number().int().min(1, 'Port must be 1–65535').max(65535, 'Port must be 1–65535').optional(),
  security: z.enum(['ssl', 'starttls', 'none']).optional(),
  username: z.string().trim().max(200).optional(),
  password: z.string().max(500).optional(),
  clearPassword: z.boolean().optional(),
  fromName: z.string().trim().max(80).optional(),
  fromEmail: optionalEmail.optional(),
  replyTo: optionalEmail.optional(),
  notifyEmail: optionalEmail.optional(),
});
const smtpTestSchema = smtpSchema.omit({ enabled: true, clearPassword: true }).extend({ to: email });

const shiprocketCredsSchema = z.object({
  email: optionalEmail.optional(),
  password: z.string().max(500).optional(),
  clearPassword: z.boolean().optional(),
  pickupLocation: z.string().trim().max(120).optional(),
  pickupPincode: z.string().trim().regex(/^\d{0,6}$/, 'Enter a 6-digit pincode').optional(),
});
const shiprocketConfigSchema = z.object({
  mode: z.enum(['test', 'live']).optional(),
  apiBaseUrl: z.string().trim().url().optional(),
  test: shiprocketCredsSchema.optional(),
  live: shiprocketCredsSchema.optional(),
});
const shiprocketTestSchema = shiprocketConfigSchema;

/** Admin-only management endpoints that don't belong to a public resource. */
const router = Router();
router.use(protect, restrictTo('admin'));

router.get('/smtp', getSmtp);
router.put('/smtp', validateBody(smtpSchema), updateSmtp);
router.post('/smtp/test', validateBody(smtpTestSchema), testSmtp);

router.get('/shiprocket', getShiprocketConfig);
router.put('/shiprocket', validateBody(shiprocketConfigSchema), updateShiprocketConfig);
router.post('/shiprocket/test', validateBody(shiprocketTestSchema), testShiprocketConnection);

router.get('/admins', listAdmins);
router.post('/admins', validateBody(createAdminSchema), createAdmin);
router.delete('/admins/:id', removeAdmin);

router.get('/subscribers', listSubscribers);
router.delete('/subscribers/:id', deleteSubscriber);

router.get('/comments', listAllComments);
router.patch('/comments/:id', setCommentHidden);
router.delete('/comments/:id', deleteComment);

export default router;
