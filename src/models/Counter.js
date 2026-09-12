import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 0 },
});

export const Counter = mongoose.model('Counter', counterSchema);

/** Atomically increments and returns the next number for a named sequence (e.g. "order", "enquiry"). */
export async function nextSequence(key) {
  const doc = await Counter.findOneAndUpdate({ key }, { $inc: { value: 1 } }, { new: true, upsert: true });
  return doc.value;
}
