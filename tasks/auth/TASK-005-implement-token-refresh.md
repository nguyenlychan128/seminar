# TASK-005: Implement Token Refresh Endpoint

## 🎯 Objective

Implement the token refresh endpoint (`POST /api/auth/refresh`) to extend user sessions without re-authentication, with optional refresh token rotation.

---

## 📋 Acceptance Criteria

- [ ] `POST /api/auth/refresh` endpoint created
- [ ] Request validation:
  - RefreshToken: Required, present in request body
  - Authorization header: Required, contains access token
- [ ] Token verification:
  - Refresh token signature valid (JWT_SECRET)
  - Refresh token not expired
  - Token type = "refresh"
  - Optional: Check if token is blacklisted
- [ ] Token generation:
  - New access token (TTL: 15m)
  - New refresh token (TTL: 7d)
  - Both signed with JWT_SECRET
- [ ] Response (200 OK):
  ```json
  {
    "success": true,
    "message": "Token refreshed successfully",
    "data": {
      "accessToken": "...",
      "refreshToken": "...",
      "expiresIn": 900
    }
  }
  ```
- [ ] Error Handling:
  - 400 Bad Request: Missing refresh token
  - 401 Unauthorized: Invalid/expired refresh token, wrong token type
  - 403 Forbidden: Token signature invalid
- [ ] Optional: Refresh token rotation
  - Add old refresh token to blacklist (if implementing RefreshTokenBlacklist)
  - Check new refresh token against blacklist on verify
- [ ] Integration tests in `tests/integration/auth.refresh.test.js`:
  - Successful token refresh
  - Invalid refresh token rejection (401)
  - Expired refresh token rejection (401)
  - Missing refresh token (400)
  - Blacklisted token rejection (401, if implementing)
  - New tokens different from old tokens
  - New tokens valid (can decode and have correct claims)
- [ ] Test coverage ≥ 80%
- [ ] No password or sensitive data in response
- [ ] Token claims match spec exactly

---

## 🔗 Related Spec Files

- `spec/features/auth/api.spec.md` — POST /api/auth/refresh endpoint
- `spec/features/auth/schema.spec.md` — Refresh token structure, optional blacklist model
- `spec/features/auth/rules.spec.md` — Rule 5 (token refresh), Rule 12 (rate limiting optional)

---

## 📝 Implementation Notes

1. **Token Verification Flow:**
   ```javascript
   // 1. Extract refresh token from request body
   // 2. Verify signature (jwt.verify)
   // 3. Check expiry
   // 4. Verify token.type === "refresh"
   // 5. Optional: Check blacklist
   // 6. Generate new access + refresh token
   // 7. Optional: Add old refresh token to blacklist
   // 8. Return new tokens
   ```

2. **Refresh Token Rotation (Optional):**
   - When refreshing, optionally blacklist the old refresh token
   - This prevents token replay attacks if a refresh token is leaked
   - Blacklist entry auto-deletes after token expiry (TTL index)
   - Implementation: Store in `refresh_token_blacklist` collection

3. **Blacklist Model (Optional):**
   ```javascript
   // src/models/RefreshTokenBlacklist.js
   {
     _id: ObjectId,
     userId: ObjectId (ref User),
     token: String (hashed refresh token),
     blacklistedAt: Date (default: now),
     expiresAt: Date (required, TTL index)
   }
   ```

4. **JWT Utility (extend src/utils/jwt.js):**
   ```javascript
   function verifyRefreshToken(token) {
     const decoded = jwt.verify(token, process.env.JWT_SECRET);
     if (decoded.type !== "refresh") {
       throw new Error("Invalid token type");
     }
     return decoded;
   }
   ```

5. **Error Messages:**
   - Missing refresh token: "Refresh token required"
   - Invalid signature: "Invalid token signature"
   - Expired: "Refresh token expired. Please log in again."
   - Wrong type: "Invalid token type"
   - Blacklisted: "Refresh token revoked"

6. **Security:**
   - Verify signature before checking expiry (jwt.verify does both)
   - Never store plaintext refresh tokens (hash if implementing blacklist)
   - Token type check prevents using access token as refresh token
   - Rotation optional but recommended for security

---

## 🚀 Subtasks

1. **Extend JWT utility** — Add verifyRefreshToken() function
2. **Create refresh request validator** — Validate refresh token presence
3. **Create auth service refresh** — src/services/authService.js with refreshToken()
4. **Create refresh route** — src/routes/auth.routes.js with POST /refresh handler
5. **Implement refresh handler** — Verify token, generate new tokens, return
6. **Optional: Create RefreshTokenBlacklist model** — For token rotation
7. **Optional: Implement blacklist check** — In verifyRefreshToken()
8. **Optional: Implement blacklist add** — After successful refresh
9. **Write integration tests** — Success, invalid token, expired, missing
10. **Test token rotation** — If implementing blacklist
11. **Test error cases** — All error paths return correct status + message
12. **Test token validity** — New tokens can be used for authenticated requests

---

## ✅ Definition of Done

- Refresh endpoint fully functional
- Token verification working correctly
- New tokens generated with correct claims and expiry
- All test cases passing
- Test coverage ≥ 80%
- Optional: Refresh token rotation implemented (recommended)
- Error messages match spec exactly
- No sensitive data in response
- Code follows CommonJS style
- Matches auth spec exactly

---

## 🔄 Next Steps

After this task:
- **TASK-006:** Implement JWT authentication middleware
- **TASK-007:** Implement logout endpoint

---

## 📊 Task Metadata

- **Priority:** P0 (MVP Feature)
- **Effort:** 2-3 hours
- **Owner:** Backend Team
- **Depends On:** TASK-001, TASK-002, TASK-004
- **Created:** 2026-05-07
