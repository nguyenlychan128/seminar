# FitGainer Auth Service

JWT-based authentication service with admin user management for the FitGainer fitness application.

## Tech Stack

- **Runtime:** Node.js v18+
- **Framework:** Express
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (jsonwebtoken) + Bcrypt
- **Testing:** Jest + Supertest + MongoMemoryServer
- **Logging:** Winston

## Project Structure

```
src/
├── app.js                     # Express app configuration + error handler mount
├── server.js                  # Server entry point
├── models/                    
│   └── User.js                # User schema with validation & indexes (TASK-002 + TASK-031 additions)
├── config/
│   └── database.js            # MongoDB connection logic (TASK-002)
├── controllers/
│   ├── auth.controller.js     # register, login, refresh, logout, getMe handlers (TASK-003-008)
│   └── adminController.js     # getUserList, deactivateUser handlers (TASK-031-BE)
├── routes/
│   ├── auth.routes.js         # Auth routes (TASK-003-008)
│   └── admin.routes.js        # Admin routes GET/PATCH /users (TASK-031-BE)
├── middleware/
│   ├── errorHandler.js        # Centralized error handling, E11000 → 409 (TASK-003)
│   ├── authenticate.js        # JWT verification middleware (TASK-006)
│   ├── authorize.js           # Role-based access control (TASK-006)
│   ├── rateLimit.js           # Rate limiting on login/register (TASK-009)
│   └── adminValidation.js     # Deactivation action validation (TASK-031-BE)
├── services/
│   ├── authService.js         # register, login, refresh, logout operations (TASK-003-008)
│   └── adminService.js        # getUserList, deactivateUser operations (TASK-031-BE)
└── utils/
    ├── logger.js              # Winston logging (100% coverage)
    ├── validators.js          # Input validation (RFC5322 email regex, password strength)
    ├── bcrypt.js              # hashPassword() & comparePassword() utilities (TASK-003)
    └── jwt.js                 # generateAccessToken, generateRefreshToken, verifyToken (TASK-004-005)

tests/
├── unit/
│   ├── validators.test.js          # 18 tests, 100% coverage
│   ├── bcrypt.test.js              # 18 tests, 100% coverage (TASK-003)
│   ├── jwt.test.js                 # 10+ tests, JWT token generation & verification (TASK-004-005)
│   ├── authenticate.test.js         # 27 tests, token validation middleware (TASK-006)
│   ├── authorize.test.js            # 19 tests, role-based access control (TASK-006)
│   ├── rateLimit.test.js            # 27 tests, rate limiter logic (TASK-009)
│   └── errorHandler.test.js         # 6 tests, error handling middleware (TASK-003)
├── integration/
│   ├── models.test.js              # 49 tests, 100% User model coverage (TASK-002)
│   ├── app.test.js                 # 3 tests, health check & 404 (TASK-001)
│   ├── auth.register.test.js        # 28 tests, registration flow (TASK-003)
│   ├── auth.login.test.js           # 35+ tests, login flow & token generation (TASK-004)
│   ├── auth.refresh.test.js         # 40+ tests, token refresh endpoint (TASK-005)
│   ├── auth.logout.test.js          # 39 tests, logout endpoint (TASK-007)
│   ├── auth.me.test.js              # 35 tests, user info endpoint (TASK-008)
│   ├── auth.middleware.test.js       # 20 tests, authenticate/authorize integration (TASK-006)
│   ├── auth.rateLimit.test.js        # 55 tests, rate limiting integration (TASK-009)
│   ├── auth.e2e.test.js             # 15 tests, full lifecycle E2E (TASK-010)
│   └── admin-users.test.js          # 30 tests, admin user management E2E (TASK-031-BE)
```

## Setup

### Prerequisites

- Node.js v18+
- MongoDB (or MongoDB Memory Server for testing)
- npm v9+

### Installation

```bash
# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env
```

### Environment Variables

See `.env.example` for all required variables:

- `PORT` - Server port (default: 3001)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `JWT_EXPIRES_IN` - Access token TTL (default: 15m)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token TTL (default: 7d)
- `BCRYPT_ROUNDS` - Bcrypt salt rounds (default: 10)
- `LOG_LEVEL` - Winston log level (default: debug)

## Running

### Development

```bash
npm run dev
```

Server will start on `http://localhost:3001`

Health check: `GET http://localhost:3001/health`

### Production

```bash
npm start
```

## Testing

### Run all tests with coverage

```bash
npm test
```

### Run unit tests only

```bash
npm run test:unit
```

### Run integration tests only

```bash
npm run test:integration
```

**Status:** 478/478 passing (Complete auth service with E2E integration + admin user management)

### Watch mode

```bash
npm run test:watch
```

**Coverage threshold:** 80% (branches, functions, lines, statements)

**Current Coverage (TASK-010 Complete):**
- `src/app.js` — 100% (10 tests)
- `src/controllers/auth.controller.js` — 100% (31 register + 35 login + 13 refresh + 39 logout + 35 getMe tests)
- `src/middleware/authenticate.js` — 100% (27 unit tests, 100% branch)
- `src/middleware/authorize.js` — 100% (19 unit tests, 100% branch)
- `src/middleware/errorHandler.js` — 100% (6 tests, 100% branch)
- `src/middleware/rateLimit.js` — 100% (27 unit + 27 integration rate limiting tests)
- `src/models/User.js` — 100% (49 tests)
- `src/routes/auth.routes.js` — 100% (part of 10 tests)
- `src/services/authService.js` — 100% (16 register + 35+ login + 13 refresh tests)
- `src/utils/bcrypt.js` — 100% (18 tests)
- `src/utils/jwt.js` — 100% (100% branch, 10+ tests: token generation, verification, refresh)
- `src/utils/validators.js` — 100% (18 tests)
- **Current Coverage (TASK-031-BE Complete):**
- `src/controllers/adminController.js` — 100% (30 admin user management tests)
- `src/middleware/adminValidation.js` — 100% (deactivation action validation)
- `src/routes/admin.routes.js` — 100% (GET/PATCH routes with middleware)
- `src/services/adminService.js` — 100% (getUserList, deactivateUser functions)
- **Overall:** 98.45% statements, comprehensive coverage (478/478 tests passing including 30 admin tests)

## Docker

### Build

```bash
docker build -t fitgainer-auth:latest .
```

### Run

```bash
docker run -p 3001:3001 \
  -e NODE_ENV=production \
  -e MONGO_URI=mongodb://host.docker.internal:27017/fitgainer-auth \
  -e JWT_SECRET=your-secret-key-min-32-chars \
  fitgainer-auth:latest
```

## Features

### Core Authentication Features (TASK-001 to TASK-010)

- **User Registration** — Email/password registration with bcrypt hashing and validation
- **User Login** — Password verification with JWT token generation (access + refresh)
- **Token Refresh** — Generate new access token from refresh token with database validation
- **Logout** — Invalidate session with audit logging
- **User Info** — Get current authenticated user data from JWT
- **JWT Authentication** — Validate tokens on protected routes
- **Role-Based Access Control** — Enforce User/Admin roles on endpoints
- **Audit Logging** — Track authentication events (login, logout, refresh) with IP and User-Agent
- **Rate Limiting** — Protect login/register endpoints from brute-force attacks

### Admin User Management Features (TASK-031-BE-Auth-Admin)

- **User List** — Get paginated list of users with optional email/status filtering
- **User Deactivation** — Soft delete user accounts (idempotent, cannot self-deactivate)
- **Admin Authorization** — Restrict user management to Admin role only

### Rate Limiting Details

**Endpoints Protected:**
- `POST /api/auth/login` — 5 attempts per 15 minutes per IP
- `POST /api/auth/register` — 3 accounts per 24 hours per IP
- `POST /api/auth/refresh` — No rate limit (users refresh frequently)

**Implementation:**
- In-memory MVP with window expiry logic
- IP-based isolation (different IPs tracked separately)
- Configurable via environment variables:
  - `RATE_LIMIT_LOGIN_WINDOW=900` (seconds)
  - `RATE_LIMIT_LOGIN_MAX_ATTEMPTS=5`
  - `RATE_LIMIT_REGISTER_WINDOW=86400` (seconds)
  - `RATE_LIMIT_REGISTER_MAX_ACCOUNTS=3`
  - `RATE_LIMIT_ENABLED=true`

**Response on Limit Exceeded:**
```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 300
}
```
- Status: 429 Too Many Requests
- retryAfter: Seconds until window resets

**Future Enhancement:** Redis-based rate limiter for distributed/production environments

## API Documentation

See `spec/features/auth/api.spec.md` for complete API specification.

### Core Endpoints

- `POST /api/auth/register` - Register new user (TASK-003)
- `POST /api/auth/login` - Authenticate user (TASK-004)
- `POST /api/auth/refresh` - Refresh access token (TASK-005)
- `POST /api/auth/logout` - Logout user (TASK-007)
- `GET /api/auth/me` - Get current user info (requires token) (TASK-008)

## Logging

Logs are written to `logs/` directory:

- `app.log` - All logs
- `error.log` - Errors only

Console output is colorized in development.

## Development Guidelines

### Code Style

- CommonJS (require/module.exports)
- 2-space indentation
- No TypeScript
- Clear variable names

### Testing

- Write tests first (TDD)
- Use MongoMemoryServer for integration tests
- Aim for 80%+ coverage
- Test error cases

### Security

- Never commit `.env` files
- JWT_SECRET must be ≥32 chars in production
- Password hashing with bcrypt
- Constant-time comparison for sensitive operations

## Implementation Status

| Task | Feature | Status | Details |
|------|---------|--------|---------|
| TASK-001 | Auth Service Scaffolding | ✅ Complete | Express app, validators (100% coverage), logging, Dockerfile, jest config |
| TASK-002 | User Model & Database | ✅ Complete | User.js (7 fields, 3 indexes), database.js (pool 5-20), 49/49 integration tests |
| TASK-003 | Registration Endpoint | ✅ Complete | POST /api/auth/register, controllers + middleware pattern, error handling, 111 tests, 100% coverage |
| TASK-004 | Login Endpoint | ✅ Complete | POST /api/auth/login, password verification, JWT token generation, 186 tests, 100% statements |
| TASK-005 | Token Refresh Endpoint | ✅ Complete | POST /api/auth/refresh, user DB validation, role from DB, 234 tests, 100% coverage |
| TASK-006 | JWT Middleware & RBAC | ✅ Complete | authenticate.js, authorize.js (requireRole), 46 unit tests, 20 integration tests, 100% middleware coverage |
| TASK-007 | Logout Endpoint | ✅ Complete | POST /api/auth/logout, audit logging, 39 comprehensive tests, 100% coverage |
| TASK-008 | User Info Endpoint | ✅ Complete | GET /api/auth/me, JWT-only verification, 35 comprehensive tests, 99.55% statements |
| TASK-009 | Rate Limiting | ✅ Complete | In-memory rate limiter, 5 login/15min, 3 register/24h, 429 responses, 55 tests, 99.6% coverage |
| TASK-010 | Integration Testing & Docker Build | ✅ Complete | E2E test suite (15 tests), npm lint script, .env security fix, Docker build verification, 448 tests, 99.6% statements, 95.07% branches |
| TASK-031-BE-Auth-Admin | Admin User Management | ✅ Complete | User model updated (isDeleted, deletedAt), admin service (getUserList, deactivateUser), admin controller, admin validation, admin routes, 30 integration tests, 98.45% coverage |

## API Endpoints

### Authentication Endpoints (TASK-001 to TASK-010)

**All endpoints require HTTPS in production and use JWT (Bearer token) authentication where indicated.**

#### User Registration
```
POST /api/auth/register
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "User"
  }
}

Error (409 Conflict - email already exists):
{
  "success": false,
  "message": "User with this email already exists"
}
```

#### User Login
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "User",
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}

Error (401 Unauthorized):
{
  "success": false,
  "message": "Invalid email or password"
}
```

#### Token Refresh
```
POST /api/auth/refresh
Content-Type: application/json

Request:
{
  "refreshToken": "eyJhbGc..."
}

Response (200 OK):
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}

Error (401 Unauthorized):
{
  "success": false,
  "message": "Invalid refresh token"
}
```

#### User Logout
```
POST /api/auth/logout
Authorization: Bearer <access_token>

Response (200 OK):
{
  "success": true,
  "message": "Logout successful"
}
```

#### Get Current User Info
```
GET /api/auth/me
Authorization: Bearer <access_token>

Response (200 OK):
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "User"
  }
}
```

### Admin Endpoints (TASK-031-BE-Auth-Admin)

**All admin endpoints require Admin role. Authorization: Bearer <admin_token> required.**

#### List Users
```
GET /api/admin/users?page=1&email=john&status=active
Authorization: Bearer <admin_token>

Query Parameters:
- page (integer, default 1) — 1-indexed page number
- email (string, optional) — Partial email match (case-insensitive)
- status (string, default 'active') — 'active' or 'all' (includes deleted users)

Response (200 OK):
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "role": "User",
      "isDeleted": false,
      "deletedAt": null,
      "createdAt": "2026-05-19T10:00:00.000Z",
      "updatedAt": "2026-05-19T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  }
}

Errors:
- 401 Unauthorized (missing/invalid token)
- 403 Forbidden (non-admin role)
```

#### Deactivate User (Soft Delete)
```
PATCH /api/admin/users/:userId
Authorization: Bearer <admin_token>
Content-Type: application/json

Request:
{
  "action": "deactivate"
}

Response (200 OK):
{
  "message": "User deactivated",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "isDeleted": true
  }
}

Errors:
- 400 Bad Request (invalid userId format, action field missing/invalid, attempting to deactivate own account)
- 401 Unauthorized (missing/invalid token)
- 403 Forbidden (non-admin role)
- 404 Not Found (user does not exist)

Note: Deactivation is idempotent — calling on already-deleted user returns 200
```

## TASK-003: Registration Endpoint (✅ Complete, 2026-05-14)

### Architecture Refactor

**New Files:**
- `src/controllers/auth.controller.js` — Clean registration handler with input validation
- `src/middleware/errorHandler.js` — Centralized error handling (maps E11000 → 409)
- `src/services/authService.js` — registerUser() business logic
- `src/utils/bcrypt.js` — Password hashing and verification

**Modified Files:**
- `src/routes/auth.routes.js` — Reduced from ~80 lines to 9 lines (route definitions only)
- `src/app.js` — Added global error handler middleware

**Removed Scaffolding:**
- `src/dto/` — Empty folder
- `src/events/` — Empty folder
- `src/guards/` — Empty folder
- `src/repositories/` — Empty folder

### Request/Response Flow

```javascript
POST /api/auth/register
├─ Body: { email, password, confirmPassword }
├─ Controller validates: email format, password strength, match
├─ Service hashes password & creates user
├─ Response: 201 { success, message, data: { userId, email, role } }
└─ Error handling: 400 (validation), 409 (duplicate), 500 (server error)
```

### Test Coverage (111 tests, 100% statements)

- **Controllers:** 100% (register handler)
- **Services:** 100% (registerUser with password hashing)
- **Middleware:** 100% (errorHandler for E11000 translation)
- **Routes:** 100% (clean route definitions)
- **Utils:** 100% (bcrypt hash/compare, validators)
- **Integration:** 100% (full registration flow with Supertest)

### Key Behaviors Tested

- Valid registration creates user with hashed password
- Duplicate email returns 409 (E11000 error handling)
- Weak password returns 400 with specific message
- Missing fields return 400
- Response never includes password or passwordHash
- passwordHash stored in DB (bcrypt output)

---

## TASK-002: User Model & Database (✅ Complete)

### User Model (src/models/User.js)

**Schema Fields (7 total):**
- `email` — String, required, RFC5322 regex, lowercase, trim, unique index
- `passwordHash` — String, required, minlength 60 (bcrypt output)
- `role` — Enum ['User', 'Admin'], default 'User', required
- `createdAt` — Date, auto-generated, immutable
- `updatedAt` — Date, auto-generated, updated on modification
- `lastLoginAt` — Date, nullable, used for activity tracking
- `isActive` — Boolean, default true, supports soft-delete pattern

**Indexes (3 created):**
1. `{ email: 1 }` — Unique constraint + fast email lookups
2. `{ email: 1, isActive: 1 }` — Composite for login query optimization
3. `{ lastLoginAt: -1 }` — Descending index for activity tracking

### Database Config (src/config/database.js)

**Connection Pool:**
- Min connections: 5
- Max connections: 20
- Socket timeout: 5000ms
- Server selection timeout: 5000ms
- Connect timeout: 5000ms

**Environment:**
- `MONGO_URI` — MongoDB connection string (default: `mongodb://localhost:27017/fitgainer-auth`)
- Exports: `connectDatabase()` and `disconnectDatabase()` functions
- Error handling: Structured logging without credential exposure

### Test Coverage (49/49 Passing, 100%)

**Test Suites:**
- User Schema Creation — 2 tests
- Email Validation — 7 tests (valid formats, invalid formats, null, numeric, empty)
- Email Uniqueness — 2 tests (duplicate detection, case-insensitive)
- Role Enum Validation — 6 tests (User, Admin, defaults, invalid values, null, numeric)
- Timestamps Auto-generation — 2 tests (createdAt immutable, updatedAt updates)
- isActive Field — 3 tests (default true, explicit false, soft-delete support)
- PasswordHash Validation — 2 tests (valid bcrypt, minlength 60)
- Index Verification — 3 tests (email_1, email_1_isActive_1, lastLoginAt_-1)

**Database:** MongoMemoryServer (isolated testing, no external MongoDB required)

## TASK-005: Token Refresh Endpoint (✅ Complete, 2026-05-15)

### Architecture

**New Files:**
- Updated `src/services/authService.js` — Added refreshToken() method
- Updated `src/controllers/auth.controller.js` — Added refresh() handler
- Updated `src/routes/auth.routes.js` — Added POST /refresh route

**Key Features:**
- Refresh token verification (JWT signature + expiration)
- User database lookup (mandatory, not stateless token verification)
- Account status validation (isActive check)
- Fresh role read from database (prevents stale token issues)
- Generic error messages (prevents token enumeration)
- Comprehensive error handling (400/401/403 codes)

### Request/Response Flow

```javascript
POST /api/auth/refresh
├─ Body: { refreshToken }
├─ Validation: Refresh token provided
├─ Service Processing:
│  ├─ Verify JWT signature
│  ├─ Look up user by userId from token
│  ├─ Check user.isActive === true
│  ├─ Read current user.role from DB
│  └─ Generate new access + refresh tokens
├─ Response: 200 { success, message, data: { accessToken, refreshToken, expiresIn } }
└─ Error handling: 400 (missing), 401 (invalid/expired/user-not-found/disabled), 403 (signature)
```

### Test Coverage (234 tests total, +13 refresh-specific)

**Refresh Controller Tests (13 tests):**
- Valid refresh with valid token → 200 with new tokens
- Missing refreshToken → 400
- Expired refreshToken → 401
- Invalid token signature → 403
- Token user not found → 401
- User account disabled → 401
- User role read from database (not from stale token)
- Response includes fresh access + refresh tokens

**Refresh Integration Tests (20 tests):**
- Full HTTP flow with valid refresh token
- Token claims structure validation
- Access token TTL (15 minutes) in new token
- Refresh token TTL (7 days) in new token
- User lookup from database performed
- Error responses properly formatted
- Security: Database validation mandatory

### Key Behaviors Tested

- Refresh token must be verified (not just accepted)
- User must exist in database (not just valid token)
- Account must be active (isActive check)
- Role read from database (fresh data, not stale token)
- Error handling: validation → 400, auth → 401, signature → 403
- New tokens issued with current database values
- Response excludes sensitive data

### Security Implementation

1. **Database-Backed Validation**
   - Token verification is not sufficient
   - User lookup from database is mandatory
   - Prevents stale token issues

2. **Account Status Enforcement**
   - isActive flag checked (prevents disabled users from refreshing)

3. **Fresh Role Integration**
   - User role read from database (not from JWT claims)
   - Reflects role changes immediately

4. **Error Message Generalization**
   - Generic messages prevent user enumeration
   - Same message for various failure cases

---

## License

MIT

## TASK-004: Login Endpoint (✅ Complete, 2026-05-14)

### Architecture

**New Files:**
- `src/utils/jwt.js` — JWT token generation and verification
  - `generateAccessToken(user)` — Create 15m access token with userId, email, role claims
  - `generateRefreshToken(user)` — Create 7d refresh token with userId, email, type='refresh'
  - `verifyToken(token)` — Verify access token (rejects refresh tokens)
  - `verifyRefreshToken(token)` — Verify refresh token (rejects access tokens)

**Modified Files:**
- `src/controllers/auth.controller.js` — Added login handler with validation (email format, string types, length limits)
- `src/services/authService.js` — Added loginUser() service with password comparison and token generation
- `src/routes/auth.routes.js` — Added `POST /login` route

### Request/Response Flow

```javascript
POST /api/auth/login
├─ Body: { email, password }
├─ Validation:
│  ├─ Both fields present & non-empty
│  ├─ Email is valid format (RFC5322)
│  ├─ Password length ≤ 128 characters
│  ├─ Both are strings (type guard)
├─ Service lookup: findOne({ email: lowercase })
├─ Security: constant-time bcrypt comparison (even if user not found)
├─ Checks:
│  ├─ User exists
│  ├─ User.isActive === true
│  ├─ Password matches
├─ On success:
│  ├─ Generate accessToken (15m, HS256)
│  ├─ Generate refreshToken (7d, HS256)
│  ├─ Update lastLoginAt
│  ├─ Log audit event (userId, email, IP, User-Agent)
│  ├─ Response 200 { success, message, data: { userId, email, role, tokens, expiresIn } }
└─ On failure:
   ├─ 400: Validation error
   ├─ 401: Invalid credentials / inactive account
   └─ 500: Server error
```

### Test Coverage (186 tests, 35 login-specific)

**Login Controller Tests (15 tests):**
- Valid credentials → 200 with tokens
- Missing email → 400
- Missing password → 400
- Empty email after trim → 400
- Empty password after trim → 400
- Email not string → 400
- Password not string → 400
- Password > 128 chars → 400
- Invalid email format → 400
- User not found → 401 (timing-safe)
- Account inactive → 401
- Wrong password → 401
- IP address extraction (from req.ip, req.socket.remoteAddress)
- User-Agent extraction (from request header)

**Login Integration Tests (20 tests):**
- Full HTTP flow with registered user
- Token structure validation (header, payload, signature)
- Token claims present (userId, email, role, iat, exp)
- Access token TTL (15 minutes)
- Refresh token TTL (7 days)
- lastLoginAt updated
- Audit logging captured
- Error responses properly formatted

**JWT Unit Tests (10+ tests):**
- generateAccessToken creates valid JWT
- generateRefreshToken creates valid JWT
- Access token claims structure
- Refresh token claims structure (includes type field)
- verifyToken accepts valid token
- verifyToken rejects refresh token used as access
- verifyRefreshToken rejects access token used as refresh
- JWT_SECRET validation (throws if not set)
- Algorithm HS256 enforced

### Key Behaviors Tested

- Login succeeds with valid email & password
- Timing-safe password comparison (same duration for found/not-found users)
- Generic error messages prevent user enumeration
- Account status enforced (isActive check)
- Token TTLs correct (access 15m, refresh 7d)
- Audit logging captures security events
- Response excludes sensitive data (no password, no passwordHash)
- Error handling: validation → 400, auth → 401, server → 500

### Security Hardening

1. **Timing Attack Prevention**
   - Uses dummy hash if user not found: `comparePassword(inputPassword, DUMMY_HASH)`
   - bcrypt.compare duration is constant regardless of user existence

2. **Information Disclosure Prevention**
   - Generic error: "Invalid email or password" (no distinction between user not found vs wrong password)
   - Audit logs capture suspicious activity (IP, User-Agent)

3. **Input Validation**
   - Email format validated (RFC5322)
   - Password type-checked (string only)
   - Password length limited (max 128 chars prevents DoS)
   - Email/password trimmed and validated before processing

4. **Account Security**
   - isActive check prevents login with disabled accounts
   - lastLoginAt updated for activity tracking
   - JWT secrets validated at startup

---

## TASK-006: JWT Authentication & RBAC Middleware (✅ Complete, 2026-05-15)

### Middleware Overview

Two complementary middleware components protect routes and enforce role-based access control:

**New Files:**
- `src/middleware/authenticate.js` — JWT token validation and extraction
- `src/middleware/authorize.js` — Role-based access control enforcement
- Updated `src/app.js` — Exports both middleware for use by other services

### Usage in Routes

#### Protected Routes (Requires Valid JWT)

```javascript
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');
const authController = require('../controllers/auth.controller');

// User must be authenticated (any role)
router.get('/api/auth/me', authenticate, authController.getMe);

// Admin-only endpoint
router.post('/api/admin/users', authenticate, requireRole(['Admin']), adminController.createUser);

// Multiple roles allowed
router.get('/api/protected/data', authenticate, requireRole(['User', 'Admin']), dataController.getData);
```

### authenticate Middleware

**Purpose:** Validates JWT token from Authorization header and extracts user info

**Behavior:**
```
1. Extracts Authorization header (format: "Bearer <token>")
2. Validates header format (must have 2 parts: "Bearer" and token)
3. Verifies JWT signature using HS256
4. Checks token expiration
5. Rejects refresh tokens (access tokens only)
6. Sets req.user with { userId, email, role }
```

**Error Responses:**
- 401 "Missing authorization token" — No Authorization header provided
- 401 "Invalid authorization header" — Wrong format (not "Bearer <token>")
- 401 "Token expired" — Token has expired
- 401 "Invalid token signature" — Token invalid or signature mismatch

**Example Test:**
```javascript
test('authenticate validates JWT and sets req.user', async () => {
  const token = generateAccessToken(user);
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);
  
  expect(res.status).toBe(200);
  expect(res.body.user.email).toBe(user.email);
});
```

### requireRole Middleware

**Purpose:** Enforces role-based access control (RBAC) on authenticated users

**Behavior:**
```
1. Checks req.user exists (authenticate must run first)
2. Compares user.role against allowedRoles array
3. Grants access if role matches
4. Denies access if role not authorized
```

**Error Responses:**
- 401 "Unauthorized" — No req.user (authenticate middleware did not run)
- 403 "Forbidden" — User authenticated but lacks required role

**Usage:**
```javascript
// Single role
router.post('/admin/reset', authenticate, requireRole(['Admin']), adminController.reset);

// Multiple allowed roles
router.get('/profile', authenticate, requireRole(['User', 'Admin']), userController.getProfile);
```

**Example Test:**
```javascript
test('requireRole denies non-admin users', async () => {
  const userToken = generateAccessToken(regularUser); // role: 'User'
  const res = await request(app)
    .post('/api/admin/users')
    .set('Authorization', `Bearer ${userToken}`);
  
  expect(res.status).toBe(403);
  expect(res.body.message).toBe('Forbidden');
});
```

### Middleware Ordering

Correct middleware ordering is critical. Always apply `authenticate` before `requireRole`:

```javascript
// ✅ CORRECT: authenticate first, then requireRole
router.post('/api/admin/action', 
  authenticate,              // Step 1: Validate token and extract user
  requireRole(['Admin']),     // Step 2: Check role
  adminController.action     // Step 3: Handle request
);

// ❌ WRONG: This will fail because requireRole requires req.user
router.post('/api/admin/action',
  requireRole(['Admin']),    // ERROR: req.user not set yet!
  authenticate,
  adminController.action
);
```

### Security Properties

**Authentication:**
- Algorithm pinning: HS256 only (no algorithm confusion attacks)
- Token expiry enforced: Expired tokens rejected
- Token type validation: Access tokens only (refresh tokens rejected)
- No stale data: Fresh token validation on every request

**Authorization:**
- Role from JWT claims (set during login from database)
- Whitelist approach: Only explicitly allowed roles are granted
- Generic error messages: No disclosure of role requirements

**Integration with App.js:**

The middleware is exported from `app.js` for use by other services:

```javascript
// In BE/auth-service/src/app.js
const { authenticate } = require('./middleware/authenticate');
const { requireRole } = require('./middleware/authorize');

module.exports = app;
module.exports.authenticate = authenticate;
module.exports.requireRole = requireRole;
```

Other services can import and use:
```javascript
const authApp = require('fitgainer-auth-service/src/app');
const { authenticate, requireRole } = authApp;

// In user-service, workout-service, etc.
router.get('/profile', authenticate, controller.getProfile);
```

### Test Coverage (66 new tests)

**Unit Tests (46 tests):**
- authenticate: 27 tests for token extraction, validation, error cases
- requireRole: 19 tests for role checking and authorization decisions

**Integration Tests (20 tests):**
- Full HTTP flows with valid/invalid tokens
- Role-based endpoint access
- Error response formatting
- Middleware ordering validation

**Total Test Suite:** 300/300 passing (234 prior + 66 new)

---

## Support

For issues or questions, refer to the FitGainer documentation at `spec/features/auth/`
