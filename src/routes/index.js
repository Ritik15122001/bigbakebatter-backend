import { Router } from 'express';
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
  categoryRouter, flavourRouter, occasionRouter, addonRouter, faqRouter, reviewRouter,
} from './catalogRoutes.js';
import { settingsRouter, newsletterRouter, uploadRouter } from './miscRoutes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, message: 'API is up' }));

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRouter);
router.use('/flavours', flavourRouter);
router.use('/occasions', occasionRouter);
router.use('/addons', addonRouter);
router.use('/faqs', faqRouter);
router.use('/reviews', reviewRouter);
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
