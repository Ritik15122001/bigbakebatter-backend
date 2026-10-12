/**
 * Validates the site-content registry and regenerates the storefront's local fallback copy.
 * Run after editing defaults in src/content/sections.js:
 *   node scripts/sync-site-defaults.mjs ../BigBakeBatter/src/data/siteDefaults.js
 */
import fs from 'fs';
import { SECTIONS } from '../src/content/sections.js';

const keys = new Set();
for (const s of SECTIONS) {
  if (keys.has(s.key)) throw new Error('dup ' + s.key);
  keys.add(s.key);
  const names = new Set(s.fields.map((f) => f.name));
  for (const k of Object.keys(s.defaults)) if (!names.has(k)) throw new Error(s.key + ' default not declared ' + k);
  for (const n of names) if (!(n in s.defaults)) throw new Error(s.key + ' missing default ' + n);
}
const obj = Object.fromEntries(SECTIONS.map((s) => [s.key, s.defaults]));
const header = `/**
 * Local copy of every site-content section's defaults. Mirrors \`defaults\` in the
 * backend registry (BigBakeBatter-backend/src/content/sections.js) and is used as
 * the fallback when GET /content is unavailable or predates a section/field, so
 * the site never renders empty. Keep it in sync with the backend registry.
 */
`;
const out = process.argv[2] || new URL('../../BigBakeBatter/src/data/siteDefaults.js', import.meta.url);
fs.writeFileSync(out, header + 'export const SITE_DEFAULTS = ' + JSON.stringify(obj, null, 2) + ';\n');
console.log(SECTIONS.length, 'sections:', [...keys].join(', '));
