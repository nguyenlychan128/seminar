'use strict';

module.exports = {
  login: {
    windowSeconds: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW || '900', 10),
    maxAttempts: parseInt(process.env.RATE_LIMIT_LOGIN_MAX_ATTEMPTS || '5', 10),
  },
  register: {
    windowSeconds: parseInt(process.env.RATE_LIMIT_REGISTER_WINDOW || '86400', 10),
    maxAttempts: parseInt(process.env.RATE_LIMIT_REGISTER_MAX_ACCOUNTS || '3', 10),
  },
  enabled: process.env.RATE_LIMIT_ENABLED === 'true',
};
