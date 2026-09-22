import { z } from 'zod';

export const createRazorpayOrderSchema = z.object({
  amount: z.coerce.number().min(1),
});
