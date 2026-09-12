import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { Product } from '../models/Product.js';

const PRICE_BANDS = {
  lt600: { base: { $lt: 600 } },
  mid: { base: { $gte: 600, $lte: 750 } },
  gt750: { base: { $gt: 750 } },
};

const SORTS = { pop: '-sold', lo: 'base', hi: '-base', new: '-createdAt', rating: '-rating' };

export const listProducts = asyncHandler(async (req, res) => {
  const { q, cats, flavs, price, avail, sort } = req.query;
  const filter = {};

  if (q) filter.$text = { $search: q };
  if (cats) filter.cat = { $in: cats.split(',') };
  if (flavs) filter.flavour = { $regex: flavs.split(',').join('|'), $options: 'i' };
  if (avail?.includes('in')) filter.stock = { $ne: 'Out of stock' };
  if (avail?.includes('eggless')) filter.eggless = true;
  if (price) {
    const bands = price.split(',').map((k) => PRICE_BANDS[k]).filter(Boolean);
    if (bands.length) filter.$or = bands;
  }

  const products = await Product.find(filter).sort(SORTS[sort] || SORTS.pop);
  sendSuccess(res, { data: products });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Cake not found');
  sendSuccess(res, { data: product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  sendSuccess(res, { statusCode: 201, message: 'Cake added', data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) throw ApiError.notFound('Cake not found');
  sendSuccess(res, { message: 'Cake updated', data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw ApiError.notFound('Cake not found');
  sendSuccess(res, { message: 'Cake deleted', data: product });
});

export const adjustStock = asyncHandler(async (req, res) => {
  const { delta } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Cake not found');
  product.qty = Math.max(0, product.qty + Number(delta));
  product.stock = product.qty === 0 ? 'Out of stock' : product.qty <= 6 ? 'Low stock' : 'In stock';
  await product.save();
  sendSuccess(res, { message: 'Stock updated', data: product });
});
