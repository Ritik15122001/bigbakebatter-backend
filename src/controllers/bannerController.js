import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { Banner } from '../models/Banner.js';

export const listBanners = asyncHandler(async (_req, res) => {
  const banners = await Banner.find().sort('order');
  sendSuccess(res, { data: banners });
});

export const getLiveBanners = asyncHandler(async (_req, res) => {
  const banners = await Banner.find({ status: 'Published' }).sort('order');
  sendSuccess(res, { data: banners.length ? banners : await Banner.find().sort('order').limit(1) });
});

export const createBanner = asyncHandler(async (req, res) => {
  const count = await Banner.countDocuments();
  const banner = await Banner.create({ ...req.body, order: req.body.order ?? count + 1 });
  sendSuccess(res, { statusCode: 201, message: 'Banner created', data: banner });
});

export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!banner) throw ApiError.notFound('Banner not found');
  sendSuccess(res, { message: 'Banner updated', data: banner });
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) throw ApiError.notFound('Banner not found');
  sendSuccess(res, { message: 'Banner deleted', data: banner });
});

export const reorderBanner = asyncHandler(async (req, res) => {
  const { direction } = req.body; // -1 or 1
  const banners = await Banner.find().sort('order');
  const idx = banners.findIndex((b) => b._id.toString() === req.params.id);
  if (idx === -1) throw ApiError.notFound('Banner not found');
  const swapIdx = idx + Number(direction);
  if (swapIdx < 0 || swapIdx >= banners.length) return sendSuccess(res, { data: banners });

  const a = banners[idx];
  const b = banners[swapIdx];
  const tmp = a.order;
  a.order = b.order;
  b.order = tmp;
  await Promise.all([a.save(), b.save()]);

  const updated = await Banner.find().sort('order');
  sendSuccess(res, { message: 'Order updated', data: updated });
});
