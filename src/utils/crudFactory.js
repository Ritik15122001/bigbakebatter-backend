import { asyncHandler } from './asyncHandler.js';
import { ApiError } from './ApiError.js';
import { sendSuccess } from './ApiResponse.js';

/**
 * Generic CRUD handlers for simple resources (Category, Flavour, Occasion,
 * Faq, Review, Addon) — list/get/create/update/delete are identical for
 * these; anything with extra behaviour (Product, Banner, Order, ...) gets
 * its own controller instead of using this factory.
 */
export function crudFactory(Model, { label = 'Resource', sort = '-createdAt' } = {}) {
  return {
    list: asyncHandler(async (_req, res) => {
      const items = await Model.find().sort(sort);
      sendSuccess(res, { data: items });
    }),

    getOne: asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params.id);
      if (!item) throw ApiError.notFound(`${label} not found`);
      sendSuccess(res, { data: item });
    }),

    create: asyncHandler(async (req, res) => {
      const item = await Model.create(req.body);
      sendSuccess(res, { statusCode: 201, message: `${label} created`, data: item });
    }),

    update: asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!item) throw ApiError.notFound(`${label} not found`);
      sendSuccess(res, { message: `${label} updated`, data: item });
    }),

    remove: asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) throw ApiError.notFound(`${label} not found`);
      sendSuccess(res, { message: `${label} deleted`, data: item });
    }),
  };
}
