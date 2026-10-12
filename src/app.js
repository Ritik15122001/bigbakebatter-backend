import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { handleRazorpayWebhook } from './controllers/paymentController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  const isProd = process.env.NODE_ENV === 'production';
  // Behind Render/Railway/Nginx etc. — needed so rate limits see the real client IP.
  app.set('trust proxy', 1);

  const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);
  app.use(
    cors({
      // In production an empty CORS_ORIGINS allows nobody; in dev it allows everything.
      origin(origin, callback) {
        callback(null, !origin || allowedOrigins.includes(origin) || (!isProd && allowedOrigins.length === 0));
      },
    })
  );

  app.use(helmet({ crossOriginResourcePolicy: false }));

  // Razorpay signs the exact raw request bytes, so this route needs the
  // unparsed body — it must be mounted before the global express.json().
  app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);

  app.use(express.json({ limit: '2mb' }));
  app.use(mongoSanitize());
  if (process.env.NODE_ENV !== 'test') app.use(morgan(isProd ? 'combined' : 'dev'));

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
  // Public write endpoints that anyone can hit anonymously.
  const writeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
  app.post(['/api/orders', '/api/payments/razorpay/order', '/api/enquiries', '/api/newsletter/subscribe', '/api/blog/:id/comments'], writeLimiter);
  app.use('/api/orders/track', rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false }));

  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { maxAge: '30d', immutable: true }));
  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
