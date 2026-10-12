import mongoose from 'mongoose';

/** Percentage-off promo codes, validated and applied server-side at checkout. */
const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    pct: { type: Number, required: true, min: 1, max: 100 },
    description: { type: String, default: '' },
    minSubtotal: { type: Number, default: 0, min: 0 },
    firstOrderOnly: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

export const Coupon = mongoose.model('Coupon', couponSchema);
