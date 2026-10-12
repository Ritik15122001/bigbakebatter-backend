import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    icon: { type: String, default: 'bag' },
    active: { type: Boolean, default: true },
    // Sold as a fixed box (brownies, cupcakes): one price, no weight choice.
    isBox: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Category = mongoose.model('Category', categorySchema);
