import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2),
  cat: z.string().min(1),
  flavour: z.string().optional().default(''),
  base: z.coerce.number().min(0),
  tag: z.string().optional().default(''),
  stock: z.enum(['In stock', 'Low stock', 'Out of stock']).optional().default('In stock'),
  qty: z.coerce.number().optional().default(0),
  rating: z.coerce.number().min(0).max(5).optional().default(0),
  reviews: z.coerce.number().optional().default(0),
  sold: z.coerce.number().optional().default(0),
  eggless: z.coerce.boolean().optional().default(true),
  veg: z.coerce.boolean().optional().default(true),
  corporate: z.coerce.boolean().optional().default(false),
  desc: z.string().optional().default(''),
  img: z.array(z.string()).optional().default([]),
  ph: z.array(z.string()).optional().default([]),
});

export const productUpdateSchema = productSchema.partial();
