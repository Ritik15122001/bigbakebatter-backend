import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { SiteContent } from '../models/SiteContent.js';
import { SECTIONS, SECTION_MAP } from '../content/sections.js';

/** Public: every section's content, defaults overlaid with whatever the admin saved. */
export const getAllContent = asyncHandler(async (_req, res) => {
  const saved = await SiteContent.find().lean();
  const savedMap = new Map(saved.map((d) => [d.key, d.data]));
  const data = Object.fromEntries(SECTIONS.map((s) => [s.key, { ...s.defaults, ...(savedMap.get(s.key) || {}) }]));
  sendSuccess(res, { data });
});

/** Admin: the form schema + defaults for building editors. */
export const getContentSchema = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: SECTIONS });
});

export const updateContent = asyncHandler(async (req, res) => {
  const section = SECTION_MAP.get(req.params.key);
  if (!section) throw ApiError.notFound('Unknown content section');
  const data = req.body?.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw ApiError.badRequest('data must be an object');
  // Only keep fields the section declares.
  const allowed = new Set(section.fields.map((f) => f.name));
  const clean = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.has(k)));
  if (JSON.stringify(clean).length > 100_000) throw ApiError.badRequest('Content is too large');
  const doc = await SiteContent.findOneAndUpdate({ key: section.key }, { data: clean }, { new: true, upsert: true });
  sendSuccess(res, { message: `${section.label} saved`, data: { ...section.defaults, ...doc.data } });
});

/** Admin: discard overrides so the section goes back to its shipped defaults. */
export const resetContent = asyncHandler(async (req, res) => {
  const section = SECTION_MAP.get(req.params.key);
  if (!section) throw ApiError.notFound('Unknown content section');
  await SiteContent.deleteOne({ key: section.key });
  sendSuccess(res, { message: `${section.label} reset to default`, data: section.defaults });
});
