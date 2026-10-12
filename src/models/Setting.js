import mongoose from 'mongoose';

/** Singleton document (findOneAndUpdate with upsert) holding editable business info. */
/**
 * Seasonal storefront theme (Diwali etc.). Nothing festive renders unless
 * `enabled` is true and today falls inside the optional start/end window.
 */
const festivalSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    preset: { type: String, default: 'diwali' },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    greeting: { type: String, default: 'Happy Diwali' },
    headline: { type: String, default: 'Light up the festival with something sweet' },
    sub: { type: String, default: 'Festive cakes, gifting boxes and mithai-inspired bakes — baked fresh and delivered across the city.' },
    cta: { type: String, default: 'Shop Diwali treats' },
    ctaHref: { type: String, default: '/shop' },
    image: { type: String, default: '' },
    intensity: { type: String, enum: ['subtle', 'medium', 'festive'], default: 'medium' },
    effects: {
      banner: { type: Boolean, default: true },
      garland: { type: Boolean, default: true },
      lights: { type: Boolean, default: true },
      fireworks: { type: Boolean, default: true },
      palette: { type: Boolean, default: true },
    },
  },
  { _id: false }
);

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'business', unique: true },
    name: { type: String, default: 'BigBakeBatter Homemade Cake' },
    since: { type: Number, default: 2017 },
    phones: { type: [String], default: [] },
    email: { type: String, default: '' },
    addressFull: { type: String, default: '' },
    mapsEmbedSrc: { type: String, default: '' },
    mapsLink: { type: String, default: '' },
    deliveryFee: { type: Number, default: 49, min: 0 },
    freeDeliveryAbove: { type: Number, default: 1500, min: 0 },
    slots: { type: [String], default: ['10 AM – 12 PM', '12 PM – 2 PM', '2 PM – 4 PM', '4 PM – 6 PM', '6 PM – 8 PM'] },
    sameDayCutoffHour: { type: Number, default: 14, min: 0, max: 23 }, // 24h clock; no same-day orders after this
    hours: { type: String, default: '' },
    festival: { type: festivalSchema, default: () => ({}) },
    social: {
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export const Setting = mongoose.model('Setting', settingSchema);
