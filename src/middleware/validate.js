import { ApiError } from '../utils/ApiError.js';

/** Validates req.body against a zod schema, replacing it with the parsed (typed) result. */
export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw ApiError.badRequest('Validation failed', result.error.flatten().fieldErrors);
    }
    req.body = result.data;
    next();
  };
}
