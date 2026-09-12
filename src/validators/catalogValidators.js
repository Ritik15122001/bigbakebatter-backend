import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional().default('bag'),
  active: z.coerce.boolean().optional().default(true),
});
export const categoryUpdateSchema = categorySchema.partial();

export const flavourSchema = z.object({
  name: z.string().min(1),
  from: z.coerce.number().optional().default(0),
  col: z.string().optional().default('#E4CBA1'),
});
export const flavourUpdateSchema = flavourSchema.partial();

export const occasionSchema = z.object({
  name: z.string().min(1),
  cat: z.string().optional().default(''),
  blurb: z.string().optional().default(''),
  img: z.string().optional().default(''),
  ph: z.array(z.string()).optional().default([]),
});
export const occasionUpdateSchema = occasionSchema.partial();

export const addonSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().min(0),
  unit: z.string().optional().default(''),
  cat: z.string().optional().default('more'),
  popular: z.coerce.boolean().optional().default(false),
  img: z.string().optional().default(''),
  ph: z.array(z.string()).optional().default([]),
});
export const addonUpdateSchema = addonSchema.partial();

export const faqSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
  order: z.coerce.number().optional().default(0),
});
export const faqUpdateSchema = faqSchema.partial();

export const reviewSchema = z.object({
  name: z.string().min(1),
  occ: z.string().optional().default(''),
  rating: z.coerce.number().min(1).max(5),
  text: z.string().min(1),
});
export const reviewUpdateSchema = reviewSchema.partial();
