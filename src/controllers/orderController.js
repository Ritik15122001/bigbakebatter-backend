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
import { loadShiprocketConfig, createAdhocOrder, assignAwb, ShiprocketUnavailableError } from '../services/shiprocket.js';

export const createOrder = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, items, promoCode, ...details } = req.body;
  verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

  // Idempotent: a double-submit (or a replayed payment) returns the existing order.
  const existing = await Order.findOne({ razorpayPaymentId });
  if (existing) return sendSuccess(res, { message: 'Order placed', data: existing });

  // Re-price from the database and make sure that is exactly what Razorpay charged.
  const quote = await priceCart(items, { promoCode, email: details.email, pincode: details.pincode, userId: req.user?._id });
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
    shippingWeightKg: quote.shippingWeightKg,
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

/** Switches an order back to in-house delivery. Blocked once a real Shiprocket AWB exists. */
export const setFulfillmentSelf = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.fulfillment?.awbCode) {
    throw ApiError.badRequest('This order already has a live Shiprocket shipment — cancel it from the Shiprocket dashboard first.');
  }
  order.fulfillment = { method: 'Self' };
  await order.save();
  sendSuccess(res, { message: `Order ${order.code} set to self-delivery`, data: order });
});

/** Creates a Shiprocket adhoc order and assigns an AWB in one step. */
export const createShiprocketShipment = asyncHandler(async (req, res) => {
  const { city, state } = req.body;
  if (!city?.trim() || !state?.trim()) throw ApiError.badRequest('City and state are required to create a Shiprocket shipment.');

  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (!order.pincode) throw ApiError.badRequest('This order has no delivery pincode on file.');
  if (order.fulfillment?.shiprocketOrderId) throw ApiError.badRequest('A Shiprocket order already exists for this order — use retry if the AWB failed.');

  const cfg = await loadShiprocketConfig();
  if (!cfg?.pickupLocation) throw ApiError.badRequest('Set up your Shiprocket pickup location in Settings → Shiprocket first.');

  const [firstName, ...rest] = (order.customer || 'Customer').trim().split(' ');
  const payload = {
    order_id: order.code,
    order_date: new Date().toISOString().slice(0, 16).replace('T', ' '),
    pickup_location: cfg.pickupLocation,
    billing_customer_name: firstName,
    billing_last_name: rest.join(' '),
    billing_address: order.addr,
    billing_city: city.trim(),
    billing_pincode: order.pincode,
    billing_state: state.trim(),
    billing_country: 'India',
    billing_email: order.email,
    billing_phone: order.phone,
    shipping_is_billing: true,
    order_items: order.items.map((i) => ({
      name: i.name,
      sku: String(i.pid || i.name).slice(0, 50),
      units: i.qty,
      selling_price: i.unit,
    })),
    payment_method: 'Prepaid',
    sub_total: order.subtotal ?? order.amount,
    length: 10,
    breadth: 10,
    height: 10,
    weight: order.shippingWeightKg || 1,
  };

  try {
    const created = await createAdhocOrder(payload);
    if (!created?.shipment_id) throw ApiError.badRequest(created?.message || 'Shiprocket did not return a shipment id.');
    order.fulfillment = {
      method: 'Shiprocket',
      shiprocketOrderId: String(created.order_id || ''),
      shiprocketShipmentId: String(created.shipment_id),
      assignedAt: new Date(),
      assignedBy: req.user?.name || req.user?.email || 'Admin',
      lastError: '',
    };
    try {
      const awb = await assignAwb({ shipmentId: created.shipment_id });
      const assigned = awb?.response?.data || awb?.data || awb;
      if (assigned?.awb_code) {
        order.fulfillment.awbCode = String(assigned.awb_code);
        order.fulfillment.courierName = assigned.courier_name || '';
        order.fulfillment.status = 'AWB assigned';
      } else {
        order.fulfillment.lastError = awb?.message || 'Shiprocket order created, but AWB assignment did not return a code.';
      }
    } catch (awbErr) {
      order.fulfillment.lastError = awbErr.message || 'AWB assignment failed.';
    }
    await order.save();
    sendSuccess(res, { message: order.fulfillment.awbCode ? 'Shiprocket shipment created' : 'Shiprocket order created, but AWB assignment needs a retry', data: order });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const msg = err instanceof ShiprocketUnavailableError ? `Could not reach Shiprocket: ${err.message}` : err.message;
    throw ApiError.badRequest(msg);
  }
});

/** Re-attempts AWB assignment against an already-created Shiprocket order (never re-creates it). */
export const retryShiprocketAwb = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (!order.fulfillment?.shiprocketShipmentId) throw ApiError.badRequest('No Shiprocket shipment exists for this order yet.');
  if (order.fulfillment.awbCode) throw ApiError.badRequest('This order already has an AWB assigned.');

  try {
    const awb = await assignAwb({ shipmentId: order.fulfillment.shiprocketShipmentId });
    const assigned = awb?.response?.data || awb?.data || awb;
    if (!assigned?.awb_code) throw ApiError.badRequest(awb?.message || 'AWB assignment did not return a code.');
    order.fulfillment.awbCode = String(assigned.awb_code);
    order.fulfillment.courierName = assigned.courier_name || '';
    order.fulfillment.status = 'AWB assigned';
    order.fulfillment.lastError = '';
    await order.save();
    sendSuccess(res, { message: 'AWB assigned', data: order });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const msg = err instanceof ShiprocketUnavailableError ? `Could not reach Shiprocket: ${err.message}` : err.message;
    order.fulfillment.lastError = msg;
    await order.save();
    throw ApiError.badRequest(msg);
  }
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
