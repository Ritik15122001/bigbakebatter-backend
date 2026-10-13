import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    occ: { type: String, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true },
    // Optional: ties the review to one cake (shown on that cake's page first).
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  },
  { timestamps: true }
);

export const Review = mongoose.model('Review', reviewSchema);
