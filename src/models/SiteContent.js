import mongoose from 'mongoose';

/**
 * Admin-edited copy for one storefront section, keyed like "home.trust".
 * Only overrides are stored; anything missing falls back to the defaults
 * declared in src/content/sections.js.
 */
const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false }
);

export const SiteContent = mongoose.model('SiteContent', siteContentSchema);
