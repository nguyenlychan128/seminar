const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Request error', {
    message: err.message,
    code: err.code,
    path: req.path,
    method: req.method,
  });

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Email already registered',
    });
  }

  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
}

module.exports = errorHandler;
