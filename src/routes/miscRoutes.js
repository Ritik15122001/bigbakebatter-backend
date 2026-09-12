import { Router } from 'express';
import { getSettings, updateSettings, subscribeNewsletter, uploadImage } from '../controllers/miscController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { settingUpdateSchema } from '../validators/settingValidators.js';
import { upload } from '../middleware/upload.js';

export const settingsRouter = Router();
settingsRouter.get('/', getSettings);
settingsRouter.put('/', protect, restrictTo('admin'), validateBody(settingUpdateSchema), updateSettings);

export const newsletterRouter = Router();
newsletterRouter.post('/subscribe', subscribeNewsletter);

export const uploadRouter = Router();
uploadRouter.post('/', protect, restrictTo('admin'), upload.single('image'), uploadImage);
