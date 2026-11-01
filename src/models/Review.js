import mongoose from 'mongoose';

export const REVIEW_STATUSES = ['Published', 'Pending', 'Hidden'];

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    occ: { type: String, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true },
    // Optional: ties the review to one cake (shown on that cake's page first).
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    // Admin-written reviews go live straight away; customer reviews wait for approval.
    // Older reviews have no status and count as Published.
    status: { type: String, enum: REVIEW_STATUSES, default: 'Published' },
    // Set when a customer reviews a cake from one of their delivered orders.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    orderCode: { type: String, default: '' },
  },
  { timestamps: true }
);

// A customer can review each cake once per order.
reviewSchema.index(
  { user: 1, order: 1, product: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } }
);

/** What the public website may show. */
export const PUBLIC_REVIEW_FILTER = { status: { $nin: ['Pending', 'Hidden'] } };

export const Review = mongoose.model('Review', reviewSchema);
