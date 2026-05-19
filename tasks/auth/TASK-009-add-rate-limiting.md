# TASK-009: Add Rate Limiting (Optional)

## 🎯 Objective

Implement rate limiting on auth endpoints to prevent brute-force attacks and abuse. Optional but recommended for production.

---

## 📋 Acceptance Criteria

- [ ] Rate limiting middleware in `src/middleware/rateLimit.js`
- [ ] Protected endpoints:
  - `POST /api/auth/login` — 5 attempts per 15 minutes per IP
  - `POST /api/auth/register` — 3 accounts per 24 hours per IP
  - `POST /api/auth/refresh` — No limit (users refresh frequently)
- [ ] Storage: Redis (if available) or in-memory (for MVP)
- [ ] Response on rate limit exceeded (429 Too Many Requests):
  ```json
  {
    "success": false,
    "message": "Too many requests. Please try again later.",
    "retryAfter": 300
  }
  ```
- [ ] Error Handling:
  - 429 Too Many Requests: Rate limit exceeded
  - Graceful degradation if Redis unavailable (log warning, allow request)
- [ ] Integration tests in `tests/integration/auth.rateLimit.test.js`:
  - Login: 5 successful, 6th blocked (429)
  - Register: 3 successful, 4th blocked (429)
  - Refresh: No limit (multiple calls allowed)
  - Test IP-based isolation (different IPs not blocked together)
  - Test window reset after time passes
- [ ] Test coverage ≥ 80%
- [ ] Configuration via environment variables:
  - `RATE_LIMIT_LOGIN_WINDOW=900` (seconds)
  - `RATE_LIMIT_LOGIN_MAX_ATTEMPTS=5`
  - `RATE_LIMIT_REGISTER_WINDOW=86400` (seconds)
  - `RATE_LIMIT_REGISTER_MAX_ACCOUNTS=3`
  - `RATE_LIMIT_ENABLED=true` (for testing)
- [ ] Optional: Add Retry-After header in 429 response

---

## 🔗 Related Spec Files

- `spec/features/auth/rules.spec.md` — Rule 12 (rate limiting)

---

## 📝 Implementation Notes

1. **In-Memory Implementation (MVP):**
   ```javascript
   // src/middleware/rateLimit.js
   const requestCounts = {}; // { "ip:endpoint": { count, resetTime } }
   
   function createRateLimiter(windowSeconds, maxAttempts) {
     return (req, res, next) => {
       const key = `${req.ip}:${req.path}`;
       const now = Date.now();
       
       if (!requestCounts[key]) {
         requestCounts[key] = { count: 0, resetTime: now + (windowSeconds * 1000) };
       }
       
       if (now > requestCounts[key].resetTime) {
         requestCounts[key] = { count: 0, resetTime: now + (windowSeconds * 1000) };
       }
       
       if (requestCounts[key].count >= maxAttempts) {
         const retryAfter = Math.ceil((requestCounts[key].resetTime - now) / 1000);
         return res.status(429).json({
           success: false,
           message: "Too many requests. Please try again later.",
           retryAfter
         });
       }
       
       requestCounts[key].count++;
       next();
     };
   }
   
   module.exports = {
     loginLimiter: createRateLimiter(900, 5),     // 5 per 15 min
     registerLimiter: createRateLimiter(86400, 3) // 3 per 24 hours
   };
   ```

2. **Redis Implementation (Optional):**
   ```javascript
   const redis = require('redis');
   const client = redis.createClient();
   
   function createRateLimiter(windowSeconds, maxAttempts) {
     return async (req, res, next) => {
       const key = `ratelimit:${req.ip}:${req.path}`;
       const current = await client.incr(key);
       
       if (current === 1) {
         await client.expire(key, windowSeconds);
       }
       
       if (current > maxAttempts) {
         const ttl = await client.ttl(key);
         return res.status(429).json({
           success: false,
           message: "Too many requests. Please try again later.",
           retryAfter: ttl
         });
       }
       
       next();
     };
   }
   ```

3. **Route Integration:**
   ```javascript
   const { loginLimiter, registerLimiter } = require('../middleware/rateLimit');
   
   router.post('/login', loginLimiter, login);
   router.post('/register', registerLimiter, register);
   router.post('/refresh', refresh);  // No limiter
   ```

4. **Configuration (src/config/rateLimit.js):**
   ```javascript
   module.exports = {
     login: {
       windowSeconds: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW || 900),
       maxAttempts: parseInt(process.env.RATE_LIMIT_LOGIN_MAX_ATTEMPTS || 5)
     },
     register: {
       windowSeconds: parseInt(process.env.RATE_LIMIT_REGISTER_WINDOW || 86400),
       maxAttempts: parseInt(process.env.RATE_LIMIT_REGISTER_MAX_ACCOUNTS || 3)
     },
     enabled: process.env.RATE_LIMIT_ENABLED === 'true'
   };
   ```

5. **Error Message:**
   - Generic: "Too many requests. Please try again later."
   - Include Retry-After header (seconds until reset)
   - No info about limits (prevent probing)

6. **Testing:**
   ```javascript
   // Disable rate limiting in tests for speed
   process.env.RATE_LIMIT_ENABLED = 'false';
   
   // Or test with limits enabled and use shorter windows
   process.env.RATE_LIMIT_LOGIN_WINDOW = '1';  // 1 second
   ```

---

## 🚀 Subtasks

1. **Choose implementation** — In-memory (MVP) or Redis (production)
2. **Create rate limiter middleware** — src/middleware/rateLimit.js
3. **Configure windows and limits** — Per spec (5/15min, 3/24h)
4. **Integrate into routes** — Apply to login and register
5. **Add configuration** — Environment variables with defaults
6. **Implement graceful degradation** — Log if Redis unavailable
7. **Write integration tests** — Test limits, window reset, IP isolation
8. **Test 429 response** — Correct status and message
9. **Test Retry-After header** — Optional but recommended
10. **Test with time mocking** — Simulate window expiry

---

## ✅ Definition of Done

- Rate limiting fully functional
- Limits enforced: 5/15min login, 3/24h register
- 429 response with retryAfter
- Test coverage ≥ 80%
- Graceful degradation if Redis unavailable
- Configuration via environment variables
- No rate limiting on refresh endpoint
- All tests passing

---

## 🔄 Next Steps

After this task:
- **TASK-010:** Complete integration testing & Docker validation

---

## 📊 Task Metadata

- **Priority:** P1 (Security, Recommended)
- **Effort:** 2-3 hours
- **Owner:** Backend Team
- **Depends On:** TASK-003, TASK-004, TASK-005
- **Created:** 2026-05-07

---

## Implementation Note

**For MVP:** Implement in-memory version (simpler, no Redis dependency)
**For Production:** Upgrade to Redis version (shared state across instances)
**Disable in Tests:** Set `RATE_LIMIT_ENABLED=false` for faster test runs
