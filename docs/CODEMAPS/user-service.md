# User Service Codemap v1.2

**Service:** `BE/user-service` | **Port:** 3002 | **Last Updated:** 2026-05-17 | **Status:** Phase 2a-2c ✅ (Scaffold + Model + CRUD API Complete)

---

## 📌 Overview

Codemap for the FitGainer User Profile Service. This document provides a structural overview of the codebase, module dependencies, and data flows for quick developer onboarding.

The user-service manages body profile data (height, weight, age, sex), calculates BMI, and provides body classification for personalized workout planning.

---

## 🗂️ Directory Structure

```
BE/user-service/
├── src/
│   ├── server.js                  # Entry point: HTTP server setup + database connection
│   ├── app.js                     # Express app: middleware setup, routing (TASK-015, updated TASK-017)
│   ├── utils/
│   │   ├── logger.js              # Winston logging factory (TASK-015)
│   │   └── bmi.js                 # BMI calculation & classification (TASK-016) ✅
│   ├── models/                    # Mongoose schemas
│   │   └── UserProfile.js         # UserProfile schema with pre-save hook (TASK-016) ✅
│   ├── config/
│   │   └── database.js            # MongoDB connection with pool config (TASK-015)
│   ├── controllers/               # Route handlers
│   │   └── profile.controller.js  # Profile CRUD handlers (TASK-017) ✅
│   ├── routes/                    # API routes
│   │   └── profile.routes.js      # Profile routes (TASK-017) ✅
│   ├── middleware/                # Custom middleware
│   │   ├── authenticate.js        # JWT verification middleware (TASK-017) ✅
│   │   └── validateProfile.js     # Request body validation (TASK-017) ✅
│   ├── services/                  # Business logic
│   │   └── profile.service.js     # Profile operations & error classes (TASK-017) ✅
│   └── events/                    # Event publishers [Future]
│       └── [Pending: profile]     # RabbitMQ event publishing (TASK-019+)
├── tests/
│   ├── unit/
│   │   ├── bmi.test.js            # BMI calculator tests (TASK-016) ✅ 14 tests
│   │   ├── UserProfile.test.js    # UserProfile model tests (TASK-016) ✅ 47 tests
│   │   ├── logger.test.js         # Logger tests (TASK-015) ✅ 6 tests
│   │   ├── database.test.js       # Database connection tests (TASK-015) ✅ 2 tests
│   │   └── profile.service.test.js # ProfileService unit tests (TASK-017) ✅ 16 tests
│   └── integration/               
│       ├── app.test.js            # Express app integration tests (TASK-015) ✅ 6 tests
│       └── profile.api.test.js    # Profile API integration tests (TASK-017) ✅ 52 tests
├── logs/                          # [Runtime logs — .gitignored]
│   ├── app.log
│   └── error.log
├── Dockerfile                     # Production container (TASK-015)
├── jest.config.js                 # Test configuration (80% coverage)
├── package.json                   # Dependencies & scripts
├── .env.example                   # Environment template
├── .gitignore                     # Excludes .env, logs, node_modules
└── README.md                      # Service documentation

```

---

## 🔌 Module Dependencies

### Implemented Modules (TASK-015 ✅ + TASK-016 ✅)

#### `src/server.js`
**Responsibility:** HTTP server lifecycle management
- Entry point for the service
- Creates Express app via `require('./app')`
- Initializes MongoDB connection via `connectDatabase()`
- Starts HTTP server on `PORT` (3002)
- Handles graceful shutdown (SIGTERM/SIGINT)
- Logs startup/shutdown/errors via logger
- Monitors unhandled rejections and exceptions

**Dependencies:**
- `./app.js` — Express app
- `./config/database.js` — Database connection functions
- `./utils/logger.js` — Winston logger
- `dotenv` — Environment variables

**Exports:** None (side effects only, called directly via `node src/server.js`)

**Testing:** Integration tests (planned for TASK-016)

#### `src/app.js`
**Responsibility:** Express application configuration
- Middleware setup:
  - CORS configuration (allows specified origins)
  - Body parser (JSON, URL-encoded)
  - Request logging via Winston
  - Error handling middleware (placeholder)
- Route registration (placeholder for TASK-016)
- Health check endpoint (planned)
- Global error handler

**Dependencies:**
- `express` — HTTP framework
- `cors` — Cross-origin resource sharing
- `./utils/logger.js` — Winston logger

**Exports:**
- `module.exports = app` — Express app instance

**Testing:** Integration tests (planned for TASK-016)

#### `src/config/database.js`
**Responsibility:** MongoDB connection management
- Connection string from `MONGO_URI` environment variable
- Connection pool configuration:
  - Min connections: 5
  - Max connections: 20
  - Socket timeout: 5000ms
  - Server selection timeout: 5000ms
  - Connect timeout: 5000ms
- Graceful connection cleanup on shutdown
- Error handling with structured logging

**Dependencies:**
- `mongoose` — MongoDB ODM
- `./utils/logger.js` — Winston logger

**Exports:**
- `connectDatabase()` — Async function to establish connection
- `disconnectDatabase()` — Async function to close connection

**Testing:** Integration tests using MongoMemoryServer (planned for TASK-016)

#### `src/utils/logger.js`
**Responsibility:** Centralized Winston logging factory
- JSON formatted logs in production
- Colorized console output in development
- Separate output files:
  - `logs/app.log` — All logs
  - `logs/error.log` — Error logs only
- Configurable log level via `LOG_LEVEL` environment variable
- Structured logging with metadata

**Dependencies:**
- `winston` — Logging library
- `fs` — File system (for log directory)

**Exports:**
- `module.exports = logger` — Winston logger instance

**Usage:**
```javascript
const logger = require('./utils/logger');
logger.info('User profile created', { userId, email });
logger.error('BMI calculation failed', { error: e.message });
```

**Testing:** 100% coverage (unit tests ✅ TASK-016 complete)

#### `src/utils/bmi.js` (TASK-016 ✅)

**Responsibility:** Pure functions for BMI calculation and body classification

**Exports:**
- `calculateBmi(height_cm, weight_kg)` → Number (rounded to 2 decimal places)
  - Formula: `weight_kg / (height_cm / 100)²`
  - Guards: throws if height <= 0 or weight < 0
  - Example: `calculateBmi(165, 48)` → `17.63`

- `classifyBmi(bmi)` → String ('underweight' | 'normal' | 'overweight' | 'obese')
  - < 18.5 → 'underweight'
  - 18.5–24.9 → 'normal'
  - 25–29.9 → 'overweight'
  - ≥ 30 → 'obese'

**Testing:** 14 test cases, 100% coverage (unit tests ✅ TASK-016)

#### `src/models/UserProfile.js` (TASK-016 ✅)

**Responsibility:** Mongoose schema for UserProfile documents

**Collection:** `userprofiles`

**Fields:**
- `userId` — String, required, unique (indexed)
- `height` — Number, required, [100–250] cm
- `weight` — Number, required, [20–300] kg
- `age` — Number, required, integer, [10–100]
- `gender` — String, required, enum: ['male', 'female']
- `bmi` — Number, computed (not required, read-only)
- `bodyClassification` — String, enum: ['underweight', 'normal', 'overweight', 'obese']
- `createdAt`, `updatedAt` — Timestamps (auto)

**Hooks:**
- `pre('save')` hook:
  - Recalculates `bmi` and `bodyClassification` using `calculateBmi()` and `classifyBmi()`
  - Runs on every `.save()` call (idempotent)
  - Client-supplied `bmi`/`bodyClassification` are overwritten (BR-02)

- `pre('findOneAndUpdate')` hook:
  - Guards against height/weight updates via `.findOneAndUpdate()`
  - Throws error with message: "Use .save() when updating height or weight to ensure BMI recomputation (BR-02)"
  - Allows updates to other fields (e.g., age, gender)

**Dependencies:**
- `./utils/bmi.js` — calculateBmi, classifyBmi functions
- `mongoose` — ODM

**Testing:** 47 test cases covering validation, hooks, unique constraint, all 4 BMI classifications, 100% coverage (unit tests ✅ TASK-016)

---

## 📊 Data Flow (Implemented - TASK-017 ✅)

```
User Request (Frontend/Client)
    ↓
Express Middleware (CORS, bodyParser, logging) [TASK-015]
    ↓
Route matching (GET /profile, POST /profile, PUT /profile, GET /profile/bmi) [TASK-017]
    ↓
Authenticate Middleware (JWT HS256 verification, extract userId & role) [TASK-017]
    ↓
Validation Middleware (validateCreateProfile or validateUpdateProfile) [TASK-017]
    ↓
Route Handler (ProfileController.getProfile / createProfile / updateProfile / getBmi) [TASK-017]
    ↓
Service Layer (ProfileService: getProfile, createProfile, updateProfile, calcBmi) [TASK-017]
    ↓
Mongoose Model (UserProfile schema validation, pre-save BMI hook) [TASK-016]
    ↓
MongoDB Database (fitgainer-user collection)
    ↓
Response (200/201/404/409/400 with profile data or error)
    ↓
Event Publishing [Future] (RabbitMQ: profile.created/updated) [TASK-019+]
```

---

## 🔒 Authentication & Authorization (TASK-017 ✅)

**Implementation Complete:**

All routes in `routes/profile.routes.js` require authentication via `authenticate` middleware:

```javascript
// middleware/authenticate.js (TASK-017)
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  // 1. Extract token from "Bearer <token>"
  // 2. Verify with JWT_SECRET using HS256 algorithm
  // 3. Extract userId (sub or userId claim) and role
  // 4. Set req.user = { userId, role }
  // 5. Return 401 if invalid/expired
}
```

**Usage in Routes:**

```javascript
// routes/profile.routes.js
router.get('/bmi', authenticate, controller.getBmi);
router.get('/', authenticate, controller.getProfile);
router.post('/', authenticate, validateCreateProfile, controller.createProfile);
router.put('/', authenticate, validateUpdateProfile, controller.updateProfile);
```

**Token Validation:**
- JWT token extracted from `Authorization: Bearer <token>` header
- Token verified using HS256 algorithm with `JWT_SECRET`
- User ID extracted from token claims (`sub` or `userId`)
- User role extracted from token claims
- Returns 401 if header missing, token invalid, or expired

---

## 🗄️ Database Schema (TASK-016 ✅ Complete)

### UserProfile Collection

**Fields (implemented):**
- `userId` — String | Required, unique (indexed)
- `height` — Number (cm) | Required, [100–250]
- `weight` — Number (kg) | Required, [20–300]
- `age` — Number | Required, integer, [10–100]
- `gender` — String | Required, enum: ['male', 'female']
- `bmi` — Number | Computed from height & weight (read-only, set by pre-save hook)
- `bodyClassification` — String | Computed: 'underweight' | 'normal' | 'overweight' | 'obese'
- `createdAt` — Date | Auto-generated
- `updatedAt` — Date | Auto-updated

**Indexes (implemented):**
1. `{ userId: 1 }` — Unique constraint + fast lookups

**Validation (implemented):**
- Height: 100–250 cm with Mongoose min/max validators
- Weight: 20–300 kg with Mongoose min/max validators
- Age: 10–100, integer only, with custom validator
- Gender: strict enum validation ['male', 'female']
- All required fields enforce presence validation with custom messages

**Business Rules (implemented):**
- BR-01 (Unique Profile): userId is unique index — prevents duplicate profiles
- BR-02 (Computed Server-Side): BMI and classification are always computed on save; findOneAndUpdate with height/weight is guarded and throws error
- Pre-save hook ensures idempotent BMI recalculation
- Pre-findOneAndUpdate guard enforces use of .save() for height/weight updates

---

## 🔄 Module Dependencies Graph

### Current (TASK-015 ✅ + TASK-016 ✅)

```
server.js
├→ app.js (middleware, routes)
├→ config/database.js (MongoDB connection)
└→ utils/logger.js (Winston logging)

app.js
├→ utils/logger.js (request logging)
└→ middleware [placeholder for TASK-017]

config/database.js
├→ mongoose (ODM)
└→ utils/logger.js (connection logging)

models/UserProfile.js
├→ mongoose (schema definition)
├→ utils/bmi.js (BMI calculation)
└→ [pre-save hook for computation]

utils/bmi.js
└→ [Pure functions - no dependencies]
```

### Current (TASK-017 ✅)

```
server.js
├→ app.js
│  ├→ middleware: cors, bodyParser, logging
│  ├→ routes/profile.routes.js ✅
│  │  ├→ middleware/authenticate.js [JWT verification] ✅
│  │  ├→ middleware/validateProfile.js [Request validation] ✅
│  │  └→ controllers/profile.controller.js ✅
│  │     ├→ services/profile.service.js ✅
│  │     │  ├→ models/UserProfile.js [Mongoose schema] ✅
│  │     │  └→ utils/bmi.js [BMI calculation] ✅
│  │     └→ error handlers (ConflictError, NotFoundError) ✅
│  └→ Global error handlers (JSON parse, 404, unhandled errors)
├→ config/database.js [MongoDB connection]
└→ utils/logger.js [Winston logging]

models/UserProfile.js
├→ mongoose
├→ utils/bmi.js ✅
└→ pre-save & pre-findOneAndUpdate hooks ✅

services/profile.service.js
├→ models/UserProfile.js
└→ utils/bmi.js
```

---

## 📝 API Routes (TASK-017 ✅ Complete)

### Core Endpoints (Implemented)

**All endpoints mounted at `/profile` in `routes/profile.routes.js`**
**Full path via Nginx gateway: `/api/users/profile`**

```
GET /profile
  Route: GET /api/users/profile (via Nginx gateway)
  Description: Retrieve current authenticated user's body profile
  Auth: Bearer <JWT token> (required)
  Response: 200 { userId, height, weight, age, gender, bmi, bodyClassification, updatedAt }
  Errors:
    - 401: Missing/invalid Authorization header or expired token
    - 404: No profile found for authenticated user

POST /profile
  Route: POST /api/users/profile (via Nginx gateway)
  Description: Create initial user profile with body measurements
  Auth: Bearer <JWT token> (required)
  Body (required): { height, weight, age, gender }
    - height: Number [100–250] cm, required
    - weight: Number [20–300] kg, required
    - age: Integer [10–100], required
    - gender: String ['male' | 'female'], required
  Response: 201 { userId, height, weight, age, gender, bmi, bodyClassification, updatedAt }
  Errors:
    - 400: Invalid/missing fields, computed fields (bmi, bodyClassification) in body
    - 401: Missing/invalid token
    - 409: Profile already exists for this user

PUT /profile
  Route: PUT /api/users/profile (via Nginx gateway)
  Description: Update existing user profile (partial update)
  Auth: Bearer <JWT token> (required)
  Body (optional, at least one field required):
    - height: Number [100–250] cm
    - weight: Number [20–300] kg
    - age: Integer [10–100]
    - gender: String ['male' | 'female']
  Response: 200 { userId, height, weight, age, gender, bmi, bodyClassification, updatedAt }
  Errors:
    - 400: Invalid field values, computed fields in body, empty body
    - 401: Missing/invalid token
    - 404: No profile found for user

GET /profile/bmi
  Route: GET /api/users/profile/bmi (via Nginx gateway)
  Description: Calculate BMI preview for given measurements (no profile required)
  Auth: Bearer <JWT token> (required)
  Query Parameters (required):
    - height: Number [100–250] cm
    - weight: Number [20–300] kg
  Response: 200 { bmi, bodyClassification }
  Errors:
    - 400: Missing/invalid height or weight parameters
    - 401: Missing/invalid token
```

### Example Requests

```bash
# Create profile
curl -X POST http://localhost/api/users/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "height": 165, "weight": 48, "age": 22, "gender": "male" }'

# Get profile
curl -X GET http://localhost/api/users/profile \
  -H "Authorization: Bearer <token>"

# Update profile
curl -X PUT http://localhost/api/users/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "weight": 70 }'

# Calculate BMI preview
curl -X GET "http://localhost/api/users/profile/bmi?height=165&weight=48" \
  -H "Authorization: Bearer <token>"
```

---

## 🧪 Testing Strategy (TASK-015 ✅ + TASK-016 ✅ + TASK-017 ✅)

### Test Structure

```
tests/
├── unit/
│   ├── bmi.test.js                # BMI calculation logic (TASK-016) ✅ 14 tests
│   ├── UserProfile.test.js        # Mongoose schema validation (TASK-016) ✅ 47 tests
│   ├── logger.test.js             # Logger tests (TASK-015) ✅ 6 tests
│   ├── database.test.js           # Database connection tests (TASK-015) ✅ 2 tests
│   └── profile.service.test.js    # ProfileService business logic (TASK-017) ✅ 16 tests
└── integration/
    ├── app.test.js                # Express app integration tests (TASK-015) ✅ 6 tests
    └── profile.api.test.js        # Profile API endpoint tests (TASK-017) ✅ 52 tests
```

### Test Coverage (166 tests passing ✅)

**TASK-015 (Scaffold):**
- Logger: 6 tests (100% coverage)
- Database: 2 tests (100% coverage)
- App integration: 6 tests (100% coverage)

**TASK-016 (UserProfile Model & BMI):**
- **BMI Calculator:** 14 tests (100% coverage)
  - Valid calculations: 6 tests
  - Rounding: 1 test
  - Type validation: 1 test
  - Error handling: 3 tests (height <= 0, negative weight)
  
- **UserProfile Model:** 47 tests (100% coverage)
  - Valid document: 5 tests
  - Pre-save hook behavior: 5 tests
  - Required field validation: 5 tests
  - Height range [100–250]: 5 tests
  - Weight range [20–300]: 5 tests
  - Age range [10–100] + integer: 6 tests
  - Gender enum validation: 5 tests
  - Unique index on userId: 3 tests
  - Body classification (all 4 values): 3 tests
  - findOneAndUpdate hook guard (BR-02): 4 tests

**TASK-017 (CRUD API & Routes):**
- **ProfileService Unit Tests:** 16 tests (100% coverage)
  - getProfile: 2 tests
  - createProfile: 5 tests (including ConflictError)
  - updateProfile: 5 tests (including NotFoundError)
  - calcBmi: 4 tests

- **Profile API Integration Tests:** 52 tests (100% coverage)
  - authenticate middleware: 4 tests (missing header, invalid scheme, wrong secret, expired token)
  - GET /profile: 7 tests (success, not found, unauthorized, response format)
  - POST /profile: 18 tests (success, conflict, validation errors, computed fields rejection)
  - PUT /profile: 15 tests (success, validation, not found, empty body)
  - GET /profile/bmi: 8 tests (success, missing parameters, invalid ranges)

**Overall:** 166 total tests, 98.36% statements, 90.9% branches, 100% functions, 98.21% lines

### Example Tests (TASK-016) ✅

```javascript
describe('UserProfile Model', () => {
  // Pre-save hook overwrites client-supplied BMI
  test('should compute bmi = 17.63 for height=165, weight=48', async () => {
    const saved = await new UserProfile({
      userId: 'user-123',
      height: 165,
      weight: 48,
      age: 22,
      gender: 'male'
    }).save();
    expect(saved.bmi).toBe(17.63);
    expect(saved.bodyClassification).toBe('underweight');
  });

  // BR-02 guard: prevent stale BMI via findOneAndUpdate
  test('should throw when findOneAndUpdate touches height', async () => {
    const profile = await UserProfile.create({ ... });
    await expect(
      UserProfile.findOneAndUpdate(
        { userId: profile.userId },
        { $set: { height: 170 } }
      )
    ).rejects.toThrow('Use .save() when updating height or weight');
  });
});
```

---

## 🐳 Docker & Deployment

### Dockerfile (TASK-015 Complete)

Multi-stage build optimized for production:

```dockerfile
# Build stage: Node.js development environment
FROM node:18-alpine AS builder

# Runtime stage: Minimal production image
FROM node:18-alpine
RUN addgroup -g 1001 appgroup && adduser -D -u 1001 -G appgroup appuser
WORKDIR /app
COPY --chown=appuser:appgroup . .
RUN npm ci --omit=dev
USER appuser
EXPOSE 3002
CMD ["node", "src/server.js"]
```

### Environment Variables (TASK-015 Complete)

See `.env.example`:

```bash
NODE_ENV=development
PORT=3002
MONGO_URI=mongodb://localhost:27017/fitgainer-user
JWT_SECRET=your-secret-key-min-32-chars
LOG_LEVEL=debug
ALLOWED_ORIGINS=http://localhost:5173
```

---

## 📦 Dependencies (TASK-015 Complete)

### Production Dependencies

```json
{
  "cors": "^2.8.6",
  "dotenv": "^16.0.0",
  "express": "^4.18.0",
  "jsonwebtoken": "^9.0.0",
  "mongoose": "^7.0.0",
  "winston": "^3.8.0"
}
```

### Development Dependencies

```json
{
  "@types/jest": "^29.5.0",
  "jest": "^29.5.0",
  "mongodb-memory-server": "^9.0.0",
  "supertest": "^6.3.0"
}
```

### Scripts (TASK-015 Complete)

```bash
npm start                 # Production mode
npm run dev              # Development with nodemon watch
npm test                 # Run tests with coverage
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:watch       # Watch mode
```

---

## 🎯 Implementation Phases

### TASK-015: User Service Scaffolding ✅ Complete (2026-05-17)

**Status:** Foundation infrastructure ready

**Deliverables:**
- `src/server.js` — Entry point with database connection
- `src/app.js` — Express app configuration
- `src/config/database.js` — MongoDB pool management
- `src/utils/logger.js` — Winston logging
- `jest.config.js` — Test framework setup
- `Dockerfile` — Production containerization
- `.env.example` — Configuration template
- `README.md` — Service documentation
- 14 tests (logger, database, app integration)

**Key Features:**
- Graceful shutdown handlers
- Connection pooling (5-20 connections)
- Structured logging with file rotation
- Non-root Docker user for security
- Jest test configuration with 80% threshold

### TASK-016: UserProfile Model & BMI Calculation ✅ Complete (2026-05-17)

**Status:** Data model and business logic implemented with 100% test coverage

**Deliverables:** ✅
- `src/utils/bmi.js` — BMI calculation & classification (2 pure functions)
- `src/models/UserProfile.js` — Mongoose schema with pre-save & pre-findOneAndUpdate hooks
- `tests/unit/bmi.test.js` — 14 test cases (calculateBmi, classifyBmi)
- `tests/unit/UserProfile.test.js` — 47 test cases (validation, hooks, BR-02 guard)
- 100% test coverage for business logic
- 114 total tests passing (TASK-015 + TASK-016)

**Key Features:**
- BMI formula: `weight_kg / (height_cm / 100)²`, rounded to 2 decimals
- Classification: underweight (<18.5), normal (18.5–24.9), overweight (25–29.9), obese (≥30)
- Pre-save hook: idempotent BMI/classification recalculation
- BR-02 guard: findOneAndUpdate on height/weight throws error (must use .save())
- Validation: height [100–250], weight [20–300], age [10–100] integer, gender enum, userId unique

**Test Results:**
- 114 tests passed
- Coverage: 98.36% statements, 90.9% branches, 100% functions, 98.21% lines

### TASK-017: ProfileController & Routes ✅ Complete (2026-05-17)

**Status:** API layer fully implemented with comprehensive testing

**Deliverables:** ✅
- `src/middleware/authenticate.js` — JWT verification middleware (HS256, extracts userId & role)
- `src/middleware/validateProfile.js` — Request body validation for POST and PUT
- `src/controllers/profile.controller.js` — 4 handlers: getProfile, createProfile, updateProfile, getBmi
- `src/services/profile.service.js` — Business logic layer with ConflictError & NotFoundError classes
- `src/routes/profile.routes.js` — 4 routes: GET, POST, PUT /profile + GET /profile/bmi
- `tests/unit/profile.service.test.js` — 16 unit test cases (100% coverage)
- `tests/integration/profile.api.test.js` — 52 integration test cases (100% coverage)
- Updated `src/app.js` to mount profileRoutes at `/profile`
- 166 total tests passing (52 new integration + 16 new unit + 98 existing)

**Key Features:**
- JWT authentication via `authenticate` middleware on all routes
- Request validation: required fields (POST), optional fields (PUT), rejection of computed fields
- Service layer abstracts database operations with clear error handling
- Controller layer formats responses and delegates to service
- 4 error status codes: 400 (validation), 401 (unauthorized), 404 (not found), 409 (conflict)
- Profile response format: userId, height, weight, age, gender, bmi, bodyClassification, updatedAt
- BMI preview endpoint: calculate BMI without needing existing profile

**Implemented Routes:**
1. `GET /profile` — Retrieve authenticated user's profile
2. `POST /profile` — Create initial profile (requires all fields)
3. `PUT /profile` — Update profile (accepts partial updates)
4. `GET /profile/bmi` — Calculate BMI preview from query parameters

**Test Results:**
- 52 integration tests covering all endpoints, error cases, validation
- 16 unit tests covering service layer logic and error handling
- 100% coverage of new API layer code
- All tests passing with MongoMemoryServer in-memory database

### TASK-018: Frontend Profile Form (🔄 Pending)

**Planned Deliverables:**
- React component for profile form (height, weight, age, gender)
- Form validation
- API integration via axios
- Zustand store for user profile state
- 50+ component tests

---

## 🔗 Related Documentation

### Feature Specifications

- `spec/features/user-profile/feature.spec.md` — Feature overview
- `spec/features/user-profile/api.spec.md` — API endpoints
- `spec/features/user-profile/schema.spec.md` — Data models
- `spec/features/user-profile/rules.spec.md` — Business logic

### Architecture & Design

- `docs/architecture/user-service.md` (Pending)
- `spec/mapping/story-to-spec.md` — User story mapping

### Service Documentation

- `BE/user-service/README.md` — Getting started guide
- `BE/auth-service/README.md` — Auth integration reference

### Guides

- `docs/GUIDES/` (Pending)
- `CLAUDE.md` — Project rules and constraints

---

## 📊 Document Metadata

- **Version:** 1.2
- **Created:** 2026-05-17
- **Last Updated:** 2026-05-17
- **Status:** Phase 2a-2c Complete (Scaffold ✅ TASK-015, Model & BMI ✅ TASK-016, CRUD API ✅ TASK-017)
- **Owner:** Engineering Team
- **Dependencies:** Phase 1 (Auth Service) ✅
- **Review Cycle:** Update after TASK-018 (Frontend Profile Form)
- **Test Results:** 166 tests passing, 98.36% coverage (TASK-015: 14 tests + TASK-016: 100 tests + TASK-017: 52 tests)

---

## 💡 Quick Navigation

### For Getting Started
→ `BE/user-service/README.md`

### For API Specification
→ `spec/features/user-profile/api.spec.md`

### For Data Model Design
→ `spec/features/user-profile/schema.spec.md`

### For Business Rules
→ `spec/features/user-profile/rules.spec.md`

### For Implementation Task
→ `tasks/user-profile/TASK-016-*.md`

### For Development Setup
→ `docs/SETUP.md`

### For Architecture Decisions
→ `CLAUDE.md`
