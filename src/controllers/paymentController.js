import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { razorpay } from '../config/razorpay.js';
import { Transaction } from '../models/Transaction.js';
import { applyRefund } from './transactionController.js';
import { notify } from './notificationController.js';

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // paise
    currency: 'INR',
    receipt: `rcpt_${Date.now()}`,
  });
  sendSuccess(res, {
    statusCode: 201,
    data: { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID },
  });
});

/** Verifies a Razorpay payment's HMAC signature. Throws if it doesn't match. */
export function verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  if (expected !== razorpaySignature) {
    throw ApiError.badRequest('Payment verification failed');
  }
}

/**
 * Razorpay webhook receiver — server-to-server confirmation of payment
 * events, independent of whether the customer's browser ever completes the
 * checkout call. Mounted with express.raw() so req.body is the exact byte
 * buffer Razorpay signed; that raw buffer (not the parsed JSON) is what the
 * signature is computed over.
 *
 * Configure this URL in the Razorpay dashboard (Settings → Webhooks) as
 * `<your-api-url>/api/payments/webhook`, and set RAZORPAY_WEBHOOK_SECRET to
 * the secret shown there.
 */
export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const rawBody = req.body; // Buffer

  if (secret) {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (!signature || expected !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }
  } else {
    // No secret configured yet (e.g. local dev before the webhook is set up
    // in the Razorpay dashboard) — process the event but skip verification
    // rather than silently dropping every webhook call.
    console.warn('[razorpay webhook] RAZORPAY_WEBHOOK_SECRET is not set — accepting without signature verification');
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
  }

  switch (event.event) {
    case 'payment.captured': {
      const payment = event.payload?.payment?.entity;
      if (payment) {
        await notify({
          type: 'payment',
          title: 'Payment captured',
          message: `₹${(payment.amount / 100).toLocaleString('en-IN')} captured via ${(payment.method || 'razorpay').toUpperCase()}`,
          link: '/transactions',
          meta: { razorpayOrderId: payment.order_id, razorpayPaymentId: payment.id },
          dedupeKey: `webhook:payment.captured:${payment.id}`,
        });
      }
      break;
    }
    case 'payment.failed': {
      const payment = event.payload?.payment?.entity;
      if (payment) {
        await notify({
          type: 'payment_failed',
          title: 'Payment failed',
          message: payment.error_description || `A ${(payment.method || 'razorpay').toUpperCase()} payment attempt failed`,
          link: '/transactions',
          meta: { razorpayOrderId: payment.order_id, razorpayPaymentId: payment.id },
          dedupeKey: `webhook:payment.failed:${payment.id}`,
        });
      }
      break;
    }
    case 'refund.processed': {
      const refund = event.payload?.refund?.entity;
      if (refund) {
        const txn = await Transaction.findOne({ razorpayPaymentId: refund.payment_id });
        if (txn && txn.status === 'Paid') {
          await applyRefund(txn);
          await notify({
            type: 'refund',
            title: `Refund processed — ${txn.txnId}`,
            message: `₹${txn.amount.toLocaleString('en-IN')} refunded for order ${txn.orderCode || txn.txnId}`,
            link: '/transactions',
            meta: { transactionId: txn._id, razorpayPaymentId: refund.payment_id },
            dedupeKey: `webhook:refund.processed:${refund.id}`,
          });
        }
      }
      break;
    }
    default:
      break; // other event types aren't acted on yet
  }

  // Razorpay only cares that we returned 2xx; body content is ignored.
  res.status(200).json({ success: true });
});
