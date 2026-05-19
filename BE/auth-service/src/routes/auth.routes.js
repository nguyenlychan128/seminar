const express = require('express');
const { register, login, refresh, logout, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/authenticate');
const { createRateLimiter } = require('../middleware/rateLimit');
const rateLimitConfig = require('../config/rateLimit');

const router = express.Router();

// Rate limiters
const loginLimiter = createRateLimiter(
  rateLimitConfig.login.windowSeconds,
  rateLimitConfig.login.maxAttempts
);
const registerLimiter = createRateLimiter(
  rateLimitConfig.register.windowSeconds,
  rateLimitConfig.register.maxAttempts
);

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

module.exports = router;
