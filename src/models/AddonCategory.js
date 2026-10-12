import mongoose from 'mongoose';

/** Tabs in the storefront's add-ons modal. Addon.cat stores the `key`. */
const addonCategorySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    label: { type: String, required: true, trim: true },
    icon: { type: String, default: 'gift' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const AddonCategory = mongoose.model('AddonCategory', addonCategorySchema);
