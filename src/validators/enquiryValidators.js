import { z } from 'zod';

export const createEnquirySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  occasion: z.string().min(1),
  date: z.string().optional().default(''),
  guests: z.string().optional().default(''),
  budget: z.string().optional().default(''),
  note: z.string().optional().default(''),
  files: z.coerce.number().optional().default(0),
});

export const updateEnquirySchema = z.object({
  status: z.enum(['New', 'Quoted', 'Closed']).optional(),
  adminNote: z.string().max(2000).optional(),
  quote: z.union([z.coerce.number().min(0), z.literal(''), z.null()]).optional().transform((v) => (v === '' ? null : v)),
});

export const updateEnquiryStatusSchema = z.object({
  status: z.enum(['New', 'Quoted', 'Closed']),
});
