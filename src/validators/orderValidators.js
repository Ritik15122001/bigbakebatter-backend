import { z } from 'zod';

const orderItemSchema = z.object({
  pid: z.string().optional(),
  name: z.string().min(1),
  weight: z.string().optional().default(''),
  qty: z.coerce.number().min(1),
  line: z.coerce.number().min(0),
});

export const createOrderSchema = z.object({
  customer: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  amount: z.coerce.number().min(0),
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
