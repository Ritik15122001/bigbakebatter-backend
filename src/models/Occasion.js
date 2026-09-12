import mongoose from 'mongoose';

const occasionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    cat: { type: String, default: '' },
    blurb: { type: String, default: '' },
    img: { type: String, default: '' },
    ph: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Occasion = mongoose.model('Occasion', occasionSchema);
