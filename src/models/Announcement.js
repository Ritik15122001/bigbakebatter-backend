import mongoose from 'mongoose';

/** One rotating message in the storefront's top announcement bar. */
const announcementSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    icon: { type: String, default: 'sparkles' }, // key from the storefront's icon set; 'veg' shows the pure-veg mark
    link: { type: String, default: '' },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Announcement = mongoose.model('Announcement', announcementSchema);
