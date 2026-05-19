# TASK-008: Implement GET /api/auth/me Endpoint (Optional)

## 🎯 Objective

Implement an optional endpoint to retrieve the current authenticated user's information, useful for frontend verification and profile initialization.

---

## 📋 Acceptance Criteria

- [ ] `GET /api/auth/me` endpoint created
- [ ] Requires authentication (JWT Bearer token)
- [ ] Response (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "userId": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "User"
    }
  }
  ```
- [ ] Error Handling:
  - 401 Unauthorized: Missing or invalid token
- [ ] No sensitive data returned (no passwordHash, no lastLoginAt, no isActive)
- [ ] Returns only: userId, email, role
- [ ] Integration tests in `tests/integration/auth.me.test.js`:
  - Authenticated request returns user info (200)
  - Unauthenticated request rejected (401)
  - Response contains only userId, email, role
  - Response does not contain passwordHash or other sensitive fields
- [ ] Test coverage ≥ 80%
- [ ] Used by frontend to verify token on app load

---

## 🔗 Related Spec Files

- `spec/features/auth/api.spec.md` — GET /api/auth/me endpoint (optional)

---

## 📝 Implementation Notes

1. **Handler:**
   ```javascript
   // GET /api/auth/me
   // Requires: Authentication middleware
   
   const getMe = (req, res) => {
     res.json({
       success: true,
       data: {
         userId: req.user.userId,
         email: req.user.email,
         role: req.user.role
       }
     });
   };
   ```

2. **Route:**
   ```javascript
   router.get('/me', authenticate, getMe);
   ```

3. **Frontend Usage:**
   ```javascript
   // On app load
   const response = await fetch('/api/auth/me', {
     headers: { Authorization: `Bearer ${accessToken}` }
   });
   
   if (response.ok) {
     const user = await response.json();
     setUser(user.data);  // Set app state
   } else {
     // Token invalid, redirect to login
   }
   ```

4. **Security:**
   - Token already validated by authenticate middleware
   - No additional DB query needed (data in JWT)
   - Only return non-sensitive fields from JWT
   - Don't fetch user from DB (adds latency, unnecessary)

---

## 🚀 Subtasks

1. **Create /me route handler** — Return user info from req.user
2. **Mount in auth router** — GET /me with authenticate middleware
3. **Write integration tests** — Authenticated and unauthenticated requests
4. **Test response format** — Correct fields, no sensitive data
5. **Test 401 responses** — Missing/invalid token

---

## ✅ Definition of Done

- `/me` endpoint fully functional
- Returns correct user data from JWT
- Test coverage ≥ 80%
- No sensitive data leaked
- All tests passing
- Used by frontend for token validation

---

## 🔄 Next Steps

After this task:
- **TASK-009:** Rate limiting (optional, from spec Rule 12)
- **TASK-010:** Complete integration testing & Docker validation

---

## 📊 Task Metadata

- **Priority:** P1 (Nice to have)
- **Effort:** 0.5 hours
- **Owner:** Backend Team
- **Depends On:** TASK-001, TASK-002, TASK-006
- **Created:** 2026-05-07

---

## Note

This endpoint is **optional** for MVP. Frontend can track user state using JWT decoding instead. Implement if:
- Frontend needs server-verified user info
- Token could be tampered with (though JWT is signed, so unlikely)
- Easier than maintaining JWT decoding logic on frontend
