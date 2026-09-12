import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    cat: { type: String, required: true },
    flavour: { type: String, default: '' },
    base: { type: Number, required: true, min: 0 },
    tag: { type: String, default: '' },
    stock: { type: String, enum: ['In stock', 'Low stock', 'Out of stock'], default: 'In stock' },
    qty: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    eggless: { type: Boolean, default: true },
    veg: { type: Boolean, default: true },
    corporate: { type: Boolean, default: false },
    desc: { type: String, default: '' },
    img: { type: [String], default: [] },
    ph: { type: [String], default: [] },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', flavour: 'text', cat: 'text', desc: 'text' });

export const Product = mongoose.model('Product', productSchema);
