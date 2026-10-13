import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { Transaction } from '../models/Transaction.js';
import { Enquiry } from '../models/Enquiry.js';
import { Subscriber } from '../models/Subscriber.js';
import { Comment } from '../models/Comment.js';
import { escapeRegex } from '../utils/escapeRegex.js';

/* ---------- Customers ---------- */

/** One customer with everything the admin needs on a detail screen. */
export const getCustomer = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'customer' });
  if (!user) throw ApiError.notFound('Customer not found');
  const emailRx = new RegExp(`^${escapeRegex(user.email)}$`, 'i');
  const [orders, transactions, enquiries] = await Promise.all([
    Order.find({ $or: [{ user: user._id }, { email: emailRx }] }).sort('-createdAt'),
    Transaction.find({ $or: [{ user: user._id }, { email: emailRx }] }).sort('-paidAt'),
    Enquiry.find({ $or: [{ user: user._id }, { email: emailRx }] }).sort('-createdAt'),
  ]);
  const live = orders.filter((o) => o.status !== 'Cancelled');
  sendSuccess(res, {
    data: {
      customer: user,
      stats: {
        orders: orders.length,
        spent: live.reduce((s, o) => s + o.amount, 0),
        aov: live.length ? Math.round(live.reduce((s, o) => s + o.amount, 0) / live.length) : 0,
        lastOrderAt: orders[0]?.createdAt || null,
      },
      orders,
      transactions,
      enquiries,
    },
  });
});

export const setCustomerBlocked = asyncHandler(async (req, res) => {
  const blocked = req.body?.blocked === true;
  const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'customer' }, { blocked }, { new: true });
  if (!user) throw ApiError.notFound('Customer not found');
  sendSuccess(res, { message: blocked ? `${user.name} has been blocked` : `${user.name} has been unblocked`, data: user });
});

/* ---------- Admin accounts ---------- */

export const listAdmins = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: await User.find({ role: 'admin' }).sort('createdAt') });
});

export const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw ApiError.conflict('An account with this email already exists');
  const passwordHash = await User.hashPassword(password);
  const admin = await User.create({ name, email, passwordHash, role: 'admin' });
  sendSuccess(res, { statusCode: 201, message: `${admin.name} can now sign in to the admin`, data: admin });
});

export const removeAdmin = asyncHandler(async (req, res) => {
  if (String(req.user._id) === req.params.id) throw ApiError.badRequest("You can't remove your own admin account");
  if ((await User.countDocuments({ role: 'admin' })) <= 1) throw ApiError.badRequest('At least one admin account must remain');
  const admin = await User.findOneAndDelete({ _id: req.params.id, role: 'admin' });
  if (!admin) throw ApiError.notFound('Admin not found');
  sendSuccess(res, { message: `${admin.name} no longer has admin access`, data: admin });
});

/* ---------- Newsletter subscribers ---------- */

export const listSubscribers = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: await Subscriber.find().sort('-createdAt') });
});

export const deleteSubscriber = asyncHandler(async (req, res) => {
  const sub = await Subscriber.findByIdAndDelete(req.params.id);
  if (!sub) throw ApiError.notFound('Subscriber not found');
  sendSuccess(res, { message: `${sub.email} removed`, data: sub });
});

/* ---------- Blog comment moderation ---------- */

export const listAllComments = asyncHandler(async (_req, res) => {
  const comments = await Comment.find().sort('-createdAt').populate('post', 'title');
  sendSuccess(res, { data: comments });
});

export const setCommentHidden = asyncHandler(async (req, res) => {
  const comment = await Comment.findByIdAndUpdate(req.params.id, { hidden: req.body?.hidden === true }, { new: true }).populate('post', 'title');
  if (!comment) throw ApiError.notFound('Comment not found');
  sendSuccess(res, { message: comment.hidden ? 'Comment hidden from the site' : 'Comment visible again', data: comment });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findByIdAndDelete(req.params.id);
  if (!comment) throw ApiError.notFound('Comment not found');
  sendSuccess(res, { message: 'Comment deleted', data: comment });
});
