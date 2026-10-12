import { z } from 'zod';
import { zLink } from './common.js';

const optionalDate = z.preprocess((v) => (v === '' || v === null ? null : v), z.coerce.date().nullable()).optional();

const festivalSchema = z.object({
  enabled: z.boolean().optional(),
  preset: z.enum(['diwali']).optional(),
  startsAt: optionalDate,
  endsAt: optionalDate,
  greeting: z.string().max(60).optional(),
  headline: z.string().max(140).optional(),
  sub: z.string().max(300).optional(),
  cta: z.string().max(40).optional(),
  ctaHref: zLink().optional(),
  image: z.string().max(500).optional(),
  intensity: z.enum(['subtle', 'medium', 'festive']).optional(),
  effects: z
    .object({
      banner: z.boolean().optional(),
      garland: z.boolean().optional(),
      lights: z.boolean().optional(),
      fireworks: z.boolean().optional(),
      palette: z.boolean().optional(),
    })
    .optional(),
}).refine((f) => !f.startsAt || !f.endsAt || f.startsAt <= f.endsAt, { message: 'End date must be after the start date', path: ['endsAt'] });

export const settingUpdateSchema = z.object({
  name: z.string().optional(),
  since: z.coerce.number().optional(),
  phones: z.array(z.string()).optional(),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  addressFull: z.string().optional(),
  mapsEmbedSrc: z.string().optional(),
  mapsLink: z.string().optional(),
  deliveryFee: z.coerce.number().min(0).optional(),
  freeDeliveryAbove: z.coerce.number().min(0).optional(),
  slots: z.array(z.string().trim().min(1)).optional(),
  sameDayCutoffHour: z.coerce.number().int().min(0).max(23).optional(),
  hours: z.string().optional(),
  festival: festivalSchema.optional(),
  social: z
    .object({
      facebook: z.string().optional(),
      twitter: z.string().optional(),
      instagram: z.string().optional(),
    })
    .optional(),
});
