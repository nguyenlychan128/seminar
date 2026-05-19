'use strict';

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Handle known error codes
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Handle MongoDB duplicate key error (unique index violation)
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Weight entry already exists for this date',
    });
  }

  // Handle Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages[0] || 'Validation error' });
  }

  // Handle CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  // Default error
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: 'Failed to save weight log',
  });
}

module.exports = errorHandler;
