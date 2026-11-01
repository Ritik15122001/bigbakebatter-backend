import { Router } from 'express';
import { crudFactory } from '../utils/crudFactory.js';
import { protect, restrictTo, optionalAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { Category } from '../models/Category.js';
import { Flavour } from '../models/Flavour.js';
import { Occasion } from '../models/Occasion.js';
import { Addon } from '../models/Addon.js';
import { Faq } from '../models/Faq.js';
import { Review, PUBLIC_REVIEW_FILTER } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { Announcement } from '../models/Announcement.js';
import { AddonCategory } from '../models/AddonCategory.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import {
  categorySchema, categoryUpdateSchema, flavourSchema, flavourUpdateSchema,
  occasionSchema, occasionUpdateSchema, addonSchema, addonUpdateSchema,
  faqSchema, faqUpdateSchema, reviewSchema, reviewUpdateSchema, customerReviewSchema,
  announcementSchema, announcementUpdateSchema, addonCategorySchema, addonCategoryUpdateSchema,
} from '../validators/catalogValidators.js';

/** Builds a standard public-read / admin-write router for a simple resource. */
function simpleResourceRouter(Model, label, createSchema, updateSchema, sort = 'name', listHandlers = null) {
  const router = Router();
  const { list, getOne, create, update, remove } = crudFactory(Model, { label, sort });

  router.get('/', ...(listHandlers || [list]));
  router.get('/:id', getOne);
  router.post('/', protect, restrictTo('admin'), validateBody(createSchema), create);
  router.put('/:id', protect, restrictTo('admin'), validateBody(updateSchema), update);
  router.delete('/:id', protect, restrictTo('admin'), remove);

  return router;
}

/**
 * Products and occasions reference a category by its *name*, so renaming a
 * category must cascade and deleting one that's still in use must be refused.
 */
const categoryCrud = crudFactory(Category, { label: 'Category', sort: 'order name' });

const nameTaken = (name, exceptId) => {
  const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Category.exists({ name: new RegExp(`^${escaped}$`, 'i'), ...(exceptId ? { _id: { $ne: exceptId } } : {}) });
};

const guardCreate = asyncHandler(async (req, _res, next) => {
  if (await nameTaken(req.body.name)) throw ApiError.conflict(`A category named "${req.body.name.trim()}" already exists`);
  next();
});

const renameCascade = asyncHandler(async (req, _res, next) => {
  const existing = await Category.findById(req.params.id);
  if (!existing) throw ApiError.notFound('Category not found');
  const newName = req.body.name?.trim();
  if (newName && newName !== existing.name) {
    if (await nameTaken(newName, existing._id)) {
      throw ApiError.conflict(`A category named "${newName}" already exists`);
    }
    await Promise.all([
      Product.updateMany({ cat: existing.name }, { cat: newName }),
      Occasion.updateMany({ cat: existing.name }, { cat: newName }),
    ]);
  }
  next();
});

const guardDelete = asyncHandler(async (req, _res, next) => {
  const existing = await Category.findById(req.params.id);
  if (!existing) throw ApiError.notFound('Category not found');
  const occasions = await Occasion.countDocuments({ cat: existing.name });
  const inUse = await Product.countDocuments({ cat: existing.name });
  if (!inUse && occasions) throw ApiError.conflict(`${occasions} occasion${occasions === 1 ? ' links' : 's link'} to "${existing.name}". Change ${occasions === 1 ? 'it' : 'them'} first.`);
  if (inUse) throw ApiError.conflict(`${inUse} cake${inUse === 1 ? ' uses' : 's use'} "${existing.name}". Move or delete ${inUse === 1 ? 'it' : 'them'} first.`);
  next();
});

export const categoryRouter = Router();
categoryRouter.get('/', categoryCrud.list);
categoryRouter.get('/:id', categoryCrud.getOne);
categoryRouter.post('/', protect, restrictTo('admin'), validateBody(categorySchema), guardCreate, categoryCrud.create);
categoryRouter.put('/:id', protect, restrictTo('admin'), validateBody(categoryUpdateSchema), renameCascade, categoryCrud.update);
categoryRouter.delete('/:id', protect, restrictTo('admin'), guardDelete, categoryCrud.remove);
export const flavourRouter = simpleResourceRouter(Flavour, 'Flavour', flavourSchema, flavourUpdateSchema);
export const occasionRouter = simpleResourceRouter(Occasion, 'Occasion', occasionSchema, occasionUpdateSchema);
export const addonRouter = simpleResourceRouter(Addon, 'Addon', addonSchema, addonUpdateSchema);
export const faqRouter = simpleResourceRouter(Faq, 'FAQ', faqSchema, faqUpdateSchema, 'order');
/* ---------- Reviews ---------- */
// The public site only sees published reviews; admins (with a token) see all,
// including customer reviews waiting for approval.
const isAdmin = (req) => req.user?.role === 'admin';
const reviewCrud = crudFactory(Review, { label: 'Review', sort: '-createdAt' });
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ?product=<id> returns that cake's reviews (newest first); no param = all reviews.
const listReviews = asyncHandler(async (req, res) => {
  const { product } = req.query;
  const filter = {
    ...(product && /^[a-f\d]{24}$/i.test(product) ? { product } : {}),
    ...(isAdmin(req) ? {} : PUBLIC_REVIEW_FILTER),
  };
  sendSuccess(res, { data: await Review.find(filter).sort('-createdAt') });
});

const getReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, ...(isAdmin(req) ? {} : PUBLIC_REVIEW_FILTER) });
  if (!review) throw ApiError.notFound('Review not found');
  sendSuccess(res, { data: review });
});

// The signed-in customer's own reviews, so the account page knows what they've already rated.
const listMyReviews = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await Review.find({ user: req.user._id }).sort('-createdAt') });
});

// A customer can review a cake only from one of their own delivered orders.
const createMyReview = asyncHandler(async (req, res) => {
  const { order: orderId, product, rating, text, occ } = req.body;
  const order = await Order.findOne({
    _id: orderId,
    // Orders placed as a guest with the same email also count as theirs.
    $or: [{ user: req.user._id }, { user: null, email: new RegExp(`^${escapeRegex(req.user.email)}$`, 'i') }],
  });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status !== 'Delivered') throw ApiError.badRequest('You can review a cake once your order has been delivered.');
  const cake = await Product.findById(product).select('name');
  if (!cake) throw ApiError.notFound('That cake is no longer in our shop.');
  // Older orders stored only the cake's name, so fall back to matching on that.
  const inOrder = order.items.some((i) => (i.pid ? String(i.pid) === product : i.name === cake.name));
  if (!inOrder) throw ApiError.badRequest('That cake is not part of this order.');
  if (await Review.exists({ user: req.user._id, order: order._id, product })) {
    throw ApiError.conflict('You have already reviewed this cake for this order.');
  }
  const review = await Review.create({
    name: req.user.name, occ, rating, text, product,
    status: 'Pending', user: req.user._id, order: order._id, orderCode: order.code,
  });
  sendSuccess(res, { statusCode: 201, message: 'Thanks! Your review will appear once we have checked it.', data: review });
});

export const reviewRouter = Router();
reviewRouter.get('/', optionalAuth, listReviews);
reviewRouter.get('/mine', protect, listMyReviews);
reviewRouter.post('/mine', protect, validateBody(customerReviewSchema), createMyReview);
reviewRouter.get('/:id', optionalAuth, getReview);
reviewRouter.post('/', protect, restrictTo('admin'), validateBody(reviewSchema), reviewCrud.create);
reviewRouter.put('/:id', protect, restrictTo('admin'), validateBody(reviewUpdateSchema), reviewCrud.update);
reviewRouter.delete('/:id', protect, restrictTo('admin'), reviewCrud.remove);
// Public visitors only get active messages; admins (with a token) see all.
const listAnnouncements = asyncHandler(async (req, res) => {
  const filter = req.user?.role === 'admin' ? {} : { active: true };
  sendSuccess(res, { data: await Announcement.find(filter).sort('order') });
});
export const announcementRouter = simpleResourceRouter(Announcement, 'Announcement', announcementSchema, announcementUpdateSchema, 'order', [optionalAuth, listAnnouncements]);
export const addonCategoryRouter = simpleResourceRouter(AddonCategory, 'Add-on category', addonCategorySchema, addonCategoryUpdateSchema, 'order');
