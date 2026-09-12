import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // e.g. "#CC1025"
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    occasion: { type: String, required: true },
    date: { type: String, default: '' },
    guests: { type: String, default: '' },
    budget: { type: String, default: '' },
    note: { type: String, default: '' },
    files: { type: Number, default: 0 },
    status: { type: String, enum: ['New', 'Quoted', 'Closed'], default: 'New' },
  },
  { timestamps: true }
);

export const Enquiry = mongoose.model('Enquiry', enquirySchema);
