import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { Transaction } from '../models/Transaction.js';
import { Order } from '../models/Order.js';
import { nextSequence } from '../models/Counter.js';

/** Writes the payment record for a freshly paid order. */
export async function recordTransaction(order) {
  const seq = await nextSequence('transaction');
  return Transaction.create({
    txnId: `TXN${10000 + seq}`,
    order: order._id,
    orderCode: order.code,
    user: order.user,
    customer: order.customer,
    email: order.email,
    amount: order.amount,
    method: order.pay,
    status: 'Paid',
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
    paidAt: order.createdAt || new Date(),
  });
}

export const getMyTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id }).sort('-paidAt');
  sendSuccess(res, { data: transactions });
});

export const listTransactions = asyncHandler(async (req, res) => {
  const { status, method, q, from, to } = req.query;
  const filter = {};
  if (status && status !== 'All') filter.status = status;
  if (method && method !== 'All') filter.method = method;
  if (from || to) {
    filter.paidAt = {};
    if (from) filter.paidAt.$gte = new Date(from);
    if (to) filter.paidAt.$lte = new Date(`${to}T23:59:59.999Z`);
  }
  if (q) {
    filter.$or = [
      { txnId: { $regex: q, $options: 'i' } },
      { orderCode: { $regex: q, $options: 'i' } },
      { customer: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { razorpayPaymentId: { $regex: q, $options: 'i' } },
    ];
  }
  const transactions = await Transaction.find(filter).sort('-paidAt');
  sendSuccess(res, { data: transactions });
});

const sumOf = (list) => list.reduce((total, t) => total + t.amount, 0);

export const getFinanceSummary = asyncHandler(async (_req, res) => {
  const all = await Transaction.find().sort('-paidAt');
  const paid = all.filter((t) => t.status === 'Paid');
  const refunded = all.filter((t) => t.status === 'Refunded');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOf7d = new Date(startOfToday);
  startOf7d.setDate(startOf7d.getDate() - 6);
  const startOf30d = new Date(startOfToday);
  startOf30d.setDate(startOf30d.getDate() - 29);

  const inRange = (from) => paid.filter((t) => new Date(t.paidAt) >= from);

  // last 7 days, oldest first, for the revenue chart
  const daily = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(startOfToday);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const dayTxns = paid.filter((t) => {
      const at = new Date(t.paidAt);
      return at >= day && at < next;
    });
    daily.push({
      date: day.toISOString(),
      label: day.toLocaleDateString('en-GB', { weekday: 'short' }),
      revenue: sumOf(dayTxns),
      count: dayTxns.length,
    });
  }

  const byMethod = ['UPI', 'Card', 'Net Banking'].map((method) => {
    const list = paid.filter((t) => t.method === method);
    return { method, revenue: sumOf(list), count: list.length };
  });

  const grossRevenue = sumOf(paid);
  const refundedAmount = sumOf(refunded);

  sendSuccess(res, {
    data: {
      grossRevenue,
      refundedAmount,
      netRevenue: grossRevenue - refundedAmount,
      totalTransactions: all.length,
      paidCount: paid.length,
      refundedCount: refunded.length,
      failedCount: all.filter((t) => t.status === 'Failed').length,
      aov: paid.length ? Math.round(grossRevenue / paid.length) : 0,
      todayRevenue: sumOf(inRange(startOfToday)),
      todayCount: inRange(startOfToday).length,
      last7dRevenue: sumOf(inRange(startOf7d)),
      last30dRevenue: sumOf(inRange(startOf30d)),
      daily,
      byMethod,
      recent: all.slice(0, 8),
    },
  });
});

export const refundTransaction = asyncHandler(async (req, res) => {
  const txn = await Transaction.findById(req.params.id);
  if (!txn) throw ApiError.notFound('Transaction not found');
  if (txn.status === 'Refunded') throw ApiError.badRequest('This transaction is already refunded');

  txn.status = 'Refunded';
  txn.refundedAt = new Date();
  await txn.save();

  if (txn.order) {
    await Order.findByIdAndUpdate(txn.order, { status: 'Cancelled' });
  }

  sendSuccess(res, { message: `${txn.txnId} marked refunded`, data: txn });
});
