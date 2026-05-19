# TASK-004: Implement User Login Endpoint

## 🎯 Objective

Implement the login endpoint (`POST /api/auth/login`) with JWT token generation, credential verification, and audit logging per spec.

---

## 📋 Acceptance Criteria

- [ ] `POST /api/auth/login` endpoint created
- [ ] Request validation:
  - Email: Required, valid format
  - Password: Required, non-empty
- [ ] Credential verification:
  - User exists and email is active (`isActive: true`)
  - Password matches stored hash (bcrypt.compare with constant-time)
  - Return 401 "Invalid email or password" for any mismatch (no info leak)
- [ ] JWT token generation (two tokens):
  - Access token: Claims {userId, email, role, iat, exp}, TTL 15m
  - Refresh token: Claims {userId, email, type: "refresh", iat, exp}, TTL 7d
  - Both signed with JWT_SECRET
  - Algorithm: HS256
- [ ] Response (200 OK):
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "userId": "...",
      "email": "...",
      "role": "User",
      "accessToken": "...",
      "refreshToken": "...",
      "expiresIn": 900
    }
  }
  ```
- [ ] Side effects:
  - Update `lastLoginAt` timestamp
  - Log login event: structured JSON {userId, email, timestamp, ip, userAgent}
- [ ] Error Handling:
  - 400 Bad Request: Missing email or password
  - 401 Unauthorized: Invalid credentials, account inactive
  - 500 Internal Server Error: Database/token generation failure
- [ ] Unit tests in `tests/unit/jwt.test.js`:
  - Token generation (payload, claims, expiry)
  - Token signature validation
  - Token expiry detection
  - Invalid token rejection
- [ ] Integration tests in `tests/integration/auth.login.test.js`:
  - Successful login (tokens returned)
  - Duplicate request same password (different tokens)
  - Invalid email (401)
  - Invalid password (401)
  - Inactive user (401)
  - Missing email/password (400)
  - lastLoginAt updated
- [ ] Test coverage ≥ 80%
- [ ] No password logged or returned
- [ ] Token claims match spec exactly
- [ ] Constant-time password comparison (bcrypt.compare)

---

## 🔗 Related Spec Files

- `spec/features/auth/api.spec.md` — POST /api/auth/login endpoint
- `spec/features/auth/schema.spec.md` — JWT payload structure
- `spec/features/auth/rules.spec.md` — Rule 3 (login), Rule 7 (password storage), Rule 14 (audit logging)

---

## 📝 Implementation Notes

1. **JWT Token Structure:**

   **Access Token:**
   ```json
   {
     "userId": "507f1f77bcf86cd799439011",
     "email": "user@example.com",
     "role": "User",
     "iat": 1715116600,
     "exp": 1715117500
   }
   ```

   **Refresh Token:**
   ```json
   {
     "userId": "507f1f77bcf86cd799439011",
     "email": "user@example.com",
     "type": "refresh",
     "iat": 1715116600,
     "exp": 1715721400
   }
   ```

2. **JWT Utility (src/utils/jwt.js):**
   ```javascript
   const jwt = require('jsonwebtoken');
   
   function generateAccessToken(user) {
     return jwt.sign(
       { userId: user._id, email: user.email, role: user.role },
       process.env.JWT_SECRET,
       { expiresIn: process.env.JWT_EXPIRES_IN || "15m", algorithm: "HS256" }
     );
   }
   
   function generateRefreshToken(user) {
     return jwt.sign(
       { userId: user._id, email: user.email, type: "refresh" },
       process.env.JWT_SECRET,
       { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d", algorithm: "HS256" }
     );
   }
   
   function verifyToken(token) {
     return jwt.verify(token, process.env.JWT_SECRET);
   }
   
   function verifyRefreshToken(token) {
     const decoded = jwt.verify(token, process.env.JWT_SECRET);
     if (decoded.type !== "refresh") throw new Error("Invalid token type");
     return decoded;
   }
   ```

3. **Login Handler Flow:**
   ```javascript
   // 1. Validate input (email, password present)
   // 2. Find user by email (case-insensitive)
   // 3. Check isActive
   // 4. Compare password with passwordHash (bcrypt.compare)
   // 5. If match:
   //    - Generate access token
   //    - Generate refresh token
   //    - Update lastLoginAt
   //    - Log login event
   //    - Return 200 with tokens
   // 6. If mismatch: Return 401 (generic message, no info leak)
   ```

4. **Audit Logging (Winston):**
   ```javascript
   logger.info('User login', {
     userId: user._id,
     email: user.email,
     timestamp: new Date().toISOString(),
     ip: req.ip,
     userAgent: req.get('User-Agent')
   });
   ```

5. **Error Messages:**
   - Generic: "Invalid email or password" (no leaking which field is wrong)
   - Account inactive: "Account is disabled"
   - Missing fields: "Email and password are required"

6. **Security:**
   - Use bcrypt.compare (constant-time, prevents timing attacks)
   - Same error message for "user not found" and "wrong password"
   - No plaintext password in logs
   - Tokens signed with strong secret (≥32 chars)
   - expiresIn in response is TTL in seconds (900 for 15m)

---

## 🚀 Subtasks

1. **Create JWT utility** — src/utils/jwt.js with token generation & verification
2. **Create login request validator** — Validate email and password presence
3. **Create auth service login** — src/services/authService.js with loginUser()
4. **Create login route** — src/routes/auth.routes.js with POST /login handler
5. **Implement password verification** — Use bcrypt.compare (constant-time)
6. **Implement token generation** — Access + refresh tokens with correct claims
7. **Update lastLoginAt** — On successful login
8. **Add audit logging** — Log login events with Winston
9. **Write unit tests for JWT** — Token generation, verification, expiry
10. **Write integration tests** — Login success, failure, token validity
11. **Test error cases** — Invalid credentials, missing fields, inactive user
12. **Test security** — No password leaks, generic error messages, token format

---

## ✅ Definition of Done

- Login endpoint fully functional
- JWT tokens generated with correct claims and expiry
- Constant-time password comparison implemented
- Audit logging records all login attempts
- All test cases passing
- Test coverage ≥ 80%
- No plaintext passwords in logs or responses
- Error messages don't leak user information
- Tokens match spec exactly
- Code follows CommonJS style
- Matches auth spec exactly

---

## 🔄 Next Steps

After this task:
- **TASK-005:** Implement token refresh endpoint
- **TASK-006:** Implement JWT authentication middleware

---

## 📊 Task Metadata

- **Priority:** P0 (MVP Feature)
- **Effort:** 3-4 hours
- **Owner:** Backend Team
- **Depends On:** TASK-001, TASK-002, TASK-003
- **Created:** 2026-05-07
