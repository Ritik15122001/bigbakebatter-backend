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

  const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  app.use(helmet({ crossOriginResourcePolicy: false }));

  // Razorpay signs the exact raw request bytes, so this route needs the
  // unparsed body — it must be mounted before the global express.json().
  app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);

  app.use(express.json({ limit: '2mb' }));
  app.use(mongoSanitize());
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });
  app.use('/api/auth', authLimiter);

  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
