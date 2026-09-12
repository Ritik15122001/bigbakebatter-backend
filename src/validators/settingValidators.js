import { z } from 'zod';

export const settingUpdateSchema = z.object({
  name: z.string().optional(),
  since: z.coerce.number().optional(),
  phones: z.array(z.string()).optional(),
  email: z.string().email().optional(),
  addressFull: z.string().optional(),
  mapsEmbedSrc: z.string().optional(),
  mapsLink: z.string().optional(),
  social: z
    .object({
      facebook: z.string().optional(),
      twitter: z.string().optional(),
      instagram: z.string().optional(),
    })
    .optional(),
});
