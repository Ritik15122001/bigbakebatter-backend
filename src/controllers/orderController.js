import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { Order } from '../models/Order.js';
import { Transaction } from '../models/Transaction.js';
import { nextSequence } from '../models/Counter.js';
import { verifyRazorpaySignature } from './paymentController.js';
import { recordTransaction } from './transactionController.js';
import { notify } from './notificationController.js';

export const createOrder = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

  const seq = await nextSequence('order');
  const order = await Order.create({
    ...req.body,
    code: `#BB${seq}`,
    user: req.user?._id,
  });
  await recordTransaction(order);
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

export const getOrderByCode = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ code: req.params.code });
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

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!order) throw ApiError.notFound('Order not found');
  sendSuccess(res, { message: `Order marked ${order.status}`, data: order });
});
