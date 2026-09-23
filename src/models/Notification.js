import mongoose from 'mongoose';

const TYPES = ['order', 'payment', 'payment_failed', 'refund', 'enquiry', 'lowstock'];

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' }, // admin route to open on click, e.g. '/orders'
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
    // Dedupes webhook-sourced notifications across Razorpay's retried
    // deliveries. Left undefined (not null) for normal notifications so the
    // sparse unique index below only applies to documents that set it.
    dedupeKey: { type: String },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

export const NOTIFICATION_TYPES = TYPES;
export const Notification = mongoose.model('Notification', notificationSchema);
