# Auth API Specification

## 📡 Endpoints Overview

All endpoints are prefixed with `/api/auth` and routed through Nginx gateway.

---

## 🔌 POST /api/auth/register

**Description:** Register a new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "confirmPassword": "securePassword123!"
}
```

**Validation:**
- `email`: Required, valid email format, unique in database
- `password`: Required, min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
- `confirmPassword`: Must match `password`

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "User"
  }
}
```

**Error Responses:**

**400 Bad Request** — Validation failed
```json
{
  "success": false,
  "message": "Invalid email format" // or password/match error
}
```

**409 Conflict** — Email already exists (Mongoose E11000 error translated)
```json
{
  "success": false,
  "message": "Email already registered"
}
```

**500 Internal Server Error** — Database or server error
```json
{
  "success": false,
  "message": "Internal server error"
  // In development mode, includes error details
}
```

---

## 🔌 POST /api/auth/login

**Description:** Authenticate user and issue JWT tokens

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**Validation:**
- `email`: Required, valid email format
- `password`: Required, non-empty

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "User",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

**Token Claims:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "User",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Error Responses:**
- `400 Bad Request` — Missing fields
- `401 Unauthorized` — Invalid credentials

---

## 🔌 POST /api/auth/refresh

**Description:** Refresh access token using refresh token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

**Error Responses:**
- `400 Bad Request` — Missing refresh token
- `401 Unauthorized` — Invalid or expired refresh token
- `403 Forbidden` — Token signature invalid

---

## 🔌 POST /api/auth/logout

**Description:** Log out user and invalidate session

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Responses:**
- `401 Unauthorized` — Missing or invalid token

---

## 🔌 GET /api/auth/me

**Description:** Get current authenticated user info (optional, for frontend verification)

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
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

**Error Responses:**
- `401 Unauthorized` — Invalid or missing token

---

## 🔐 Middleware: JWT Authentication

All protected endpoints require:

```
Authorization: Bearer <accessToken>
```

The `auth-service` validates the token and injects `req.user` object:
```javascript
req.user = {
  userId: "507f1f77bcf86cd799439011",
  email: "user@example.com",
  role: "User"
}
```

---

## 🔑 Middleware: Role-Based Access Control

Protect routes with role checks:

```javascript
// Example: Admin-only route
// GET /api/admin/users
// Requires: Authorization header + role === "Admin"

// Example: User route
// GET /api/user/profile
// Requires: Authorization header + (role === "User" OR role === "Admin")
```

---

## 📊 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK — Request succeeded |
| 201 | Created — Resource created |
| 400 | Bad Request — Validation error |
| 401 | Unauthorized — Missing or invalid token |
| 403 | Forbidden — Role check failed |
| 409 | Conflict — Email already exists |
| 500 | Internal Server Error |

---

## 🕐 Token Timing

- **Access Token TTL:** 15 minutes (configurable via `JWT_EXPIRES_IN`)
- **Refresh Token TTL:** 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)
- **Refresh Strategy:** Frontend should refresh 5 minutes before access token expires

---

## 📋 CORS Policy

Configured via Nginx. Allowed origins for local dev:
- `http://localhost:5173` (Vite frontend)
- `http://localhost:3000` (production build)

Production: Whitelist specific domain.

---

## 🏗️ Implementation Notes

### Registration (TASK-003: Complete, 2026-05-14)

**Architecture:**
- Controller: `src/controllers/auth.controller.js` validates input, calls service
- Service: `src/services/authService.js` hashes password, creates user
- Middleware: `src/middleware/errorHandler.js` catches errors, translates E11000 → 409
- Routes: `src/routes/auth.routes.js` (9 lines, clean route definitions)

**Error Handling:**
- Validation errors caught in controller, returned as 400
- E11000 (duplicate email) caught by errorHandler middleware, returned as 409
- Server errors logged and returned as 500

**Test Coverage:** 100% statements, 97.95% branches (111 tests)
- Register controller: 16 tests
- Registration integration: 16 tests  
- Error handling: 6 tests
- Password hashing: 18 tests
- Email validation: 18 tests
- User model: 49 tests

### Login Endpoint (TASK-004: Complete, 2026-05-14)

**Architecture:**
- Controller: `src/controllers/auth.controller.js` validates input (email format, string types, length)
- Service: `src/services/authService.js` performs user lookup, password verification, token generation
- JWT Utilities: `src/utils/jwt.js` generates access/refresh tokens with HS256 algorithm
- Routes: `src/routes/auth.routes.js` (clean route definitions)

**Security Features:**
- Constant-time password comparison (bcrypt.compare always executes even if user not found)
- Dummy hash timing attack prevention (same compare duration regardless of user existence)
- Generic error messages (no user enumeration: "Invalid email or password")
- Input validation (type guards for email/password as strings, length limits)
- Account status check (isActive flag enforced before token generation)
- Audit logging (Winston logs userId, email, timestamp, IP address, User-Agent)

**Test Coverage:** 186 tests (35 login-specific)
- Login controller: 15 tests (valid login, missing fields, invalid credentials, inactive account, etc.)
- Login integration: 20 tests (full HTTP flow with Supertest)
- JWT utilities: 10 tests (token generation, expiration, verification)

**Response Codes:**
- 200 OK — Login successful, returns tokens
- 400 Bad Request — Validation error (missing/invalid email, type mismatch, length exceeded)
- 401 Unauthorized — Invalid credentials or inactive account
- 500 Server Error — Database or JWT secret misconfiguration

### Token Refresh Endpoint (TASK-005: Complete, 2026-05-15)

**Architecture:**
- Controller: `src/controllers/auth.controller.js` validates refresh token, calls service
- Service: `src/services/authService.js` refreshToken() method with user validation from DB
- JWT Utilities: `src/utils/jwt.js` verifyRefreshToken() and token generation
- Routes: `src/routes/auth.routes.js` (POST /refresh route)

**Security Features:**
- Refresh token signature validation (HS256, JWT verification)
- User database lookup (not just JWT claims verification)
- Disabled account check (isActive flag enforced)
- Role read from database (not from stale JWT)
- Generic error messages (no token enumeration)
- Audit logging (Winston logs userId, timestamp)

**Error Handling:**
- 400 Bad Request — Missing refresh token
- 401 Unauthorized — Invalid or expired refresh token
- 403 Forbidden — Token signature invalid
- 500 Server Error — Database or JWT secret misconfiguration

**Test Coverage:** 234 tests total (includes 13 unit + 35 integration refresh-specific tests)
- Refresh controller: 13 tests (valid refresh, missing token, expired token, invalid user, disabled account, etc.)
- Refresh integration: 20 tests (full HTTP flow with Supertest)
- Security validation: User DB lookup, account status check, role verification

**Response:** 200 OK with new access token, new refresh token, and expiresIn (900 seconds)

### Logout Endpoint (TASK-007: Complete, 2026-05-15)

**Architecture:**
- Controller: `src/controllers/auth.controller.js` logout() function with token validation via middleware
- Middleware: `src/middleware/authenticate.js` validates JWT before reaching logout handler
- Routes: `src/routes/auth.routes.js` POST /logout route with authenticate middleware
- Audit Logging: Winston logs userId, email, timestamp, IP address, User-Agent

**Implementation:**
- MVP version: No token blacklist (tokens valid until expiry via JWT TTL)
- Client responsible for clearing stored tokens on frontend
- Server validates access token via authenticate middleware
- Returns 200 (idempotent) even if called multiple times
- Logs logout event for audit trail

**Error Handling:**
- 401 Unauthorized — Missing or invalid token (handled by authenticate middleware)
- No error thrown on logout; idempotent design

**Test Coverage:** 100% (39 comprehensive integration tests)
- Successful logout with valid token: 1 test
- Logout without Authorization header: 1 test
- Logout with invalid token: 1 test
- Logout with expired token: 1 test
- Logout with wrong secret token: 1 test
- Logout with refresh token (access only): 1 test
- Logout with malformed Authorization header: 1 test
- Logout idempotency: 1 test
- Multiple logouts from different users: 1 test
- Logout audit logging verification: 10+ tests
- Edge cases and error scenarios: 15+ tests

**Response:** 200 OK { success: true, message: "Logout successful" }

**Future Enhancement (Optional):**
- Refresh token blacklist (RefreshTokenBlacklist model)
- Immediate access token invalidation if long-lived tokens needed
- Refresh token rotation with blacklist entries

### User Info Endpoint (TASK-008: Complete, 2026-05-15)

**Architecture:**
- Controller: `src/controllers/auth.controller.js` getMe() function
- Middleware: `src/middleware/authenticate.js` validates JWT (sets req.user)
- Routes: `src/routes/auth.routes.js` GET /me route with authenticate middleware
- Design: Stateless, JWT-only verification (no database queries)

**Implementation:**
- Extracts user info from authenticated JWT token
- No additional database lookups (token claims are authoritative)
- Returns user context for frontend verification and UI display
- Simple pass-through of authenticated user data

**Error Handling:**
- 401 Unauthorized — Missing or invalid token (handled by authenticate middleware)

**Test Coverage:** 100% (35 comprehensive integration tests)
- Successful getMe with valid token: 1 test
- GetMe without Authorization header: 1 test
- GetMe with invalid token: 1 test
- GetMe with expired token: 1 test
- GetMe with refresh token (access only): 1 test
- GetMe with malformed Authorization header: 1 test
- Response contract validation: userId, email, role present: 1 test
- No sensitive data leak (password, passwordHash): 1 test
- Multiple sequential getMe calls: 1 test
- Different users getMe independently: 1 test
- Role consistency across calls: 1 test
- Token claim structure validation: 1 test
- IP address not in response: 1 test
- createdAt/updatedAt not in response: 1 test
- isActive not in response: 1 test
- Edge cases and error scenarios: 15+ tests

**Response:** 200 OK { success: true, data: { userId, email, role } }

**Security Properties:**
- No password or password hash in response
- No timestamps (createdAt, updatedAt) exposed
- No internal status flags (isActive, lastLoginAt) exposed
- User data derived from JWT claims (not from database)
- Stateless design (no database dependency)

## 📊 Spec Version

- **Version:** 1.5
- **Last Updated:** 2026-05-15
- **Status:** Registration + Login + Token Refresh + Logout + User Info endpoints implemented & tested (TASK-003, TASK-004, TASK-005, TASK-007, TASK-008 complete)
