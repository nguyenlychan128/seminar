# Auth Service Codemap v2.6

**Service:** `BE/auth-service` | **Port:** 3001 | **Last Updated:** 2026-05-19 | **Status:** Phase 1a-1j ✅ (Core Auth Complete) + Phase 4b ✅ (Admin User Management TASK-031-BE-Auth-Admin)

---

## 📌 Overview

Codemap for the FitGainer Authentication Service. This document provides a structural overview of the codebase, module dependencies, and data flows for quick developer onboarding.

---

## 🗂️ Directory Structure

```
BE/auth-service/
├── src/
│   ├── server.js                  # Entry point: HTTP server setup
│   ├── app.js                     # Express app: middleware, routing (TASK-001)
│   ├── utils/
│   │   ├── logger.js              # Winston logging factory (TASK-001, 100% coverage)
│   │   ├── validators.js          # Input validation (email, password) (TASK-001, 100% coverage)
│   │   ├── bcrypt.js              # ✅ hashPassword() & comparePassword() (TASK-003, 100% coverage)
│   │   └── jwt.js                 # ✅ Token generation & verification (TASK-004, TASK-005, 100% coverage)
│   ├── models/                    # Mongoose schemas
│   │   ├── User.js                # ✅ User schema with 7 fields, 3 indexes (TASK-002, 100% coverage)
│   │   └── token-blacklist.model.js # [To implement]
│   ├── config/                    # Configuration
│   │   ├── database.js            # ✅ MongoDB connection with pool config (TASK-002, 100% coverage)
│   │   └── index.js               # [To implement]
│   ├── services/                  # Business logic
│   │   ├── authService.js         # ✅ registerUser() & loginUser() & refreshToken() (TASK-003, 004, 005, 100% coverage)
│   │   └── adminService.js        # ✅ getUserList() & deactivateUser() (TASK-031-BE, soft delete, pagination, filtering)
│   ├── controllers/               # Route handlers
│   │   ├── auth.controller.js     # ✅ register() & login() & refresh() & logout() & getMe() (TASK-003, 004, 005, 007, 008, 100% coverage)
│   │   └── adminController.js     # ✅ getUserList() & deactivateUser() (TASK-031-BE, 30 integration tests)
│   ├── middleware/                # Custom middleware
│   │   ├── authenticate.js        # ✅ JWT token validation & extraction (TASK-006, 100% coverage)
│   │   ├── authorize.js           # ✅ RBAC with requireRole() (TASK-006, 100% coverage)
│   │   ├── errorHandler.js        # ✅ Global error handling, E11000 → 409 (TASK-003, 100% coverage)
│   │   ├── rateLimit.js           # ✅ Rate limiting middleware (TASK-009, 100% coverage)
│   │   └── adminValidation.js     # ✅ validateUserDeactivate() (TASK-031-BE, require action='deactivate')
│   ├── routes/                    # API routes
│   │   ├── auth.routes.js         # ✅ Route definitions (TASK-003, 004, 005, 007, 008, 100% coverage)
│   │   └── admin.routes.js        # ✅ GET/PATCH /admin/users routes (TASK-031-BE, authenticate + authorize middleware)
│   └── events/                    # Event publishers [Future]
│       └── auth.events.js         # [To implement]
├── tests/
│   ├── unit/
│   │   ├── validators.test.js     # ✅ 18 tests, 100% coverage (TASK-001)
│   │   ├── bcrypt.test.js         # ✅ 18 tests, 100% coverage (TASK-003)
│   │   ├── jwt.test.js            # ✅ 26+ tests, 100% coverage (TASK-004, TASK-005)
│   │   ├── middleware.test.js     # ✅ 65 tests, 100% coverage (TASK-006, 009: authenticate 27 + authorize 19 + rateLimit 27 unit)
│   └── integration/               
│       ├── models.test.js         # ✅ 49 tests, 100% coverage (TASK-002)
│       ├── auth.register.test.js  # ✅ 16 tests, registration E2E (TASK-003)
│       ├── auth.login.test.js     # ✅ 35+ tests, login E2E (TASK-004)
│       ├── auth.refresh.test.js   # ✅ 20 tests, refresh E2E (TASK-005)
│       ├── auth.logout.test.js    # ✅ 39 tests, logout E2E (TASK-007)
│       ├── auth.getme.test.js     # ✅ 35 tests, getMe E2E (TASK-008)
│       ├── auth.rateLimit.test.js # ✅ 27 tests, rate limiting E2E (TASK-009)
│       ├── auth.e2e.test.js       # ✅ 15 tests, full lifecycle E2E (TASK-010)
│       ├── auth.middleware.test.js# ✅ 20 tests, middleware integration (TASK-006)
│       ├── app.test.js            # ✅ 10 tests, app & routes (TASK-003)
│       └── admin-users.test.js    # ✅ 30 tests, admin user management E2E (TASK-031-BE)
├── logs/                          # [Runtime logs — .gitignored]
│   ├── app.log
│   └── error.log
├── Dockerfile                     # Production container
├── jest.config.js                 # Test configuration (80% coverage)
├── package.json                   # Dependencies & scripts
├── .env.example                   # Environment template
├── .gitignore                     # Excludes .env, logs, node_modules
└── README.md                      # Service documentation

```

---

## 🔌 Module Dependencies

### Implemented Modules

#### `src/server.js`
**Responsibility:** HTTP server lifecycle management
- Entry point for the service
- Creates Express app via `require('./app')`
- Initializes MongoDB connection (future)
- Starts HTTP server on `PORT`
- Handles graceful shutdown
- Logs startup/shutdown via logger

**Dependencies:**
- `./app.js` — Express app
- `./utils/logger.js` — Winston logger
- `dotenv` (env variables)

**Exports:** None (side effects only, called directly)

**Testing:** Integration tests (future)

#### `src/app.js`
**Responsibility:** Express application configuration
- Middleware setup (body parsers, logging, CORS, error handling)
- Route registration (future)
- Health check endpoint: `GET /health`
- Global error handler

**Dependencies:**
- `express` — Framework
- `./utils/logger.js` — Request/response logging
- Middleware imports (future: auth, error handlers)

**Exports:** `module.exports = app` (Express app instance)

**Route Stubs (future):**
```
POST   /api/auth/register      → authController.register
POST   /api/auth/login         → authController.login
POST   /api/auth/refresh       → authController.refresh
POST   /api/auth/logout        → authController.logout
GET    /api/auth/me            → authController.getMe
GET    /health                 → (inline)
```

**Testing:** Unit (app initialization) + Integration (via HTTP)

#### `src/utils/logger.js`
**Responsibility:** Centralized Winston logging

**Exported Functions:**
- `createLogger(label)` — Create labeled logger instance
  - Returns Winston logger with console + file transports
  - Respects `LOG_LEVEL` env variable
  - Colorized output in development (NODE_ENV !== 'production')
  - Structured JSON in production

**Usage Example:**
```javascript
const logger = require('./utils/logger');
const log = logger.createLogger('AuthService');
log.info('User registered', { userId, email });
log.error('Registration failed', { error: err.message });
```

**Environment Variables:**
- `LOG_LEVEL` (default: 'debug')
- `NODE_ENV` (affects formatting)

**Testing:** 100% coverage (unit tests)

**Log Files:**
- `logs/app.log` — All logs
- `logs/error.log` — Errors only

#### `src/utils/validators.js`
**Responsibility:** Input validation for auth endpoints

**Exported Functions:**

1. **`validateEmail(email): boolean`**
   - RFC 5322 compliant regex
   - Returns true/false
   - Example: `validateEmail('user@example.com')` → true

2. **`validatePassword(password): { valid: boolean, errors: string[] }`**
   - Min 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character
   - Returns object with `valid` flag and error messages

3. **`validatePasswordMatch(pwd, confirmPwd): boolean`**
   - Strict equality check
   - Returns true if match, false otherwise

4. **`validateLoginInput(email, password): { valid: boolean, errors: string[] }`**
   - Combines email & password validation
   - Returns aggregated errors

5. **`validateRegistrationInput(email, pwd, confirmPwd): { valid: boolean, errors: string[] }`**
   - Combines email, password, and match validation
   - Returns aggregated errors

**Usage Example:**
```javascript
const validators = require('./utils/validators');

// In controller
const { valid, errors } = validators.validateRegistrationInput(
  req.body.email,
  req.body.password,
  req.body.confirmPassword
);
if (!valid) {
  return res.status(400).json({ errors });
}
```

**Testing:** 100% coverage (18 unit tests in `tests/unit/validators.test.js`)

---

### Implemented Modules (TASK-002)

#### `src/models/User.js` ✅ IMPLEMENTED
**Responsibility:** User data schema & persistence with validation

**Schema Fields:**
```javascript
{
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [RFC5322_REGEX, 'Invalid email format']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required'],
    minlength: [60, 'Password hash must be at least 60 characters']
  },
  role: {
    type: String,
    enum: {
      values: ['User', 'Admin'],
      message: 'Role must be either "User" or "Admin"'
    },
    default: 'User',
    required: true
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: { type: Date, default: Date.now },  // Auto-generated by timestamps: true
  updatedAt: { type: Date, default: Date.now }   // Auto-generated by timestamps: true
}
```

**Indexes:**
- `{ email: 1 }` — Unique constraint for case-insensitive email lookup
- `{ email: 1, isActive: 1 }` — Composite index for login query optimization
- `{ lastLoginAt: -1 }` — Descending index for activity tracking

**Exported Methods (Mongoose):**
- `User.create(data)` — Create new user
- `User.findById(id)` — Retrieve user by ObjectId
- `User.findOne({ email })` — Retrieve user by email (case-insensitive)
- `User.updateOne({ _id }, { ... })` — Update user document
- `User.deleteMany({ ... })` — Soft-delete by setting isActive: false
- `User.ensureIndexes()` — Create indexes on startup

**Testing:** 49/49 integration tests passing | 100% model coverage
- Email validation (valid formats, invalid formats, null, numeric)
- Email uniqueness enforcement (case-insensitive)
- Role enum validation (User, Admin, invalid values)
- Timestamps auto-generation (createdAt immutable, updatedAt updates)
- isActive field (default true, soft-delete support)
- Index creation verification

#### `src/config/database.js` ✅ IMPLEMENTED
**Responsibility:** MongoDB connection management with pool configuration

**Configuration:**
- **Connection Pool:** min 5, max 20 connections
- **Timeouts:** 5000ms for socket, server selection, and connect
- **URI Source:** `MONGO_URI` environment variable
- **Default URI:** `mongodb://localhost:27017/fitgainer-auth` (dev)
- **Error Logging:** Structured error logs without credential exposure

**Exported Functions:**
- `connectDatabase()` — Establish MongoDB connection (called in server.js startup)
- `disconnectDatabase()` — Graceful connection teardown (called on SIGTERM)

**Usage:**
```javascript
const { connectDatabase, disconnectDatabase } = require('./src/config/database');

// In server.js startup
await connectDatabase();
logger.info('MongoDB connected');

// In graceful shutdown
process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});
```

**Environment Variables:**
- `MONGO_URI` — MongoDB connection string (default: `mongodb://localhost:27017/fitgainer-auth`)

**Testing:** Integration tests use MongoMemoryServer (no external DB required)

#### `src/models/token-blacklist.model.js`
**Responsibility:** Logout token tracking (optional)

**Expected Schema:**
```javascript
{
  token: { type: String, required: true, index: true },
  userId: { type: ObjectId, required: true },
  expiresAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
}
```

**Expected Methods:**
- `TokenBlacklist.create(token, userId, expiresAt)`
- `TokenBlacklist.findOne({ token })`
- `TokenBlacklist.deleteMany({ expiresAt: { $lt: now } })` (TTL cleanup)

**Testing:** Integration tests (TASK-003+)

#### `src/services/authService.js` ✅ IMPLEMENTED (TASK-003, TASK-004, TASK-005)
**Responsibility:** Authentication business logic (registration, login, token refresh)

**Implemented Methods:**

1. **`registerUser(email, password): Promise<object>`** (TASK-003) ✅
   - Hash password with bcrypt
   - Create User document
   - Return: { userId: string, email: string, role: 'User' }
   - Throws if email already exists (Mongoose E11000 error caught by errorHandler)

2. **`loginUser(email, password, ipAddress, userAgent): Promise<object>`** (TASK-004) ✅
   - Find user by email (case-insensitive)
   - Timing-safe password verification (uses DUMMY_HASH if user not found)
   - Check user.isActive flag
   - Generate access & refresh tokens
   - Update lastLoginAt timestamp
   - Log audit event (userId, email, IP, User-Agent)
   - Return: `{ success: boolean, status: number, message?: string, data?: object }`
   
   **Success Response:**
   ```javascript
   {
     success: true,
     status: 200,
     data: {
       userId: string,
       email: string,
       role: string,
       accessToken: JWT,
       refreshToken: JWT,
       expiresIn: 900
     }
   }
   ```
   
3. **`refreshToken(refreshToken): Promise<object>`** (TASK-005) ✅
   - Verify refresh token JWT signature and expiration
   - Look up user by userId from token payload in database (mandatory)
   - Check user.isActive flag (prevent login with disabled account)
   - Read current user.role from database record (ensures fresh role)
   - Generate new access token and refresh token
   - Return: { userId: string, email: string, role: string, accessToken: JWT, refreshToken: JWT, expiresIn: 900 }
   - Throws error for invalid/expired/missing user/disabled account

   **Error Responses:**
   ```javascript
   // Invalid credentials (generic message prevents user enumeration)
   {
     success: false,
     status: 401,
     message: 'Invalid email or password'
   }
   
   // Account disabled
   {
     success: false,
     status: 401,
     message: 'Account is disabled'
   }
   
   // Invalid refresh token (TASK-005)
   {
     success: false,
     status: 401,
     message: 'Invalid refresh token'
   }
   ```

**Constants:**
- `DUMMY_HASH` — Bcrypt hash for timing-safe comparison when user not found

**Dependencies:**
- `User` model — User documents
- `hashPassword()`, `comparePassword()` — Bcrypt utilities
- `generateAccessToken()`, `generateRefreshToken()` — JWT utilities
- `logger` — Winston logger for audit events

**Environment Variables:** None (inherits from jwt.js and bcrypt.js)

**Testing:** 100% coverage (35+ integration tests)
- Register: happy path, duplicate email, missing fields
- Login: valid credentials, invalid password, user not found, inactive account
- Token generation and structure
- Audit logging
- lastLoginAt persistence

#### `src/utils/jwt.js` ✅ IMPLEMENTED (TASK-004)
**Responsibility:** JWT token generation and verification

**Exported Functions:**

1. **`generateAccessToken(user): string`**
   - Creates access token with 15-minute TTL
   - Claims: { userId: user._id, email: user.email, role: user.role }
   - Algorithm: HS256
   - TTL: `process.env.JWT_EXPIRES_IN` (default: '15m')
   - Throws if JWT_SECRET not set
   - Usage: `const token = generateAccessToken(user)`

2. **`generateRefreshToken(user): string`**
   - Creates refresh token with 7-day TTL
   - Claims: { userId: user._id, email: user.email, type: 'refresh' }
   - Algorithm: HS256
   - TTL: `process.env.JWT_REFRESH_EXPIRES_IN` (default: '7d')
   - Throws if JWT_SECRET not set
   - Usage: `const token = generateRefreshToken(user)`

3. **`verifyToken(token): object`**
   - Verifies and decodes access token
   - Returns decoded payload: { userId, email, role, iat, exp }
   - Throws if token invalid, expired, or is a refresh token
   - Rejects tokens where `type === 'refresh'`
   - Throws if JWT_SECRET not set
   - Usage: `const payload = verifyToken(accessToken)`

4. **`verifyRefreshToken(token): object`**
   - Verifies and decodes refresh token
   - Returns decoded payload: { userId, email, type, iat, exp }
   - Throws if token invalid, expired, or is an access token
   - Requires `type === 'refresh'`
   - Throws if JWT_SECRET not set
   - Usage: `const payload = verifyRefreshToken(refreshToken)`

**Dependencies:**
- `jsonwebtoken` — JWT signing/verification
- `process.env.JWT_SECRET` — Signing key (required, ≥32 chars in production)

**Environment Variables:**
- `JWT_SECRET` — Required, must be ≥32 characters
- `JWT_EXPIRES_IN` — Access token TTL (default: '15m', e.g., '900s', '15m', '24h')
- `JWT_REFRESH_EXPIRES_IN` — Refresh token TTL (default: '7d')

**Security Properties:**
- Algorithm: HS256 (HMAC SHA-256)
- Tokens are signed, not encrypted
- Token type discrimination: access vs refresh tokens are distinct
- Expiration enforced: expired tokens are rejected by jsonwebtoken

**Testing:** 100% coverage (10+ unit tests)
- Token generation creates valid JWT
- Token claims structure and values
- Expiration times correct
- Type field validates token purpose
- Rejects wrong token type (access vs refresh)
- JWT_SECRET validation

#### `src/services/user.service.js`
**Responsibility:** User management

**Expected Methods:**
- `getUserById(userId)` → User object
- `getUserByEmail(email)` → User object
- `createUser(email, passwordHash, role)` → User object
- `updateLastLogin(userId)` → User object
- `deactivateUser(userId)` → User object
- `hashPassword(password)` → bcrypt hash

**Dependencies:**
- User model
- `bcrypt`
- Logger

**Environment Variables:**
- `BCRYPT_ROUNDS`

**Testing:** Integration tests with real models

#### `src/middleware/authenticate.js` ✅ IMPLEMENTED (TASK-006)
**Responsibility:** JWT token validation and extraction from Authorization header

**Exported Functions:**
- `authenticate(req, res, next)` — Extract & validate JWT from Authorization header
  - Requires: Authorization header with format "Bearer <token>"
  - Validates: JWT signature (HS256 only), expiration, token type (access only)
  - Sets: `req.user = { userId, email, role }`
  - Returns: 401 for missing/invalid/expired tokens
  - Returns: 401 "Invalid token signature" for signature failures

**Usage:**
```javascript
const { authenticate } = require('../middleware/authenticate');
router.get('/api/auth/me', authenticate, authController.getMe);
```

**Testing:** 27 unit tests + integration tests with Supertest (100% coverage)

#### `src/middleware/authorize.js` ✅ IMPLEMENTED (TASK-006)
**Responsibility:** Role-based access control middleware factory

**Exported Functions:**
- `requireRole(allowedRoles)` — Returns middleware that enforces role-based access
  - Requires: authenticate middleware to run first (sets req.user)
  - Validates: user.role is in allowedRoles array
  - Returns: 403 Forbidden if role not authorized
  - Returns: 401 Unauthorized if req.user not set

**Usage:**
```javascript
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

// Admin-only endpoint
router.post('/api/admin/users', authenticate, requireRole(['Admin']), adminController.create);

// Multiple allowed roles
router.get('/api/data', authenticate, requireRole(['User', 'Admin']), dataController.getData);
```

**Testing:** 19 unit tests + integration tests with Supertest (100% coverage)

#### `src/middleware/error.middleware.js`
**Responsibility:** Global error handling and response formatting

**Expected Functions:**
- `errorHandler(err, req, res, next)` — Catch all errors

**Response Format:**
```javascript
{
  error: {
    message: string,
    code: string,
    statusCode: number,
    timestamp: ISO-8601
  }
}
```

**Testing:** Integration tests

#### `src/controllers/auth.controller.js` ✅ IMPLEMENTED (TASK-003, TASK-004, TASK-005, TASK-007, TASK-008)
**Responsibility:** HTTP request/response handling for auth endpoints

**Implemented Methods:**

1. **`register(req, res, next): Promise<void>`** (TASK-003) ✅
   - Extract: email, password, confirmPassword from req.body
   - Validate: email format, password strength, password match
   - Call: authService.registerUser()
   - Response 201: { success: true, message, data: { userId, email, role } }
   - Errors delegated to errorHandler middleware (400, 409, 500)

2. **`login(req, res, next): Promise<void>`** (TASK-004) ✅
   - Extract: email, password from req.body
   - Validate input:
     ├─ Both fields present & non-empty
     ├─ Both are strings (type guard)
     ├─ Email has valid format
     └─ Password ≤ 128 characters
   - Extract metadata: ipAddress (from req.ip or req.socket.remoteAddress), userAgent (from header)
   - Call: authService.loginUser(email, password, ipAddress, userAgent)
   - If success: Response 200 { success: true, message, data: { userId, email, role, tokens, expiresIn } }
   - If error: Response 400/401 { success: false, message }
   - Server errors delegated to errorHandler middleware (500)

**Constants:**
- `MAX_PASSWORD_LENGTH = 128` — DoS prevention

3. **`refresh(req, res, next): Promise<void>`** (TASK-005) ✅
   - Extract: refreshToken from req.body
   - Validate: refreshToken is provided and non-empty
   - Call: authService.refreshToken(refreshToken)
   - If success: Response 200 { success: true, message, data: { accessToken, refreshToken, expiresIn } }
   - If error: Response 400/401/403 { success: false, message }
   - Server errors delegated to errorHandler middleware (500)

4. **`logout(req, res, next): Promise<void>`** (TASK-007) ✅
   - Authenticate: Validates Bearer token via authenticate middleware
   - Extract metadata: ipAddress (from req.ip), userAgent (from header)
   - Log audit event: Winston logs userId, email, timestamp, ip, userAgent
   - Response 200: { success: true, message: "Logout successful" }
   - MVP version: No token blacklist (tokens valid until expiry)
   - Idempotent: Multiple logout calls return 200

5. **`getMe(req, res, next): Promise<void>`** (TASK-008) ✅
   - Authenticate: Validates Bearer token via authenticate middleware (sets req.user)
   - Extract: user data from req.user (userId, email, role)
   - Response 200: { success: true, data: { userId, email, role } }
   - Stateless design: No database lookup required
   - No sensitive data exposed: password, passwordHash, timestamps, flags excluded

**Error Handling:**
- Input validation errors → 400
- Authentication failures → 401
- Invalid token signature → 403
- Server errors caught by errorHandler → 500

**Testing:** 100% coverage (31 register + 35 login + 13 refresh + 39 logout + 35 getMe tests = 153+ controller tests)
- Valid requests → success response
- Missing/empty fields → 400
- Type mismatches → 400
- Invalid email format → 400
- Password length exceeded → 400
- Invalid credentials → 401
- Inactive account → 401
- Metadata extraction (IP, User-Agent)
- Token refresh with valid/invalid/expired/missing user → 200/401
- User DB lookup verification (TASK-005)
- Account status check (TASK-005)
- GetMe with valid/invalid/expired/missing token → 200/401 (TASK-008)
- Response contract validation (userId, email, role present) (TASK-008)
- No sensitive data leak (TASK-008)

#### `src/routes/auth.routes.js` ✅ IMPLEMENTED (TASK-003, 004, 005, 007, 008)
**Responsibility:** Route definition for auth endpoints

**Implemented Routes:**
```javascript
router.post('/register', authController.register);           # TASK-003
router.post('/login', authController.login);                 # TASK-004
router.post('/refresh', authController.refresh);             # TASK-005
router.post('/logout', authenticate, authController.logout); # TASK-007
router.get('/me', authenticate, authController.getMe);       # TASK-008
```

**Middleware:**
- `authenticate` — JWT token validation, sets req.user (applied to logout & getMe)

**Testing:** 100% coverage via app integration tests

#### `src/events/auth.events.js`
**Responsibility:** RabbitMQ event publishing

**Expected Functions:**
- `publishUserRegistered(userId, email)` → RabbitMQ event
- `publishUserLoggedIn(userId, email)` → RabbitMQ event
- `publishTokenRefreshed(userId)` → RabbitMQ event
- `publishUserLoggedOut(userId)` → RabbitMQ event

**Environment Variables:**
- `RABBITMQ_URL`
- `RABBITMQ_EXCHANGE`

**Testing:** Integration tests with rabbitmq-mock

#### `src/config/index.js`
**Responsibility:** Centralized configuration management

**Expected Exports:**
```javascript
module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  bcryptRounds: process.env.BCRYPT_ROUNDS,
  logLevel: process.env.LOG_LEVEL,
  rabbitmqUrl: process.env.RABBITMQ_URL,
  rabbitmqExchange: process.env.RABBITMQ_EXCHANGE
};
```

**Testing:** Unit test to ensure all env vars loaded

---

## 📊 Data Flow

### Registration Sequence
```
1. Client sends: POST /api/auth/register
   └─ Body: { email, password, confirmPassword }

2. Express router → authController.register()

3. Validation:
   └─ validateRegistrationInput(email, pwd, confirmPwd)
   └─ Returns: { valid, errors }

4. If invalid:
   └─ Response 400 { errors }

5. If valid:
   └─ userService.hashPassword(password)
   └─ userService.createUser(email, hash, 'User')
   └─ Stores in MongoDB

6. Token generation:
   └─ tokenService.generateAccessToken(userId, role)
   └─ tokenService.generateRefreshToken(userId)

7. Event publishing:
   └─ authEvents.publishUserRegistered(userId, email)

8. Response 201 {
     user: { id, email, role },
     accessToken,
     refreshToken
   }
```

### Login Sequence (TASK-004 Complete ✅)
```
1. Client sends: POST /api/auth/login
   └─ Body: { email, password }

2. Express router → authController.login()

3. Validation (type guards & format):
   ├─ Both fields present & non-empty
   ├─ Both are strings
   ├─ Email is valid format (RFC5322 regex)
   └─ Password length ≤ 128 characters

4. User lookup with timing-safety:
   ├─ userService.findOne({ email: email.toLowerCase() })
   ├─ If not found: use DUMMY_HASH for comparison
   └─ Purpose: Prevent timing attacks revealing user existence

5. Password comparison (constant-time via bcrypt):
   └─ bcrypt.compare(password, hashToCheck) — same duration regardless of match

6. Validation chain (if failures, return early):
   ├─ User exists check
   ├─ User.isActive === true check
   └─ Password match check

7. If all checks pass:
   ├─ generateAccessToken(user) — HS256, 15m TTL, claims: userId, email, role
   ├─ generateRefreshToken(user) — HS256, 7d TTL, claims: userId, email, type='refresh'
   ├─ user.lastLoginAt = new Date()
   ├─ user.save() — persist login timestamp
   └─ logger.info() — audit log with userId, email, timestamp, IP address, User-Agent

8. Response 200 {
     success: true,
     message: 'Login successful',
     data: {
       userId: string,
       email: string,
       role: string,
       accessToken: JWT string,
       refreshToken: JWT string,
       expiresIn: 900  # seconds (15 minutes)
     }
   }

9. Error Responses:
   ├─ 400: Validation errors (missing fields, type mismatch, length exceeded)
   ├─ 401: Invalid credentials or inactive account (generic message)
   └─ 500: Server error (database, JWT_SECRET not set, etc.)
```

### Protected Endpoint Access
```
1. Client sends: GET /api/auth/me
   └─ Header: Authorization: Bearer <accessToken>

2. Express router → middleware.authenticateToken

3. Token extraction:
   └─ Parse Authorization header
   └─ Extract token string

4. Token validation:
   └─ tokenService.verifyAccessToken(token)
   └─ Returns: { userId, email, role, ... }

5. If invalid:
   └─ Response 401 { error: 'Unauthorized' }

6. If valid:
   └─ req.user = payload
   └─ Call next() → authController.getMe()

7. Response 200 {
     user: { id, email, role }
   }
```

---

## 🧪 Testing Map

### Unit Tests (Pure Logic, No I/O)

**Location:** `tests/unit/`

| File | Module | Tests | Coverage | Task |
|------|--------|-------|----------|------|
| ✅ `validators.test.js` | `src/utils/validators.js` | 18 | 100% | TASK-001 |
| ✅ `bcrypt.test.js` | `src/utils/bcrypt.js` | 18 | 100% | TASK-003 |
| ✅ `jwt.test.js` | `src/utils/jwt.js` | 26+ | 100% | TASK-004, TASK-005 |
| ✅ `middleware.test.js` | authenticate.js & authorize.js | 46 | 100% | TASK-006 |

**Commands:**
```bash
npm run test:unit
```

### Integration Tests (With DB, No HTTP)

**Location:** `tests/integration/`

| File | Module | Tests | Coverage | Task |
|------|--------|-------|----------|------|
| ✅ `models.test.js` | User.js + database.js | 49 | 100% | TASK-002 |
| ✅ `app.test.js` | Express app + routes | 10 | 100% | TASK-003 |
| ✅ `auth.register.test.js` | Registration E2E flow | 16 | 100% | TASK-003 |
| ✅ `auth.login.test.js` | Login E2E flow + tokens | 35+ | 100% | TASK-004 |
| ✅ `auth.refresh.test.js` | Refresh E2E flow + user validation | 20 | 100% | TASK-005 |
| ✅ `auth.logout.test.js` | Logout E2E flow + audit logging | 39 | 100% | TASK-007 |
| ✅ `auth.getme.test.js` | GetMe E2E flow + stateless verification | 35 | 100% | TASK-008 |
| ✅ `auth.middleware.test.js` | Middleware integration flows | 20 | 100% | TASK-006 |

**Database:** MongoMemoryServer (no external MongoDB required)

**Test Summary:**
- **models.test.js:** Schema creation, email validation, role enum, timestamps, isActive, passwordHash, indexes (49 tests)
- **app.test.js:** Health check, 404 handling, error middleware (10 tests)
- **auth.register.test.js:** Valid registration, duplicate email, weak password, validation errors (16 tests)
- **auth.login.test.js:** Valid login, invalid credentials, missing fields, inactive account, token generation, IP/User-Agent capture (35+ tests)
- **auth.refresh.test.js:** Valid refresh, invalid/expired/missing token, user not found, disabled account, fresh role from DB (20 tests)
- **auth.logout.test.js:** Valid logout, invalid/missing/expired tokens, audit logging, idempotency (39 tests)
- **auth.getme.test.js:** Valid getMe, invalid/missing/expired tokens, response contract, no sensitive data (35 tests)
- **auth.middleware.test.js:** authenticate with valid/invalid tokens, requireRole with authorized/unauthorized roles, middleware chaining (20 tests)
- **auth.e2e.test.js:** Full lifecycle flow, registration→login→refresh→logout chain, token validation, unauthenticated rejection, infrastructure tests (15 tests)

**Commands:**
```bash
npm run test:integration
npm run test:watch
npm test  # All tests (300 total): unit + integration with coverage
```

### E2E Tests (Full HTTP)

**Location:** `tests/e2e/` (repository root, not in this service)

| File | Endpoint | Purpose | Task |
|------|----------|---------|------|
| *(future)* | POST /api/auth/register | Registration flow | TASK-003 |
| *(future)* | POST /api/auth/login | Login flow | TASK-004 |
| *(future)* | POST /api/auth/refresh | Token refresh | TASK-005 |
| *(future)* | POST /api/auth/logout | Logout flow | TASK-007 |
| *(future)* | GET /api/auth/me | User info retrieval | TASK-008 |

**HTTP Framework:** Supertest
**Container:** Running Docker container

**Commands:**
```bash
docker-compose up -d
npm run test:e2e
```

---

## 🚀 Quick Developer Start

### 1. Install Dependencies
```bash
cd BE/auth-service
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with local MongoDB URI (MONGO_URI)
# Example: mongodb://localhost:27017/fitgainer-auth
```

### 3. Start Development Server
```bash
npm run dev
# Server runs on http://localhost:3001
# Watches for file changes (--watch mode)
```

### 4. Run Tests
```bash
# All tests with coverage
npm test

# Watch mode during development
npm run test:watch

# Unit tests only
npm run test:unit
```

### 5. Health Check
```bash
curl http://localhost:3001/health
# Response: { "status": "ok", "timestamp": "...", "version": "..." }
```

### 6. Docker Build
```bash
docker build -t fitgainer-auth:latest .
docker run -p 3001:3001 \
  -e MONGO_URI=mongodb://host.docker.internal:27017/fitgainer-auth \
  -e JWT_SECRET=dev-secret-min-32-chars-long \
  fitgainer-auth:latest
```

---

## 👨‍💼 Admin Module (TASK-031-BE-Auth-Admin) ✅ Complete

**Responsibility:** Admin user management endpoints for listing and deactivating users

### API Endpoints

- **GET /api/admin/users** — List all users (active only by default) with pagination and filtering
- **PATCH /api/admin/users/:userId** — Deactivate user (soft delete, idempotent)

### Model Changes (`src/models/User.js`)

**New Fields:**
- `isDeleted` (Boolean, default: false) — Soft delete flag
- `deletedAt` (Date, default: null) — Timestamp when user was deactivated
- Index on `isDeleted` field for query optimization

**Pre-save Hook:**
- Automatically sets `deletedAt = new Date()` when `isDeleted` is set to true

### Service Layer (`src/services/adminService.js`)

**Functions:**

1. **`getUserList(page = 1, emailFilter = null, statusFilter = 'active')`**
   - Pagination: Fixed limit of 10 users per page, 1-indexed
   - Email filter: Case-insensitive partial match with ReDoS protection (escaped regex)
   - Status filter: 'active' (default, isDeleted=false) or 'all' (include deleted)
   - Returns: { users: [...], pagination: { page, limit, total, pages } }
   - Excludes: passwordHash field
   - Sorting: createdAt descending (newest first)

2. **`deactivateUser(userId, adminUserId)`**
   - Soft delete: Sets isDeleted=true, deletedAt=now
   - Idempotent: Returns 200 if already deleted
   - Guard: Cannot deactivate own account (400 error)
   - Validation: CastError caught and converted to 400
   - Returns: User object as plain object

### Controller (`src/controllers/adminController.js`)

**Handlers:**

1. **`getUserList(req, res, next)`**
   - Query parameters: page (default 1), email (optional filter), status (default 'active')
   - Response: 200 { data: users[], pagination: {...} }
   - Error handling: Passes to error handler middleware

2. **`deactivateUser(req, res, next)`**
   - Parameters: userId in URL
   - Body: { action: 'deactivate' } (required, validated by middleware)
   - Validation: ObjectId format check
   - Response: 200 { message, user: { _id, email, isDeleted } }
   - Errors: 400 (invalid ID, own account, validation), 404 (user not found)

### Middleware

**`adminValidation.js`:**
- `validateUserDeactivate` — Validates request body has action='deactivate' (required, specific value)

### Routes (`src/routes/admin.routes.js`)

```javascript
router.get('/users', authenticate, requireRole(['Admin']), adminController.getUserList);
router.patch('/users/:userId', authenticate, requireRole(['Admin']), validateUserDeactivate, adminController.deactivateUser);
```

Mount point: `/admin` (full path: `/api/admin`)

### Test Coverage

**Integration Tests (`tests/integration/admin-users.test.js`):** 30 tests covering:
- Happy path: list users, pagination, filtering, deactivation
- Pagination: page validation, limit enforcement, total/pages calculation
- Filtering: email filter (case-insensitive), status filter (active/all)
- Deactivation: soft delete, idempotency, cannot deactivate self
- Authentication: 401 for missing/invalid token
- Authorization: 403 for non-admin role
- Error handling: Invalid ObjectId, malformed action, missing fields
- Response format: Correct fields, no sensitive data leak (no passwordHash)

**Total Tests:** 478 (448 auth core + 30 admin) with 98.45% coverage

---

## 🔗 Related Documents

- **Architecture:** `docs/architecture/auth-service.md`
- **Feature Spec:** `spec/features/auth/feature.spec.md`
- **API Spec:** `spec/features/auth/api.spec.md`
- **Schema Spec:** `spec/features/auth/schema.spec.md`
- **Rules Spec:** `spec/features/auth/rules.spec.md`
- **Setup Guide:** `docs/SETUP.md`
- **Story Mapping:** `spec/mapping/story-to-spec.md`

---

## 📝 Document Metadata

- **Version:** 2.6
- **Last Updated:** 2026-05-19
- **Status:** Phase 1a-1j ✅ Core Auth Complete + Phase 4b ✅ Admin User Management Complete (TASK-031-BE-Auth-Admin)
- **Test Coverage:** 478 tests passing (135 unit auth + 313 integration auth + 30 integration admin), 98.45% coverage
- **Complete:** Phase 1j Integration Testing & Docker Build (TASK-010) + Phase 4b Admin User Management with getUserList + deactivateUser soft delete endpoints (TASK-031-BE-Auth-Admin)
