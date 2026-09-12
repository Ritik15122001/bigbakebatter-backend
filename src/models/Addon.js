import mongoose from 'mongoose';

const addonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, default: '' },
    cat: { type: String, default: 'more' },
    popular: { type: Boolean, default: false },
    img: { type: String, default: '' },
    ph: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Addon = mongoose.model('Addon', addonSchema);
