import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import bannerRoutes from './bannerRoutes.js';
import blogRoutes from './blogRoutes.js';
import orderRoutes from './orderRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import enquiryRoutes from './enquiryRoutes.js';
import customerRoutes from './customerRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import {
  categoryRouter, flavourRouter, occasionRouter, addonRouter, faqRouter, reviewRouter, announcementRouter, addonCategoryRouter,
} from './catalogRoutes.js';
import contentRoutes from './contentRoutes.js';
import couponRoutes from './couponRoutes.js';
import { settingsRouter, newsletterRouter, uploadRouter } from './miscRoutes.js';

const router = Router();

router.get('/health', (_req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ success: dbUp, message: dbUp ? 'API is up' : 'Database unavailable' });
});

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRouter);
router.use('/flavours', flavourRouter);
router.use('/occasions', occasionRouter);
router.use('/addons', addonRouter);
router.use('/faqs', faqRouter);
router.use('/reviews', reviewRouter);
router.use('/announcements', announcementRouter);
router.use('/addon-categories', addonCategoryRouter);
router.use('/content', contentRoutes);
router.use('/coupons', couponRoutes);
router.use('/banners', bannerRoutes);
router.use('/blog', blogRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/transactions', transactionRoutes);
router.use('/enquiries', enquiryRoutes);
router.use('/customers', customerRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRouter);
router.use('/newsletter', newsletterRouter);
router.use('/uploads', uploadRouter);

export default router;
