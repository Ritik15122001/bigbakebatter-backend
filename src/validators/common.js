import { z } from 'zod';

/** Boolean that also accepts "true"/"false" strings (z.coerce.boolean turns "false" into true). */
export const zBool = () => z.preprocess((v) => (v === 'false' ? false : v === 'true' ? true : v), z.boolean());

/** Internal path ("/shop") or http(s) URL — never javascript: etc. */
export const zLink = () => z.string().max(500).refine((v) => v === '' || v.startsWith('/') || /^https?:\/\//i.test(v), 'Link must start with / or https://');
