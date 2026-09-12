import mongoose from 'mongoose';

const flavourSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    from: { type: Number, default: 0 },
    col: { type: String, default: '#E4CBA1' },
  },
  { timestamps: true }
);

export const Flavour = mongoose.model('Flavour', flavourSchema);
