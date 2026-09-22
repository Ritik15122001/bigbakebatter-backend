import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    pid: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    weight: { type: String, default: '' },
    qty: { type: Number, required: true, min: 1 },
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
    status: { type: String, enum: STATUSES, default: 'New' },
    slot: { type: String, default: '' },
    deliver: { type: String, default: '' },
    addr: { type: String, required: true },
    msg: { type: String, default: '' },
    notes: { type: String, default: '' },
    pay: { type: String, enum: ['UPI', 'Card', 'Net Banking'], required: true },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
  },
  { timestamps: true }
);

export const ORDER_STATUSES = STATUSES;
export const Order = mongoose.model('Order', orderSchema);
