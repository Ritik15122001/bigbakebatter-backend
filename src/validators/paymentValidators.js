import { z } from 'zod';
import { cartItemSchema } from './orderValidators.js';

export const createRazorpayOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(50),
  promoCode: z.string().optional().default(''),
  email: z.string().optional().default(''),
});

export const quoteSchema = createRazorpayOrderSchema;
