import { ApiError } from '../utils/ApiError.js';

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let { statusCode, message } = err instanceof ApiError ? err : { statusCode: 500, message: err.message };

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 5 MB)' : err.message;
  }
  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request is too large';
  }
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON';
  }
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already in use` : 'Duplicate value';
  }

  statusCode = statusCode || 500;
  if (process.env.NODE_ENV !== 'test' && statusCode >= 500) console.error(err);
  // Never leak internal error text to clients in production.
  if (statusCode >= 500 && process.env.NODE_ENV === 'production') message = 'Something went wrong. Please try again.';

  res.status(statusCode).json({
    success: false,
    message: message || 'Something went wrong',
    ...(err.details ? { details: err.details } : {}),
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}
