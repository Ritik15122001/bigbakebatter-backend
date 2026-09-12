import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';

export const listCustomers = asyncHandler(async (_req, res) => {
  const customers = await User.find({ role: 'customer' }).sort('-createdAt');

  const stats = await Order.aggregate([
    { $match: { user: { $ne: null } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$amount' } } },
  ]);
  const statsByUser = new Map(stats.map((s) => [s._id.toString(), s]));

  const withStats = customers.map((c) => {
    const s = statsByUser.get(c._id.toString());
    return {
      ...c.toObject(),
      orders: s?.orders || 0,
      spent: s?.spent || 0,
      since: c.createdAt,
    };
  });

  sendSuccess(res, { data: withStats });
});
