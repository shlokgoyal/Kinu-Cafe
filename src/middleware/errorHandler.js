const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const payload = {
    error: {
      message: err.message || 'Internal Server Error',
    },
  };

  if (err.details) payload.error.details = err.details;

  // Mongoose validation errors → 400
  if (err.name === 'ValidationError' && err.errors) {
    payload.error.message = 'Validation failed';
    payload.error.details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json(payload);
  }

  // Duplicate key
  if (err.code === 11000) {
    payload.error.message = 'Duplicate value';
    payload.error.details = err.keyValue;
    return res.status(409).json(payload);
  }

  // CastError (bad ObjectId etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: { message: `Invalid ${err.path}: ${err.value}` },
    });
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
    if (!env.isProduction) payload.error.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = errorHandler;
