import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Enquiry } from '../models/Enquiry.js';
import { User } from '../models/User.js';
import { Subscriber } from '../models/Subscriber.js';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Orders store the delivery date as text like "14 Oct 2026" (shop time, IST).
const istDate = (offsetDays = 0) => new Date(Date.now() + 5.5 * 3600e3 + offsetDays * 864e5);
const deliverLabel = (d) => `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const dayKey = (d) => new Date(new Date(d).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10);

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const [orders, lowStock, topSelling, pendingEnquiries] = await Promise.all([
    Order.find().sort('-createdAt'),
    Product.find({ stock: { $in: ['Low stock', 'Out of stock'] } }),
    Product.find().sort('-sold').limit(5),
    Enquiry.find({ status: 'New' }).sort('-createdAt'),
  ]);

  // Cancelled orders are refunded/void, so they don't count towards revenue.
  const live = orders.filter((o) => o.status !== 'Cancelled');
  const totalRevenue = live.reduce((sum, o) => sum + o.amount, 0);
  const aov = live.length ? Math.round(totalRevenue / live.length) : 0;
  const newOrdersCount = orders.filter((o) => o.status === 'New').length;

  const today = deliverLabel(istDate(0));
  const tomorrow = deliverLabel(istDate(1));
  const active = orders.filter((o) => !['Delivered', 'Cancelled'].includes(o.status));
  const statusCounts = orders.reduce((acc, o) => ({ ...acc, [o.status]: (acc[o.status] || 0) + 1 }), {});

  // Daily revenue + order count for the last 30 days (IST), oldest first.
  const days = Array.from({ length: 30 }, (_, i) => istDate(i - 29).toISOString().slice(0, 10));
  const byDay = new Map(days.map((d) => [d, { date: d, revenue: 0, orders: 0 }]));
  for (const o of live) {
    const k = dayKey(o.createdAt);
    if (byDay.has(k)) {
      byDay.get(k).revenue += o.amount;
      byDay.get(k).orders += 1;
    }
  }
  const series = [...byDay.values()];
  const sum = (arr, f) => arr.reduce((t, x) => t + f(x), 0);
  const last7 = sum(series.slice(-7), (d) => d.revenue);
  const prev7 = sum(series.slice(-14, -7), (d) => d.revenue);

  const [customers, subscribers, newCustomers30] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Subscriber.countDocuments(),
    User.countDocuments({ role: 'customer', createdAt: { $gte: new Date(Date.now() - 30 * 864e5) } }),
  ]);

  sendSuccess(res, {
    data: {
      todayLabel: today,
      todayDeliveries: active.filter((o) => o.deliver === today),
      tomorrowDeliveries: active.filter((o) => o.deliver === tomorrow),
      activeOrders: active.length,
      statusCounts,
      series,
      revenue7: last7,
      revenuePrev7: prev7,
      customers,
      newCustomers30,
      subscribers,
      totalRevenue,
      totalOrders: live.length,
      aov,
      newOrdersCount,
      recentOrders: orders.slice(0, 6),
      lowStock,
      topSelling,
      pendingEnquiries,
    },
  });
});
