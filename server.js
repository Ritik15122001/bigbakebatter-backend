import 'dotenv/config';
import { createApp } from './src/app.js';
import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';

const PORT = process.env.PORT || 5050;

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));

function checkEnv() {
  const missing = ['MONGO_URI', 'JWT_SECRET', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'].filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  const weak = process.env.JWT_SECRET.length < 32 || /change|secret|example|your/i.test(process.env.JWT_SECRET);
  if (weak) {
    const msg = 'JWT_SECRET is weak or a placeholder — generate one with `openssl rand -hex 64`';
    if (process.env.NODE_ENV === 'production') throw new Error(msg);
    console.warn(`[warn] ${msg}`);
  }
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.CORS_ORIGINS) console.warn('[warn] CORS_ORIGINS is empty — browsers will be blocked');
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) console.warn('[warn] RAZORPAY_WEBHOOK_SECRET is not set — webhooks will be rejected');
  }
}

async function start() {
  checkEnv();
  await connectDB();
  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`BigBakeBatter API listening on http://localhost:${PORT}`);
  });
  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
