# TASK-006: Implement JWT Authentication & RBAC Middleware

## 🎯 Objective

Implement middleware for JWT token validation and role-based access control (RBAC) to protect routes and enforce user permissions.

---

## 📋 Acceptance Criteria

- [ ] `src/middleware/authenticate.js` created with JWT validation middleware
- [ ] Middleware extracts token from Authorization header (`Bearer <token>`)
- [ ] Token validation:
  - Header format: `Authorization: Bearer <token>`
  - Token signature valid (JWT_SECRET)
  - Token not expired
  - Token type = access token (not refresh)
- [ ] On success, injects `req.user` object:
  ```javascript
  req.user = {
    userId: "507f1f77bcf86cd799439011",
    email: "user@example.com",
    role: "User"
  }
  ```
- [ ] Error Handling:
  - 401 Unauthorized: Missing header, invalid format, invalid signature, expired
  - Error messages: "Missing authorization token", "Invalid authorization header", "Invalid token signature", "Token expired"
- [ ] `src/middleware/authorize.js` created with RBAC middleware
- [ ] `requireRole(allowedRoles)` function:
  - Takes array of allowed roles: `requireRole(["Admin"])`, `requireRole(["User", "Admin"])`
  - Returns middleware function
  - Returns 403 Forbidden if user role not in allowedRoles
  - Returns 401 Unauthorized if no authenticated user (missing auth middleware)
- [ ] Error message: "Forbidden" or "Unauthorized" per spec
- [ ] Example usage in routes:
  ```javascript
  app.get("/api/admin/users", authenticate, requireRole(["Admin"]), getUsers);
  app.get("/api/user/profile", authenticate, requireRole(["User", "Admin"]), getProfile);
  ```
- [ ] Unit tests in `tests/unit/middleware.test.js`:
  - Valid token extraction and injection
  - Missing Authorization header → 401
  - Invalid header format → 401
  - Expired token → 401
  - Invalid signature → 401
  - Refresh token used as access token → 401
- [ ] Integration tests in `tests/integration/auth.middleware.test.js`:
  - Authenticated request success
  - Unauthenticated request rejection (401)
  - Admin-only route with User role → 403
  - Admin-only route with Admin role → 200
  - User-allowed route with User role → 200
  - User-allowed route with Admin role → 200
  - RBAC enforcement on sample protected routes
- [ ] Test coverage ≥ 80%
- [ ] Middleware order correct in app.js:
  - Error handler last
  - Auth middleware before RBAC

---

## 🔗 Related Spec Files

- `spec/features/auth/api.spec.md` — Middleware sections
- `spec/features/auth/rules.spec.md` — Rule 4 (token validation), Rule 5 (RBAC roles & enforcement)

---

## 📝 Implementation Notes

1. **Authentication Middleware:**
   ```javascript
   // src/middleware/authenticate.js
   const authenticate = (req, res, next) => {
     const authHeader = req.get('Authorization');
     
     if (!authHeader) {
       return res.status(401).json({ message: "Missing authorization token" });
     }
     
     const parts = authHeader.split(' ');
     if (parts.length !== 2 || parts[0] !== 'Bearer') {
       return res.status(401).json({ message: "Invalid authorization header" });
     }
     
     const token = parts[1];
     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       if (decoded.type === 'refresh') {
         return res.status(401).json({ message: "Invalid token type" });
       }
       req.user = {
         userId: decoded.userId,
         email: decoded.email,
         role: decoded.role
       };
       next();
     } catch (err) {
       if (err.name === 'TokenExpiredError') {
         return res.status(401).json({ message: "Token expired" });
       }
       return res.status(401).json({ message: "Invalid token signature" });
     }
   };
   ```

2. **RBAC Middleware:**
   ```javascript
   // src/middleware/authorize.js
   const requireRole = (allowedRoles) => {
     return (req, res, next) => {
       if (!req.user) {
         return res.status(401).json({ message: "Unauthorized" });
       }
       if (!allowedRoles.includes(req.user.role)) {
         return res.status(403).json({ message: "Forbidden" });
       }
       next();
     };
   };
   ```

3. **Error Messages (exact from spec):**
   - Missing header: "Missing authorization token"
   - Invalid format: "Invalid authorization header"
   - Invalid signature: "Invalid token signature"
   - Expired: "Token expired. Please refresh."
   - Forbidden: "Forbidden" or descriptive message
   - Unauthorized: "Unauthorized"

4. **Token Type Check:**
   - Access token has no `type` field
   - Refresh token has `type: "refresh"`
   - Check `if (decoded.type === 'refresh')` → reject

5. **Middleware Ordering (src/app.js):**
   ```javascript
   // 1. Parse body
   app.use(express.json());
   
   // 2. Routes (public + protected)
   app.use('/api/auth', authRoutes);  // register, login, refresh
   
   // 3. Protected routes (require auth)
   app.use(authenticate);  // Must come before role checks
   app.use('/api/user', userRoutes);    // User-only
   app.use('/api/admin', requireRole(['Admin']), adminRoutes);  // Admin-only
   
   // 4. Error handler (last)
   app.use(errorHandler);
   ```

6. **Testing with Supertest:**
   ```javascript
   // Example: Create token for test
   const token = jwt.sign(
     { userId: "123", email: "test@example.com", role: "User" },
     process.env.JWT_SECRET,
     { expiresIn: "15m" }
   );
   
   // Test: Authenticated request
   await request(app)
     .get('/api/user/profile')
     .set('Authorization', `Bearer ${token}`)
     .expect(200);
   ```

---

## 🚀 Subtasks

1. **Create authenticate middleware** — src/middleware/authenticate.js
2. **Create authorize middleware** — src/middleware/authorize.js with requireRole()
3. **Test token extraction** — From Authorization header
4. **Test token verification** — Signature, expiry, type
5. **Test error cases** — Missing, invalid format, expired, wrong type
6. **Test RBAC enforcement** — Role checks pass/fail
7. **Write unit tests** — Middleware logic in isolation
8. **Write integration tests** — With actual routes
9. **Test middleware ordering** — Auth before RBAC
10. **Test req.user injection** — Verify object structure
11. **Create sample protected routes** — For integration testing (can be removed later)
12. **Test with MongoMemoryServer** — Full integration with real database

---

## ✅ Definition of Done

- Authentication middleware fully functional
- RBAC middleware working correctly
- All error cases handled with correct HTTP status
- All test cases passing
- Test coverage ≥ 80%
- Middleware can be chained: `authenticate, requireRole(["Admin"])`
- Token validation comprehensive (signature, expiry, type)
- req.user object injected with correct structure
- Error messages match spec exactly
- Code follows CommonJS style
- Matches auth spec exactly

---

## 🔄 Next Steps

After this task:
- **TASK-007:** Implement logout endpoint
- **TASK-008:** Implement optional GET /api/auth/me endpoint

---

## 📊 Task Metadata

- **Priority:** P0 (Core Security)
- **Effort:** 2-3 hours
- **Owner:** Backend Team
- **Depends On:** TASK-001, TASK-002, TASK-004, TASK-005
- **Created:** 2026-05-07
