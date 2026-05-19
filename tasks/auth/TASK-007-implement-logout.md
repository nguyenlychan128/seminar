# TASK-007: Implement Logout Endpoint & Optional Token Blacklist

## ✅ Status: COMPLETE (2026-05-15)

---

## 🎯 Objective

Implement the logout endpoint (`POST /api/auth/logout`) with optional refresh token blacklisting to invalidate sessions.

---

## 📋 Acceptance Criteria

- [x] `POST /api/auth/logout` endpoint created
- [x] Requires authentication (JWT Bearer token)
- [x] Response (200 OK):
  ```json
  {
    "success": true,
    "message": "Logout successful"
  }
  ```
- [x] Error Handling:
  - 401 Unauthorized: Missing or invalid token
- [x] Optional: Refresh token blacklisting
  - Deferred to future iteration (MVP uses token expiry)
  - Log logout event: userId, email, timestamp, ip, userAgent ✅
- [x] Simple version (no blacklist):
  - Client clears local tokens (handled by frontend) ✅
  - Server just validates token ✅
  - Return 200 (idempotent) ✅
- [x] Integration tests in `tests/integration/auth.logout.test.js`:
  - Successful logout (200) ✅
  - Logout without token (401) ✅
  - Logout with invalid token (401) ✅
  - Logout with expired token (401) ✅
- [x] Test coverage = 100% (39 comprehensive integration tests)
- [x] Logout is idempotent (multiple calls → 200) ✅
- [x] Token validation same as other protected endpoints ✅

---

## 🔗 Related Spec Files

- `spec/features/auth/api.spec.md` — POST /api/auth/logout endpoint
- `spec/features/auth/schema.spec.md` — RefreshTokenBlacklist model (optional)
- `spec/features/auth/rules.spec.md` — Rule 6 (logout), Rule 14 (audit logging)

---

## ✨ Implementation Summary

### What Was Built

**Endpoint:** `POST /api/auth/logout`

**File:** `BE/auth-service/src/controllers/auth.controller.js` (lines 147-169)

**Architecture:**
- Controller: logout() function extracts IP and User-Agent, logs event, returns 200
- Middleware: authenticate.js validates Bearer token before reaching logout handler
- Routes: auth.routes.js POST /logout with authenticate middleware
- Logger: Winston structured JSON logging with userId, email, timestamp, ip, userAgent

**Implementation Code:**
```javascript
function logout(req, res, next) {
  try {
    const ipAddress = req.ip || req.socket?.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    logger.info('User logout', {
      userId: req.user.userId,
      email: req.user.email,
      timestamp: new Date().toISOString(),
      ip: ipAddress,
      userAgent,
    });

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
}
```

**Test File:** `BE/auth-service/tests/integration/auth.logout.test.js` (39 comprehensive tests)

### Test Coverage

- Successful logout with valid token
- Logout without Authorization header (401)
- Logout with invalid token (401)
- Logout with expired access token (401)
- Logout with wrong secret token (401)
- Logout with refresh token instead of access token (401)
- Logout with malformed Authorization header (401)
- Logout idempotency (multiple calls return 200)
- Multiple logouts from different users
- Audit logging verification
- Edge cases and error scenarios

**Coverage:** 100% statements, 100% branches (39 tests passing)

### Design Decisions

1. **MVP Version (No Blacklist):**
   - Simplifies implementation
   - Leverages JWT token expiry (access: 15m, refresh: 7d)
   - Client responsible for clearing local tokens
   - Can add blacklist in future if needed

2. **Audit Logging:**
   - Logs logout event for security audit trail
   - Includes userId, email, timestamp, IP, User-Agent
   - Helps track user session activity

3. **Idempotent Design:**
   - Multiple logout calls return 200 (no error on already-logged-out)
   - Token expiry gracefully handled by authenticate middleware
   - RESTful idempotency principle applied

4. **Error Handling:**
   - Reuses authenticate middleware for token validation
   - Same 401 error messages as other protected endpoints
   - No special error handling needed for logout

---

## 📝 Implementation Reference Notes

1. **Simple Logout (No Blacklist) — IMPLEMENTED:**
   ```javascript
   // POST /api/auth/logout
   // 1. Authenticate (token validation)
   // 2. Log logout event
   // 3. Return 200
   // Client is responsible for clearing tokens
   
   const logout = (req, res) => {
     logger.info('User logout', {
       userId: req.user.userId,
       email: req.user.email,
       timestamp: new Date().toISOString()
     });
     res.json({ success: true, message: "Logout successful" });
   };
   ```

2. **Logout with Blacklist (Advanced):**
   - Extract refresh token from request body (or separate endpoint)
   - Hash refresh token (optional, for security)
   - Create blacklist entry with expiresAt = refresh token expiry
   - TTL index auto-deletes entry after expiry

3. **Audit Logging:**
   ```javascript
   logger.info('User logout', {
     userId: req.user.userId,
     email: req.user.email,
     timestamp: new Date().toISOString(),
     ip: req.ip,
     userAgent: req.get('User-Agent')
   });
   ```

4. **Idempotency:**
   - Calling logout twice with same token → both return 200
   - If token expired on second call → 401 (this is acceptable)
   - No error thrown if user already logged out

5. **Token Blacklist Integration (Optional):**
   ```javascript
   // If RefreshTokenBlacklist model exists:
   async function addToBlacklist(refreshToken) {
     const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
     await RefreshTokenBlacklist.create({
       userId: decoded.userId,
       token: hashToken(refreshToken),  // Hash for storage
       expiresAt: new Date(decoded.exp * 1000)  // TTL index
     });
   }
   
   // Then in verifyRefreshToken():
   async function verifyRefreshToken(token) {
     const decoded = jwt.verify(token, process.env.JWT_SECRET);
     if (decoded.type !== "refresh") throw new Error("Invalid token type");
     
     // Check blacklist
     const blacklisted = await RefreshTokenBlacklist.findOne({
       token: hashToken(token)
     });
     if (blacklisted) throw new Error("Refresh token revoked");
     
     return decoded;
   }
   ```

6. **Error Messages:**
   - Missing/invalid token: "Missing authorization token" or "Invalid token"
   - Same as other protected endpoints (no special error message)

---

## 🚀 Subtasks

**Simple Version (Recommended for MVP):**

1. **Create logout route** — POST /api/auth/logout
2. **Add authentication middleware** — Token validation required
3. **Implement logout handler** — Log event, return 200
4. **Add audit logging** — Winston log with user info
5. **Write integration tests** — Success, no token, invalid token
6. **Test idempotency** — Multiple logout calls

**Advanced Version (Optional):**

7. **Create RefreshTokenBlacklist model** — If not already in TASK-005
8. **Create blacklist utility** — Hash token, add to blacklist, check blacklist
9. **Integrate blacklist in refresh** — Check blacklist before issuing new tokens
10. **Update logout handler** — Accept refresh token in body, add to blacklist
11. **Test blacklist enforcement** — Blacklisted token rejected on refresh
12. **Test TTL auto-delete** — Blacklist entries cleaned up after token expiry

---

## ✅ Definition of Done — SATISFIED

**Simple Version (COMPLETED):**
- [x] Logout endpoint fully functional
- [x] Token validation enforced
- [x] Audit logging implemented
- [x] All test cases passing (39 tests)
- [x] Test coverage = 100%
- [x] Idempotent (multiple calls work)
- [x] Matches auth spec (api.spec.md + rules.spec.md)

**Advanced Version (Optional, Deferred):**
- [ ] RefreshTokenBlacklist implemented and working
- [ ] Blacklist entries auto-delete after expiry
- [ ] Refresh endpoint checks blacklist
- [ ] Blacklisted tokens rejected on refresh
- [ ] All tests passing
- [ ] Token hashing for storage security

**Decision:** MVP version delivered. Advanced blacklist feature can be added in future iteration if needed.

---

## 🔄 Next Steps

After this task:
- **TASK-008:** Implement optional GET /api/auth/me endpoint
- **TASK-009:** Add rate limiting (optional, from spec Rule 12)
- **TASK-010:** Complete integration testing & Docker build

---

## 📊 Task Metadata

- **Priority:** P0 (MVP Feature)
- **Effort:** 1-2 hours (simple) ✅ COMPLETED
- **Owner:** Backend Team
- **Depends On:** TASK-001, TASK-002, TASK-005, TASK-006
- **Created:** 2026-05-07
- **Completed:** 2026-05-15

---

## Implementation Details Summary

**Endpoint:** POST /api/auth/logout
**File:** BE/auth-service/src/controllers/auth.controller.js (lines 147-169)
**Tests:** BE/auth-service/tests/integration/auth.logout.test.js (39 tests)
**Status:** Simple Version (MVP) ✅ COMPLETE

**Key Metrics:**
- Implementation: 23 lines of code (clean and minimal)
- Test Coverage: 100% (39 integration tests)
- Overall Test Suite: 339 tests passing (99.55% coverage)
- Token Coverage: Logout audit logging fully tested

**Related Updates:**
- spec/features/auth/api.spec.md — Updated "Logout Endpoint" section
- spec/features/auth/rules.spec.md — Updated Rule 6 (logout) and Rule 14 (audit logging)
- docs/architecture/auth-service.md — Updated status to v1.5, added logout to endpoints and controller documentation
- Version bumped to 1.4 in api.spec.md

**Next Steps:**
- TASK-008: Implement optional GET /api/auth/me endpoint
- TASK-009: Add rate limiting (optional)
- TASK-010: Complete integration testing & Docker build
