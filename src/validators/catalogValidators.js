import { z } from 'zod';
import { zBool, zLink } from './common.js';

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  icon: z.string().optional().default('bag'),
  isBox: zBool().optional().default(false),
  order: z.coerce.number().optional().default(0),
  active: zBool().optional().default(true),
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
  popular: zBool().optional().default(false),
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
  product: z.union([z.string().regex(/^[a-f\d]{24}$/i, 'Invalid cake'), z.literal(''), z.null()]).optional().transform((v) => v || null),
  status: z.enum(['Published', 'Pending', 'Hidden']).optional(),
});
export const reviewUpdateSchema = reviewSchema.partial();

/** A signed-in customer reviewing a cake from one of their delivered orders. */
export const customerReviewSchema = z.object({
  order: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid order'),
  product: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid cake'),
  rating: z.coerce.number().int().min(1, 'Pick 1 to 5 stars').max(5, 'Pick 1 to 5 stars'),
  text: z.string().trim().min(10, 'Tell us a little more (at least 10 characters)').max(1000, 'Keep it under 1000 characters'),
  occ: z.string().trim().max(40).optional().default(''),
});

export const announcementSchema = z.object({
  text: z.string().trim().min(1).max(160),
  icon: z.string().optional().default('sparkles'),
  link: zLink().optional().default(''),
  active: zBool().optional().default(true),
  order: z.coerce.number().optional().default(0),
});
export const announcementUpdateSchema = announcementSchema.partial();

export const addonCategorySchema = z.object({
  key: z.string().trim().min(1).max(30).regex(/^[a-z0-9-]+$/i, 'Use letters, numbers and dashes only'),
  label: z.string().trim().min(1).max(40),
  icon: z.string().optional().default('gift'),
  order: z.coerce.number().optional().default(0),
});
export const addonCategoryUpdateSchema = addonCategorySchema.partial();

export const couponSchema = z.object({
  code: z.string().trim().min(3).max(30).regex(/^[A-Z0-9_-]+$/i, 'Use letters, numbers, - and _ only'),
  pct: z.coerce.number().min(1).max(100),
  description: z.string().max(200).optional().default(''),
  minSubtotal: z.coerce.number().min(0).optional().default(0),
  firstOrderOnly: zBool().optional().default(false),
  active: zBool().optional().default(true),
  // null / '' = never expires (z.coerce.date would turn null into 1970).
  expiresAt: z.preprocess((v) => (v === '' || v === null ? null : v), z.coerce.date().nullable()).optional(),
});
export const couponUpdateSchema = couponSchema.partial();
