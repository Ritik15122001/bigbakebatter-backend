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
});
export const reviewUpdateSchema = reviewSchema.partial();

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
