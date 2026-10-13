import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Transaction } from '../models/Transaction.js';
import { nextSequence } from '../models/Counter.js';
import { verifyRazorpaySignature } from './paymentController.js';
import { recordTransaction } from './transactionController.js';
import { notify } from './notificationController.js';
import { razorpay } from '../config/razorpay.js';
import { priceCart } from '../utils/pricing.js';

export const createOrder = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, items, promoCode, ...details } = req.body;
  verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

  // Idempotent: a double-submit (or a replayed payment) returns the existing order.
  const existing = await Order.findOne({ razorpayPaymentId });
  if (existing) return sendSuccess(res, { message: 'Order placed', data: existing });

  // Re-price from the database and make sure that is exactly what Razorpay charged.
  const quote = await priceCart(items, { promoCode, email: details.email, userId: req.user?._id });
  const rzpOrder = await razorpay.orders.fetch(razorpayOrderId);
  if (Number(rzpOrder.amount) !== Math.round(quote.total * 100)) {
    throw ApiError.badRequest('Payment amount does not match your cart. Please contact us with your payment ID.');
  }

  const seq = await nextSequence('order');
  const order = await Order.create({
    ...details,
    items: quote.lines.map((l, i) => ({ ...l, eggless: !!items[i]?.eggless, note: items[i]?.msg || '' })),
    amount: quote.total,
    subtotal: quote.subtotal,
    discount: quote.discount,
    delivery: quote.delivery,
    promoCode: quote.promoCode,
    razorpayOrderId,
    razorpayPaymentId,
    code: `#BB${seq}`,
    user: req.user?._id,
    statusHistory: [{ status: 'New', at: new Date(), by: 'Customer' }],
  });
  await recordTransaction(order);
  await Promise.all(
    quote.lines.map((l) => Product.updateOne({ _id: l.pid }, { $inc: { sold: l.qty } }))
  );
  await notify({
    type: 'order',
    title: `New order ${order.code}`,
    message: `${order.customer} placed an order for ₹${order.amount.toLocaleString('en-IN')}`,
    link: '/orders',
    meta: { orderId: order._id, code: order.code },
  });
  sendSuccess(res, { statusCode: 201, message: 'Order placed', data: order });
});

export const getMyOrderByCode = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ code: req.params.code, user: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  sendSuccess(res, { data: order });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  sendSuccess(res, { data: orders });
});

export const listOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status && status !== 'All' ? { status } : {};
  const orders = await Order.find(filter).sort('-createdAt');
  sendSuccess(res, { data: orders });
});

/**
 * Public tracking. Codes are sequential, so only non-identifying fields are
 * returned — no name, phone, email, address or payment ids.
 */
export const getOrderByCode = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ code: req.params.code })
    .select('code status deliver slot items.name items.qty items.weight createdAt updatedAt')
    .lean();
  if (!order) throw ApiError.notFound('Order not found');
  sendSuccess(res, { data: order });
});

/** Admin order detail page: the order plus its linked payment record. */
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  const transaction = await Transaction.findOne({ order: order._id });
  sendSuccess(res, { data: { order, transaction } });
});

/** Admin edits to delivery details / internal note (prices and items are never editable). */
export const updateOrderDetails = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!order) throw ApiError.notFound('Order not found');
  sendSuccess(res, { message: `Order ${order.code} updated`, data: order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, $push: { statusHistory: { status: req.body.status, at: new Date(), by: req.user?.name || 'Admin' } } },
    { new: true }
  );
  if (!order) throw ApiError.notFound('Order not found');
  sendSuccess(res, { message: `Order marked ${order.status}`, data: order });
});
