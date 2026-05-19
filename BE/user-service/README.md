# FitGainer User Service

Body profile management service for the FitGainer fitness application. Manages user body data, calculates BMI, and provides body classification.

## Tech Stack

- **Runtime:** Node.js v18+
- **Framework:** Express
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (jsonwebtoken) — Token validation via auth-service
- **Testing:** Jest + Supertest + MongoMemoryServer
- **Logging:** Winston

## Project Structure

```
src/
├── app.js                     # Express app configuration (TASK-015, updated TASK-017)
├── server.js                  # Server entry point
├── models/                    
│   └── UserProfile.js         # UserProfile schema with pre-save hook (TASK-016) ✅
├── config/
│   └── database.js            # MongoDB connection logic
├── controllers/
│   └── profile.controller.js  # Profile CRUD handlers (TASK-017) ✅
├── routes/
│   └── profile.routes.js      # API routes (TASK-017) ✅
├── middleware/
│   ├── authenticate.js        # JWT verification (TASK-017) ✅
│   └── validateProfile.js     # Request validation (TASK-017) ✅
├── services/
│   └── profile.service.js     # Business logic (TASK-017) ✅
└── utils/
    ├── logger.js              # Winston logging
    └── bmi.js                 # BMI calculation & classification (TASK-016) ✅

tests/
├── unit/
│   ├── bmi.test.js            # BMI calculator tests (TASK-016) ✅ 14 tests
│   ├── UserProfile.test.js    # UserProfile model tests (TASK-016) ✅ 47 tests
│   ├── logger.test.js         # Logger tests (TASK-015) ✅ 6 tests
│   ├── database.test.js       # Database connection tests (TASK-015) ✅ 2 tests
│   └── profile.service.test.js # ProfileService tests (TASK-017) ✅ 16 tests
└── integration/
    ├── app.test.js            # Express app integration tests (TASK-015) ✅ 6 tests
    └── profile.api.test.js    # Profile API tests (TASK-017) ✅ 52 tests
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

- `PORT` - Server port (default: 3002)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `JWT_EXPIRES_IN` - Access token TTL (default: 15m)
- `LOG_LEVEL` - Winston log level (default: debug)

## Running

### Development

```bash
npm run dev
```

Server will start on `http://localhost:3002`

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

### Watch mode

```bash
npm run test:watch
```

**Coverage threshold:** 80% (branches, functions, lines, statements)

## Docker

### Build

```bash
docker build -t fitgainer-user:latest .
```

### Run

```bash
docker run -p 3002:3002 \
  -e NODE_ENV=production \
  -e MONGO_URI=mongodb://host.docker.internal:27017/fitgainer-user \
  -e JWT_SECRET=your-secret-key-min-32-chars \
  fitgainer-user:latest
```

## Features

### Core User Profile Features (TASK-015 ✅ + TASK-016 ✅ + TASK-017 ✅)

- **Create Profile** — Store user body measurements (height, weight, age, gender) with validation
- **Get Profile** — Retrieve current authenticated user's body profile data
- **Update Profile** — Partial profile updates (height, weight, age, gender)
- **BMI Calculation** — Automatic BMI computation from height and weight
- **BMI Preview** — Calculate BMI for given measurements without creating/updating profile
- **Body Classification** — Classify users as Underweight / Normal / Overweight / Obese
- **JWT Authentication** — Token validation with HS256 algorithm
- **Request Validation** — Validation of required fields, ranges, types
- **Error Handling** — Structured error responses with appropriate HTTP status codes
- **Comprehensive Testing** — 166 tests covering all endpoints and edge cases

### Planned Features (TASK-018+)

- Body profile history tracking
- Integration with workout-service for personalized plan generation
- Event publishing to RabbitMQ for async updates
- Frontend profile form component with React

## API Documentation

See `spec/features/user-profile/api.spec.md` for complete API specification.

### Core Endpoints (TASK-017 ✅ Complete)

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

- `GET /api/users/profile` — Retrieve authenticated user's profile (200/404/401)
- `POST /api/users/profile` — Create initial user profile (201/400/409/401)
- `PUT /api/users/profile` — Update existing user profile (200/400/404/401)
- `GET /api/users/profile/bmi?height=X&weight=Y` — Calculate BMI preview (200/400/401)

### Example API Calls

```bash
# Create profile
curl -X POST http://localhost:3002/profile \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{ "height": 165, "weight": 48, "age": 22, "gender": "male" }'
# Response: 201 { userId, height, weight, age, gender, bmi, bodyClassification, updatedAt }

# Get profile
curl -X GET http://localhost:3002/profile \
  -H "Authorization: Bearer eyJhbGc..."
# Response: 200 { userId, height, weight, age, gender, bmi, bodyClassification, updatedAt }

# Update profile
curl -X PUT http://localhost:3002/profile \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{ "weight": 70 }'
# Response: 200 { userId, height, weight, age, gender, bmi, bodyClassification, updatedAt }

# Calculate BMI preview
curl -X GET "http://localhost:3002/profile/bmi?height=165&weight=48" \
  -H "Authorization: Bearer eyJhbGc..."
# Response: 200 { bmi: 17.63, bodyClassification: "underweight" }
```

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
- Validate and sanitize all inputs
- Token validation mandatory on protected routes

## Implementation Status

| Task | Feature | Status | Details |
|------|---------|--------|---------|
| TASK-015 | User Service Scaffolding | ✅ Complete | Express app, database config, logging, Dockerfile, jest config, 14 tests |
| TASK-016 | UserProfile Model & BMI | ✅ Complete | Mongoose schema with pre-save hook, BMI calculation, 100 tests, 100% coverage |
| TASK-017 | ProfileController & Routes | ✅ Complete | 4 CRUD endpoints, authentication, validation, service layer, 68 tests (16 unit + 52 integration) |
| TASK-018 | Frontend Profile Form | 🔄 Pending | React component, form validation, Zustand store, state management |

## TASK-015: User Service Scaffolding (✅ Complete, 2026-05-17)

### Architecture Scaffolding

**New Files:**
- `src/server.js` — Entry point with database connection and graceful shutdown
- `src/app.js` — Express app configuration with middleware setup
- `src/config/database.js` — MongoDB connection with pool configuration
- `src/utils/logger.js` — Winston logging factory
- `jest.config.js` — Test configuration with 80% coverage threshold
- `Dockerfile` — Production-ready containerization (multi-stage build, non-root user)
- `.env.example` — Environment configuration template
- `package.json` — Dependencies (Express, Mongoose, JWT, Winston, Jest)

**Infrastructure:**
- Graceful shutdown: SIGTERM/SIGINT signal handlers
- Database connection pooling: min 5, max 20 connections
- Unhandled rejection/exception monitoring
- Winston structured logging with separate app/error logs

### Key Features Implemented

1. **Server Lifecycle**
   - Async startup with database connection
   - Graceful shutdown on SIGTERM/SIGINT
   - Unhandled rejection/exception handlers

2. **Express App**
   - CORS middleware for cross-origin requests
   - Body parser for JSON payloads
   - Request logging via Winston
   - Error handling middleware placeholder

3. **Database Configuration**
   - Connection string from `MONGO_URI` environment variable
   - Connection pool: min 5, max 20
   - Timeouts: 5000ms (socket, server selection, connect)
   - Graceful connection cleanup on shutdown

4. **Logging**
   - Winston logger with JSON format
   - Development (colorized console) and production (JSON) modes
   - Separate log files: `logs/app.log` and `logs/error.log`
   - Configurable log level via `LOG_LEVEL` environment variable

5. **Testing Infrastructure**
   - Jest configuration with MongoMemoryServer support
   - 80% coverage threshold (statements, branches, functions, lines)
   - Test environment setup

6. **Docker & Deployment**
   - Multi-stage Dockerfile for optimized production image
   - Non-root user for security
   - Health check support
   - Environment variable configuration

## TASK-017: ProfileController & Routes (✅ Complete, 2026-05-17)

### API Layer Implementation

**New Files:**
- `src/middleware/authenticate.js` — JWT token verification middleware (HS256)
- `src/middleware/validateProfile.js` — Request body validation for POST and PUT
- `src/controllers/profile.controller.js` — 4 request handlers
- `src/services/profile.service.js` — Business logic layer with error classes
- `src/routes/profile.routes.js` — 4 route definitions
- `tests/unit/profile.service.test.js` — 16 unit test cases
- `tests/integration/profile.api.test.js` — 52 integration test cases
- Updated `src/app.js` — Mount profileRoutes at `/profile`

### Middleware Implementation

#### `authenticate` Middleware
- Extracts JWT token from `Authorization: Bearer <token>` header
- Verifies token using HS256 algorithm with `JWT_SECRET` environment variable
- Extracts `userId` (from `sub` or `userId` claim) and `role` from token
- Sets `req.user = { userId, role }` for downstream handlers
- Returns 401 if header missing, invalid, or token expired

#### `validateProfile` Middleware
- **validateCreateProfile** — Validates POST body for creating new profile
  - Required fields: height, weight, age, gender (all with type and range checks)
  - Rejects computed fields: bmi, bodyClassification (user cannot override)
  - Returns 400 with detailed error messages for validation failures

- **validateUpdateProfile** — Validates PUT body for updating existing profile
  - Optional fields: height, weight, age, gender
  - At least one field required for update
  - Rejects computed fields: bmi, bodyClassification
  - Returns 400 if validation fails or body is empty

### Service Layer Implementation

**ProfileService** (`src/services/profile.service.js`)

Exports:
- `getProfile(userId)` — Fetch profile from database by userId
- `createProfile(userId, data)` — Create new profile with conflict check
  - Throws `ConflictError` (409) if profile already exists
  - Validates height/weight/age/gender via Mongoose schema
- `updateProfile(userId, data)` — Update existing profile
  - Throws `NotFoundError` (404) if profile doesn't exist
  - Updates only allowed fields (height, weight, age, gender)
  - Triggers pre-save hook for BMI recalculation
- `calcBmi(height, weight)` — Pure function to calculate BMI & classification
  - Returns `{ bmi, bodyClassification }`
  - Used by GET /profile/bmi endpoint

Custom Errors:
- `ConflictError` — 409 status code for duplicate profile
- `NotFoundError` — 404 status code for missing profile

### Controller Implementation

**ProfileController** (`src/controllers/profile.controller.js`)

Handlers:
- `getProfile(req, res, next)` — GET /profile
  - Returns 200 with profile data
  - Returns 404 if profile not found
  - Uses formatProfile() to ensure consistent response format

- `createProfile(req, res, next)` — POST /profile
  - Returns 201 with new profile data
  - Returns 409 if profile already exists
  - Handles both service ConflictError and MongoDB E11000 duplicate key errors

- `updateProfile(req, res, next)` — PUT /profile
  - Returns 200 with updated profile data
  - Returns 404 if profile not found
  - BMI automatically recalculated by model pre-save hook

- `getBmi(req, res, next)` — GET /profile/bmi
  - Parses height and weight from query parameters
  - Returns 200 with { bmi, bodyClassification }
  - Returns 400 for missing or invalid parameters

Response Format:
- All responses use `formatProfile()` helper for consistency
- Fields: userId, height, weight, age, gender, bmi, bodyClassification, updatedAt
- Excludes internal fields like createdAt, _id, __v

### Routes Implementation

**Profile Routes** (`src/routes/profile.routes.js`)

```
GET    /profile        → authenticate → getProfile
POST   /profile        → authenticate → validateCreateProfile → createProfile
PUT    /profile        → authenticate → validateUpdateProfile → updateProfile
GET    /profile/bmi    → authenticate → getBmi
```

Mount Point: `/profile` (full path via Nginx: `/api/users/profile`)

### Request/Response Examples

```javascript
// POST /profile — Create profile
Request:
  { height: 165, weight: 48, age: 22, gender: "male" }

Response (201):
  { userId: "user123", height: 165, weight: 48, age: 22, gender: "male", bmi: 17.63, bodyClassification: "underweight", updatedAt: "2026-05-17T..." }

// PUT /profile — Update profile (partial)
Request:
  { weight: 70 }

Response (200):
  { userId: "user123", height: 165, weight: 70, age: 22, gender: "male", bmi: 25.71, bodyClassification: "overweight", updatedAt: "2026-05-17T..." }

// GET /profile/bmi?height=165&weight=48
Response (200):
  { bmi: 17.63, bodyClassification: "underweight" }
```

### Test Coverage

**Unit Tests (16 tests in profile.service.test.js):**
- getProfile: 2 tests
- createProfile: 5 tests (including ConflictError scenarios)
- updateProfile: 5 tests (including NotFoundError scenarios)
- calcBmi: 4 tests

**Integration Tests (52 tests in profile.api.test.js):**
- authenticate middleware: 4 tests
  - Missing Authorization header
  - Invalid Bearer scheme
  - Wrong JWT secret
  - Expired token
  
- GET /profile: 7 tests
  - Success with existing profile
  - 404 when profile not found
  - 401 without token
  - Response format validation
  - Field presence validation
  
- POST /profile: 18 tests
  - Success creation
  - 409 Conflict (duplicate profile)
  - Validation errors (missing/invalid fields)
  - Rejection of computed fields (bmi, bodyClassification)
  - Height/weight range validation
  - Age integer validation
  - Gender enum validation
  
- PUT /profile: 15 tests
  - Success update (full and partial)
  - BMI recalculation on weight change
  - 404 when profile not found
  - Validation errors
  - Empty body rejection
  - Computed field rejection
  
- GET /profile/bmi: 8 tests
  - Success calculation
  - Missing query parameters
  - Invalid parameter types
  - Range validation
  - No authentication required test

**Total:** 68 new tests (16 unit + 52 integration)
**Combined Total:** 166 tests (all phases)
**Coverage:** 100% of TASK-017 code

---

## TASK-016: UserProfile Model & BMI Calculation (✅ Complete, 2026-05-17)

### Data Model Implementation

**New Files:**
- `src/models/UserProfile.js` — Mongoose schema with pre-save and pre-findOneAndUpdate hooks
- `src/utils/bmi.js` — Pure functions for BMI calculation and body classification
- `tests/unit/UserProfile.test.js` — Comprehensive model tests (47 test cases)
- `tests/unit/bmi.test.js` — BMI calculation tests (14 test cases)

**Schema Specification (UserProfile Collection):**
- `userId` — String, required, unique (indexed)
- `height` — Number [100–250] cm, required
- `weight` — Number [20–300] kg, required
- `age` — Number [10–100], integer, required
- `gender` — String, enum: ['male', 'female'], required
- `bmi` — Number, computed by pre-save hook (read-only)
- `bodyClassification` — String, enum: ['underweight', 'normal', 'overweight', 'obese'], computed by pre-save hook
- `createdAt`, `updatedAt` — Timestamps (auto)

### Business Rules Implemented

1. **BR-01 (Unique Profile):** userId unique index prevents duplicate profiles
2. **BR-02 (Server-Side Computation):**
   - BMI and classification are ALWAYS computed by pre-save hook
   - Client-supplied values are overwritten (hook wins)
   - findOneAndUpdate on height/weight is guarded — throws error forcing use of .save()
   - This ensures BMI freshness on every update

### Key Features

1. **BMI Calculation**
   - Formula: `weight_kg / (height_cm / 100)²`
   - Rounded to 2 decimal places
   - Guards against invalid inputs (height ≤ 0, weight < 0)

2. **Body Classification**
   - Underweight: BMI < 18.5
   - Normal: 18.5 ≤ BMI < 25
   - Overweight: 25 ≤ BMI < 30
   - Obese: BMI ≥ 30

3. **Pre-Save Hook**
   - Runs on every `.save()` call
   - Idempotent (safe to call multiple times)
   - Overwrites client-supplied bmi/bodyClassification

4. **Pre-FindOneAndUpdate Guard**
   - Rejects updates to height or weight via `.findOneAndUpdate()`
   - Enforces use of `.save()` to trigger BMI recalculation
   - Allows updates to other fields (age, gender)

### Test Coverage

**BMI Utilities (bmi.js):**
- 14 test cases, 100% coverage
- Valid calculations with various inputs
- Boundary testing (100cm/20kg, 250cm/300kg)
- Rounding accuracy (2 decimals)
- Error handling (invalid height/weight)
- Classification boundaries (18.5, 24.9, 25, 29.9, 30)

**UserProfile Model:**
- 47 test cases, 100% coverage
- Valid document creation and field persistence
- Pre-save hook behavior (idempotent, overwrites client values)
- Height/weight updates via .save() trigger recomputation
- All validation ranges [height, weight, age]
- Gender enum validation (case-sensitive)
- Unique userId constraint (E11000 error handling)
- All 4 body classifications triggered correctly
- BR-02 guard: findOneAndUpdate rejects height/weight updates

**Overall Metrics:**
- 114 total tests (TASK-015: 14 + TASK-016: 61 + pre-existing: 39)
- Coverage: 98.36% statements, 90.9% branches, 100% functions
- All tests passing

### Example Usage

```javascript
// Create profile — BMI computed automatically
const profile = await new UserProfile({
  userId: 'user-123',
  height: 165,
  weight: 48,
  age: 22,
  gender: 'male'
}).save();

console.log(profile.bmi);                // 17.63 (computed)
console.log(profile.bodyClassification); // 'underweight'

// Update weight — must use .save(), not findOneAndUpdate
profile.weight = 70;
const updated = await profile.save();
console.log(updated.bmi);                // 25.71 (recomputed)
console.log(updated.bodyClassification); // 'overweight'

// ❌ This will throw (BR-02 guard):
// UserProfile.findOneAndUpdate(
//   { userId: 'user-123' },
//   { $set: { height: 170 } }
// );
```

## License

MIT

## Support

For issues or questions, refer to the FitGainer documentation at `spec/features/user-profile/`
