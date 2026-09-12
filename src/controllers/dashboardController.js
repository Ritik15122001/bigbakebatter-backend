import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Enquiry } from '../models/Enquiry.js';

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const [orders, lowStock, topSelling, pendingEnquiries] = await Promise.all([
    Order.find().sort('-createdAt'),
    Product.find({ stock: { $in: ['Low stock', 'Out of stock'] } }),
    Product.find().sort('-sold').limit(5),
    Enquiry.find({ status: 'New' }).sort('-createdAt'),
  ]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  const aov = orders.length ? Math.round(totalRevenue / orders.length) : 0;
  const newOrdersCount = orders.filter((o) => o.status === 'New').length;

  sendSuccess(res, {
    data: {
      totalRevenue,
      totalOrders: orders.length,
      aov,
      newOrdersCount,
      recentOrders: orders.slice(0, 6),
      lowStock,
      topSelling,
      pendingEnquiries,
    },
  });
});
