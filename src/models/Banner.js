import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    kicker: { type: String, default: '' },
    headline: { type: String, required: true },
    sub: { type: String, default: '' },
    cta: { type: String, default: 'Shop now' },
    ctaHref: { type: String, default: '/shop' },
    badge: { type: [String], default: ['', ''] },
    status: { type: String, enum: ['Draft', 'Published', 'Inactive'], default: 'Draft' },
    order: { type: Number, default: 0 },
    img: { type: String, required: true },
    ph: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Banner = mongoose.model('Banner', bannerSchema);
