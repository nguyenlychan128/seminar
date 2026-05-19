# Progress Service Codemap v1.0

**Service:** `BE/progress-service` | **Port:** 3004 | **Last Updated:** 2026-05-18 | **Status:** Phase 4a ✅ BE Complete (TASK-030-BE)

---

## 📌 Overview

Codemap for the FitGainer Progress Service. This document provides a structural overview of the codebase, module dependencies, and data flows for quick developer onboarding.

The Progress Service is responsible for tracking user weight logs, calculating weight trends, and providing historical data for progress visualization on the frontend.

---

## 🗂️ Directory Structure

```
BE/progress-service/
├── src/
│   ├── server.js                      # Entry point: HTTP server setup
│   ├── app.js                         # Express app: middleware, routing (TASK-030-BE)
│   ├── utils/
│   │   └── logger.js                  # [To implement] Winston logging factory
│   ├── models/
│   │   └── WeightLog.js               # ✅ WeightLog schema with trend calculation (TASK-030-BE, 95.83% coverage)
│   ├── config/
│   │   └── database.js                # [To implement] MongoDB connection
│   ├── services/
│   │   └── weightLogService.js        # ✅ createWeightLog() & getWeightHistory() (TASK-030-BE, 100% coverage)
│   ├── controllers/
│   │   └── weightLogController.js     # ✅ createWeightLog() & getWeightHistory() handlers (TASK-030-BE, 93.75% coverage)
│   ├── middleware/
│   │   ├── authenticate.js            # ✅ JWT token validation & extraction (TASK-030-BE, 82.35% coverage)
│   │   ├── errorHandler.js            # ✅ Global error handling (TASK-030-BE, 23.07% coverage)
│   │   └── weightLogValidation.js     # ✅ Weight & date validation middleware (TASK-030-BE, 95% coverage)
│   └── routes/
│       └── weightLog.routes.js        # ✅ Route definitions for weight logs (TASK-030-BE, 100% coverage)
├── tests/
│   └── integration/
│       ├── models.test.js             # ✅ 37 tests for WeightLog model (TASK-030-BE)
│       └── weightLog.test.js          # ✅ 47 tests for API endpoints (TASK-030-BE)
├── coverage/                          # Test coverage reports
├── Dockerfile                         # Production container
├── jest.config.js                     # Test configuration
├── package.json                       # Dependencies & scripts
├── .env.example                       # Environment template
├── .gitignore                         # Excludes .env, logs, node_modules
└── README.md                          # [To create] Service documentation

```

---

## 🔌 Module Dependencies

### Implemented Modules

#### `src/server.js`
**Responsibility:** HTTP server lifecycle management
- Entry point for the service
- Creates Express app via `require('./app')`
- Initializes MongoDB connection
- Starts HTTP server on `PORT` (3004)
- Handles graceful shutdown (SIGTERM, SIGINT)
- Console logging for startup/shutdown events

**Dependencies:**
- `dotenv` (env variables)
- `./app.js` — Express app
- `mongoose` (database connection)

**Exports:** None (side effects only, called directly via `node src/server.js`)

**Testing:** Integration tests via app initialization

#### `src/app.js`
**Responsibility:** Express application configuration
- Middleware setup (body parsers, CORS, logging, error handling)
- Route registration
- Health check endpoint (GET /health)
- Global error handler (bottom of middleware stack)

**Dependencies:**
- `express`
- `cors`
- `./middleware/errorHandler.js`
- `./middleware/authenticate.js`
- `./routes/weightLog.routes.js`

**Exports:**
```js
module.exports = app;
```

**Testing:** Integration tests for app initialization and middleware ordering

#### `src/models/WeightLog.js`
**Responsibility:** MongoDB schema definition and data validation

**Schema Fields:**
- `userId` — ObjectId reference to User, required, indexed
- `weight` — Number (30-200 kg), required
- `date` — Date (UTC-safe, no future dates), required
- `trend` — Number (default 0, calculated as current - previous day)
- `notes` — String (optional, max 200 chars)
- `createdAt`, `updatedAt` — Timestamps (auto-generated)

**Indexes:**
- `userId` (sparse)
- `(userId, date)` compound unique index — prevent duplicate entries same day per user
- `(userId, date DESC)` compound sort index — efficient history queries

**Pre-save Hook:**
- Calculates `trend` on document creation (not update)
- Finds previous day's entry (same user, UTC-safe date boundaries)
- Sets trend = current weight - previous weight (or 0 if no previous entry)
- Only runs for new documents (isNew guard)

**Validation:**
- Weight: 30-200 kg range
- Date: Cannot be in future (UTC-based comparison)
- Notes: Max 200 characters

**Coverage:** 95.83% (1 line uncovered in pre-save hook)

**Exports:**
```js
module.exports = WeightLog; // Mongoose model
```

**Testing:** 37 integration tests covering schema creation, validation, indexes, trend calculation, timestamps, user isolation

#### `src/services/weightLogService.js`
**Responsibility:** Business logic for weight log operations

**Methods:**

**1. `createWeightLog(userId, weight, date = null, notes = null)`**
- Normalizes date to UTC 00:00:00 (default: today)
- Checks for duplicate entry same date (same user)
- Throws 409 error if duplicate exists
- Creates new WeightLog document
- Saves to database (triggers pre-save hook for trend calculation)
- Returns saved document

**2. `getWeightHistory(userId, startDate = null, endDate = null, limit = 30)`**
- Normalizes dates (default: last 30 days)
- Validates limit (1-365, default 30)
- Queries with date range filter
- Sorts by date descending (newest first)
- Applies limit
- Returns `{ data, count, startDate, endDate }`
- Returns empty array if no entries found (no error thrown)

**Coverage:** 100% statements, 88.23% branches (uncovered: line 40 optional notes, line 69 limit edge cases)

**Exports:**
```js
module.exports = new WeightLogService(); // Singleton instance
```

**Testing:** 22 service-level tests integrated into weightLog.test.js

#### `src/controllers/weightLogController.js`
**Responsibility:** HTTP request handlers and response formatting

**Methods:**

**1. `createWeightLog(req, res, next)`**
- Extracts `weight`, `date`, `notes` from request body
- Extracts `userId` from JWT token (req.user)
- Calls `weightLogService.createWeightLog()`
- Returns 201 with created document on success
- Catches errors and passes to errorHandler middleware
- Error handling: 400 validation, 409 duplicate, 401 auth

**2. `getWeightHistory(req, res, next)`**
- Extracts query params: `startDate`, `endDate`, `limit`
- Extracts `userId` from JWT token
- Calls `weightLogService.getWeightHistory()`
- Returns 200 with history data
- Catches errors and passes to errorHandler

**Coverage:** 93.75% (uncovered: line 65 edge case in error logging)

**Exports:**
```js
module.exports = weightLogController; // Controller instance
```

**Testing:** 25+ controller-level tests in weightLog.test.js

#### `src/middleware/authenticate.js`
**Responsibility:** JWT token validation and user context extraction

**Function:** `authenticate(req, res, next)`
- Extracts Authorization header (format: `Bearer <token>`)
- Validates token using JWT secret
- Attaches user data to `req.user` (userId, email, role)
- Calls `next()` on success
- Returns 401 on missing/invalid/expired token

**Exports:**
```js
module.exports = { authenticate }; // Named export
```

**Coverage:** 82.35% (uncovered: lines 18, 23-24 error paths)

**Testing:** 12+ integration tests for auth middleware

#### `src/middleware/errorHandler.js`
**Responsibility:** Centralized error handling

**Function:** `errorHandler(err, req, res, next)`
- Checks error status code
- Returns appropriate HTTP response
- Logs error details
- Default 500 for unhandled errors

**Error Mapping:**
- 400 — Validation errors
- 401 — Authentication failures
- 409 — Conflict (duplicate entries)
- 500 — Server errors

**Coverage:** 23.07% (most errors tested indirectly via controller tests)

**Exports:**
```js
module.exports = errorHandler; // Default export
```

#### `src/middleware/weightLogValidation.js`
**Responsibility:** Request validation before controller execution

**Middleware:**

**1. `weightLogValidationMiddleware` (POST /progress/weight)**
- Validates `weight` is a number between 30-200
- Validates `date` is valid ISO date string (optional)
- Validates `notes` length ≤ 200 chars (optional)
- Returns 400 with errors if validation fails
- Calls `next()` on success

**2. `weightHistoryValidationMiddleware` (GET /progress/weight)**
- Validates `startDate`, `endDate` are valid ISO date strings (optional)
- Validates `limit` is positive integer ≤ 365 (optional)
- Returns 400 with errors if validation fails
- Calls `next()` on success

**Coverage:** 95% (uncovered: lines 46-48 edge cases)

**Exports:**
```js
module.exports = { 
  weightLogValidationMiddleware,
  weightHistoryValidationMiddleware 
}; // Named exports
```

**Testing:** 10+ validation tests in weightLog.test.js

#### `src/routes/weightLog.routes.js`
**Responsibility:** API route definitions and middleware composition

**Routes:**

**1. POST /progress/weight**
- Middleware: `authenticate`, `weightLogValidationMiddleware`
- Handler: `weightLogController.createWeightLog()`
- Response: 201 { id, userId, weight, date, trend, notes, createdAt, updatedAt }
- Error: 400 validation, 401 auth, 409 duplicate

**2. GET /progress/weight**
- Middleware: `authenticate`, `weightHistoryValidationMiddleware`
- Handler: `weightLogController.getWeightHistory()`
- Query params: `startDate`, `endDate`, `limit`
- Response: 200 { data: [{ id, weight, date, trend, notes }...], count, startDate, endDate }
- Error: 401 auth

**Coverage:** 100% (all route definitions tested)

**Exports:**
```js
module.exports = router; // Express Router instance
```

**Testing:** All routes tested via integration tests in weightLog.test.js

---

## 📊 Data Flow

### Create Weight Log (POST /progress/weight)

```
Client Request
  ↓
Express Middleware (body parser)
  ↓
Authenticate Middleware (JWT validation)
  ├─ Success: Extract userId, attach to req.user
  └─ Failure: Return 401
  ↓
weightLogValidationMiddleware (weight/date/notes validation)
  ├─ Success: Validate request body
  └─ Failure: Return 400
  ↓
weightLogController.createWeightLog(req, res, next)
  ├─ Extract userId, weight, date, notes from request
  ├─ Call weightLogService.createWeightLog()
  │   ├─ Normalize date to UTC 00:00:00
  │   ├─ Check for duplicate entry same date
  │   │   └─ If exists: Throw Error 409
  │   ├─ Create new WeightLog document
  │   └─ Save to MongoDB
  │       ├─ Pre-save hook calculates trend
  │       │   ├─ Find previous day entry (same user, UTC-safe)
  │       │   └─ Set trend = current - previous (or 0)
  │       └─ Return saved document
  ├─ Return 201 with created document
  └─ On error: Pass to errorHandler middleware
      ├─ 409 Conflict (duplicate)
      ├─ 400 Validation (invalid data)
      └─ 500 Server error
  ↓
Client Response
```

### Get Weight History (GET /progress/weight)

```
Client Request (with query params: startDate, endDate, limit)
  ↓
Express Middleware (query parser)
  ↓
Authenticate Middleware (JWT validation)
  ├─ Success: Extract userId, attach to req.user
  └─ Failure: Return 401
  ↓
weightHistoryValidationMiddleware (date/limit validation)
  ├─ Success: Validate query parameters
  └─ Failure: Return 400
  ↓
weightLogController.getWeightHistory(req, res, next)
  ├─ Extract userId from req.user, startDate/endDate/limit from req.query
  ├─ Call weightLogService.getWeightHistory()
  │   ├─ Normalize dates (default: last 30 days)
  │   ├─ Validate limit (1-365, default 30)
  │   ├─ Query MongoDB with date range filter (userId + date range)
  │   ├─ Sort by date descending (newest first)
  │   ├─ Apply limit
  │   └─ Return { data: [...], count, startDate, endDate }
  ├─ Return 200 with history
  └─ On error: Pass to errorHandler middleware
      └─ 500 Server error
  ↓
Client Response
```

---

## 🧪 Testing Strategy

### Test Coverage

**Overall:** 89 tests, 87.5% code coverage

**Breakdown:**
- **Model Tests (37):** WeightLog schema, validation, indexes, trend calculation, timestamps
- **API Tests (47):** POST/GET endpoints, authentication, validation, error handling

### Test Files

#### `tests/integration/models.test.js` (37 tests)
Tests for WeightLog model schema, validation, indexes, and pre-save hooks:

- **Schema Creation:** Document structure, field types
- **Weight Validation:** Range 30-200 kg enforcement
- **Date Validation:** No future dates, UTC-safe boundaries
- **Notes Validation:** Max 200 characters, optional field
- **Indexes:** Compound unique (userId, date), sort (userId, date DESC)
- **Trend Calculation:** First entry (0), positive/negative trends, missing previous entry, unchanged weight, user isolation
- **Timestamps:** createdAt immutable, updatedAt updates, auto-generated

#### `tests/integration/weightLog.test.js` (47 tests)
Tests for API endpoints and business logic:

- **POST /progress/weight (Create):**
  - Authentication: 401 without token
  - Validation: Weight bounds, date format, notes length
  - Success: 201 with created document
  - Duplicate: 409 conflict error
  - Trend calculation: Auto-computed on save
  
- **GET /progress/weight (History):**
  - Authentication: 401 without token
  - Date filtering: startDate, endDate range
  - Pagination: Limit (default 30, max 365)
  - Sorting: Newest first (date DESC)
  - Empty history: 200 with empty data array
  - Response structure: { data, count, startDate, endDate }

### Running Tests

```bash
# All tests with coverage
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode
npm run test:watch
```

### Coverage Report

```
File                     | % Stmts | % Branch | % Funcs | % Lines
─────────────────────────┼─────────┼──────────┼─────────┼─────────
All files                | 87.5%   | 76.76%   | 78.94%  | 87.91%
src/models/WeightLog.js  | 95.83%  | 100%     | 100%    | 95.83%
src/services/...js       | 100%    | 88.23%   | 100%    | 100%
src/controllers/...js    | 93.75%  | 50%      | 100%    | 93.33%
src/routes/...js         | 100%    | 100%     | 100%    | 100%
```

---

## 🔐 Security

- **Authentication:** JWT Bearer token validation on all endpoints
- **Authorization:** User isolation (users can only access their own weight logs)
- **Validation:** Client-side (FE) + server-side (middleware) validation
- **Database:** Compound unique index prevents duplicate entries
- **Input Sanitization:** Weight range (30-200kg), date validation (UTC-safe, no future dates)

---

## 📦 Dependencies

**Production:**
- `express@^4.18.0` — HTTP server framework
- `mongoose@^7.0.0` — MongoDB ODM
- `jsonwebtoken@^9.0.0` — JWT token validation
- `cors@^2.8.6` — CORS support
- `dotenv@^16.0.0` — Environment variable management
- `winston@^3.8.0` — Logging (for future use)

**Development:**
- `jest@^29.5.0` — Test runner
- `supertest@^6.3.0` — HTTP assertion library
- `mongodb-memory-server@^9.0.0` — In-memory MongoDB for tests

---

## 🚀 API Endpoints

### POST /progress/weight
**Create a new weight log entry**

**Request:**
```json
{
  "weight": 75.5,
  "date": "2026-05-18",
  "notes": "Feeling stronger today"
}
```

**Response (201):**
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "weight": 75.5,
  "date": "2026-05-18T00:00:00.000Z",
  "trend": 0.5,
  "notes": "Feeling stronger today",
  "createdAt": "2026-05-18T10:30:45.123Z",
  "updatedAt": "2026-05-18T10:30:45.123Z"
}
```

**Errors:**
- 400 — Validation errors (invalid weight, date format, notes length)
- 401 — Missing/invalid authentication token
- 409 — Duplicate entry for same date

### GET /progress/weight
**Fetch weight history with optional filtering**

**Query Parameters:**
- `startDate` (optional) — ISO date string (default: 30 days ago)
- `endDate` (optional) — ISO date string (default: today)
- `limit` (optional) — Number of entries (default: 30, max: 365)

**Response (200):**
```json
{
  "data": [
    {
      "_id": "ObjectId",
      "userId": "ObjectId",
      "weight": 75.5,
      "date": "2026-05-18T00:00:00.000Z",
      "trend": 0.5,
      "notes": "Feeling stronger"
    },
    {
      "_id": "ObjectId",
      "userId": "ObjectId",
      "weight": 75.0,
      "date": "2026-05-17T00:00:00.000Z",
      "trend": -0.3,
      "notes": "Starting weight"
    }
  ],
  "count": 2,
  "startDate": "2026-04-18",
  "endDate": "2026-05-18"
}
```

**Errors:**
- 400 — Invalid query parameters (date format, limit bounds)
- 401 — Missing/invalid authentication token

---

## 🔗 Integration Points

### Auth Service Integration
- Uses JWT token from auth-service for authentication
- Validates Bearer token format: `Authorization: Bearer <token>`
- Extracts userId from JWT payload for data isolation

### Frontend Integration
- ProgressDashboard page calls POST /progress/weight to create logs
- ProgressChart component calls GET /progress/weight to fetch history
- WeightInputForm component handles form validation and submission
- WeightChart component displays trend visualization

---

## 📝 Environment Variables

**Required:**
```
PORT=3004
MONGO_URI=mongodb://localhost:27017/fitgainer-progress
JWT_SECRET=<32+ character secret from auth-service>
```

**Optional:**
```
NODE_ENV=development
LOG_LEVEL=debug
ALLOWED_ORIGINS=http://localhost:5173
```

---

## 📈 Future Enhancements

- Advanced analytics (weekly/monthly averages)
- Strength tracking (not just weight)
- Goal setting and milestone tracking
- Adaptive plan adjustments based on progress
- RabbitMQ event publishing for cross-service notifications

---

## 📄 Related Documents

- **Feature Spec:** `spec/features/progress-tracking/`
- **Task:** `tasks/progress-tracking/TASK-030-be-weight-log-api.md`
- **Architecture:** `docs/architecture/progress-service.md` (pending)
- **Frontend Codemap:** `docs/CODEMAPS/progress-frontend.md` (pending)
- **Main README:** `README.md`

---

## 🆙 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-18 | Initial codemap for TASK-030-BE Weight Log API (89 tests, 87.5% coverage) |

