import mongoose from 'mongoose';

const STATUSES = ['Paid', 'Refunded', 'Failed'];

const transactionSchema = new mongoose.Schema(
  {
    txnId: { type: String, required: true, unique: true }, // e.g. "TXN10042", human-facing
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    orderCode: { type: String, default: '' }, // denormalised "#BB1049" for fast listing
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customer: { type: String, required: true },
    email: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    method: { type: String, enum: ['UPI', 'Card', 'Net Banking'], required: true },
    status: { type: String, enum: STATUSES, default: 'Paid' },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    paidAt: { type: Date, default: Date.now }, // exact payment timestamp
    refundedAt: { type: Date },
  },
  { timestamps: true }
);

transactionSchema.index({ paidAt: -1 });
transactionSchema.index({ user: 1, paidAt: -1 });

export const TRANSACTION_STATUSES = STATUSES;
export const Transaction = mongoose.model('Transaction', transactionSchema);
