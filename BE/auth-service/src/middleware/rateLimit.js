'use strict';

// In-memory store: { "ip:path": { count, resetTime } }
let requestCounts = {};

function resetStore() {
  requestCounts = {};
}

function createRateLimiter(windowSeconds, maxAttempts) {
  return (req, res, next) => {
    // Check if rate limiting is explicitly disabled
    if (process.env.RATE_LIMIT_ENABLED === 'false') {
      return next();
    }

    const ip = req.ip || 'unknown';
    const path = req.path;
    const key = `${ip}:${path}`;
    const now = Date.now();

    // Initialize or reset if window has expired
    if (!requestCounts[key]) {
      requestCounts[key] = {
        count: 0,
        resetTime: now + (windowSeconds * 1000),
      };
    } else if (now > requestCounts[key].resetTime) {
      requestCounts[key] = {
        count: 0,
        resetTime: now + (windowSeconds * 1000),
      };
    }

    // Check if limit exceeded
    if (requestCounts[key].count >= maxAttempts) {
      const remainingMs = requestCounts[key].resetTime - now;
      const retryAfter = Math.max(1, Math.ceil(remainingMs / 1000));

      return res
        .status(429)
        .set('Retry-After', retryAfter.toString())
        .json({
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfter,
        });
    }

    // Increment counter and proceed
    requestCounts[key].count++;
    next();
  };
}

module.exports = {
  createRateLimiter,
  resetStore,
};
