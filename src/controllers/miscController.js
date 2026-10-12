import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { Setting } from '../models/Setting.js';
import { Subscriber } from '../models/Subscriber.js';

export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await Setting.findOneAndUpdate({ key: 'business' }, {}, { new: true, upsert: true });
  sendSuccess(res, { data: settings });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const { social, festival, ...rest } = req.body;
  const update = { ...rest };
  // Dotted keys so saving one social link / festival option doesn't wipe the others.
  for (const [k, v] of Object.entries(social || {})) update[`social.${k}`] = v;
  const { effects, ...festivalRest } = festival || {};
  for (const [k, v] of Object.entries(festivalRest)) update[`festival.${k}`] = v;
  for (const [k, v] of Object.entries(effects || {})) update[`festival.effects.${k}`] = v;
  const settings = await Setting.findOneAndUpdate({ key: 'business' }, { $set: update }, { new: true, upsert: true, runValidators: true });
  sendSuccess(res, { message: 'Settings updated', data: settings });
});

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw ApiError.badRequest('Enter a valid email');
  await Subscriber.findOneAndUpdate({ email: email.toLowerCase() }, { email }, { upsert: true });
  sendSuccess(res, { message: "You're subscribed", data: { email } });
});

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const url = `/uploads/${req.file.filename}`;
  sendSuccess(res, { statusCode: 201, message: 'Uploaded', data: { url } });
});
