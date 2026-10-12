import { z } from 'zod';

// Prices are never taken from the client — the server re-prices every line
// from the database (see utils/pricing.js).
export const cartItemSchema = z.object({
  pid: z.string().min(1),
  name: z.string().optional().default(''),
  weight: z.string().optional().default(''),
  qty: z.coerce.number().int().min(1).max(50),
  isAddon: z.boolean().optional().default(false),
  eggless: z.boolean().optional().default(false),
  msg: z.string().max(120).optional().default(''),
});

export const createOrderSchema = z.object({
  customer: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  items: z.array(cartItemSchema).min(1, 'Order must have at least one item').max(50),
  promoCode: z.string().optional().default(''),
  slot: z.string().min(1, 'Select a delivery slot'),
  deliver: z.string().min(1, 'Select a delivery date'),
  addr: z.string().min(1, 'Delivery address is required'),
  msg: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  pay: z.enum(['UPI', 'Card', 'Net Banking']),
  razorpayOrderId: z.string().min(1, 'Payment is required'),
  razorpayPaymentId: z.string().min(1, 'Payment is required'),
  razorpaySignature: z.string().min(1, 'Payment is required'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['New', 'Baking', 'Out for delivery', 'Delivered', 'Cancelled']),
});
