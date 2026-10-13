import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    pid: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    weight: { type: String, default: '' },
    qty: { type: Number, required: true, min: 1 },
    unit: { type: Number, min: 0 },
    eggless: { type: Boolean, default: false },
    note: { type: String, default: '' }, // message piped on the cake
    line: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const STATUSES = ['New', 'Baking', 'Out for delivery', 'Delivered', 'Cancelled'];

const orderSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // e.g. "#BB1049", human-facing id
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customer: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    amount: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    delivery: { type: Number, default: 0, min: 0 },
    promoCode: { type: String, default: '' },
    status: { type: String, enum: STATUSES, default: 'New' },
    slot: { type: String, default: '' },
    deliver: { type: String, default: '' },
    addr: { type: String, required: true },
    msg: { type: String, default: '' },
    notes: { type: String, default: '' },
    pay: { type: String, enum: ['UPI', 'Card', 'Net Banking'], required: true },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    adminNote: { type: String, default: '' }, // internal note, not shown to the customer
    statusHistory: {
      type: [{ status: String, at: { type: Date, default: Date.now }, by: { type: String, default: '' }, _id: false }],
      default: [],
    },
  },
  { timestamps: true }
);

// One payment can only ever back one order (guards against replaying a
// signed payment); empty ids from legacy/seed rows are excluded.
orderSchema.index(
  { razorpayPaymentId: 1 },
  { unique: true, partialFilterExpression: { razorpayPaymentId: { $type: 'string', $gt: '' } } }
);
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const ORDER_STATUSES = STATUSES;
export const Order = mongoose.model('Order', orderSchema);
