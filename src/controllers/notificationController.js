import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { Notification } from '../models/Notification.js';

/**
 * Creates a notification for the admin feed. Used by controllers (new order,
 * new enquiry) and the Razorpay webhook. `dedupeKey`, when given, silently
 * no-ops on a duplicate instead of throwing (guards against webhook retries).
 */
export async function notify({ type, title, message = '', link = '', meta = {}, dedupeKey }) {
  try {
    const doc = { type, title, message, link, meta };
    if (dedupeKey) doc.dedupeKey = dedupeKey; // omit entirely rather than send null — see model comment
    return await Notification.create(doc);
  } catch (err) {
    if (err?.code === 11000) return null; // duplicate dedupeKey, already recorded
    throw err;
  }
}

export const listNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const [items, unreadCount] = await Promise.all([
    Notification.find({}).sort('-createdAt').limit(limit),
    Notification.countDocuments({ read: false }),
  ]);
  sendSuccess(res, { data: { items, unreadCount } });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  sendSuccess(res, { message: 'Marked read' });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ read: false }, { read: true });
  sendSuccess(res, { message: 'All marked read' });
});
