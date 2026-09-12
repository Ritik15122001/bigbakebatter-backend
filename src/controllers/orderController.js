import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { Order } from '../models/Order.js';
import { nextSequence } from '../models/Counter.js';

export const createOrder = asyncHandler(async (req, res) => {
  const seq = await nextSequence('order');
  const order = await Order.create({
    ...req.body,
    code: `#BB${seq}`,
    user: req.user?._id,
  });
  sendSuccess(res, { statusCode: 201, message: 'Order placed', data: order });
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

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!order) throw ApiError.notFound('Order not found');
  sendSuccess(res, { message: `Order marked ${order.status}`, data: order });
});
