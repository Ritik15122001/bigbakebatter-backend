import { z } from 'zod';
import { zLink } from './common.js';

export const bannerSchema = z.object({
  kicker: z.string().optional().default(''),
  headline: z.string().min(1),
  sub: z.string().optional().default(''),
  cta: z.string().optional().default('Shop now'),
  ctaHref: zLink().optional().default('/shop'),
  badge: z.tuple([z.string(), z.string()]).or(z.array(z.string())).optional().default(['', '']),
  status: z.enum(['Draft', 'Published', 'Inactive']).optional().default('Draft'),
  order: z.coerce.number().optional().default(0),
  img: z.string().min(1),
  ph: z.array(z.string()).optional().default([]),
});

export const bannerUpdateSchema = bannerSchema.partial();
