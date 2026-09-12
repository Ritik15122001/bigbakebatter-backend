import { Router } from 'express';
import { crudFactory } from '../utils/crudFactory.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { Category } from '../models/Category.js';
import { Flavour } from '../models/Flavour.js';
import { Occasion } from '../models/Occasion.js';
import { Addon } from '../models/Addon.js';
import { Faq } from '../models/Faq.js';
import { Review } from '../models/Review.js';
import {
  categorySchema, categoryUpdateSchema, flavourSchema, flavourUpdateSchema,
  occasionSchema, occasionUpdateSchema, addonSchema, addonUpdateSchema,
  faqSchema, faqUpdateSchema, reviewSchema, reviewUpdateSchema,
} from '../validators/catalogValidators.js';

/** Builds a standard public-read / admin-write router for a simple resource. */
function simpleResourceRouter(Model, label, createSchema, updateSchema, sort = 'name') {
  const router = Router();
  const { list, getOne, create, update, remove } = crudFactory(Model, { label, sort });

  router.get('/', list);
  router.get('/:id', getOne);
  router.post('/', protect, restrictTo('admin'), validateBody(createSchema), create);
  router.put('/:id', protect, restrictTo('admin'), validateBody(updateSchema), update);
  router.delete('/:id', protect, restrictTo('admin'), remove);

  return router;
}

export const categoryRouter = simpleResourceRouter(Category, 'Category', categorySchema, categoryUpdateSchema);
export const flavourRouter = simpleResourceRouter(Flavour, 'Flavour', flavourSchema, flavourUpdateSchema);
export const occasionRouter = simpleResourceRouter(Occasion, 'Occasion', occasionSchema, occasionUpdateSchema);
export const addonRouter = simpleResourceRouter(Addon, 'Addon', addonSchema, addonUpdateSchema);
export const faqRouter = simpleResourceRouter(Faq, 'FAQ', faqSchema, faqUpdateSchema, 'order');
export const reviewRouter = simpleResourceRouter(Review, 'Review', reviewSchema, reviewUpdateSchema, '-createdAt');
