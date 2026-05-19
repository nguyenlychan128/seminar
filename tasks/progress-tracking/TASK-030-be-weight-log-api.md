# TASK-030-BE: Weight Log API Endpoints & Business Logic

## Title
Implement POST & GET weight log endpoints with validation & trend calculation

## Description
Create controllers, services, and routes for weight logging API:
- **POST /progress/weight** — Create weight log entry (with duplicate date check)
- **GET /progress/weight** — Fetch weight history (with date range filtering)
- Business logic: trend calculation, data validation, error handling
- All endpoints require JWT authentication

## Input
- Spec: [api.spec.md#1,#2](../../spec/features/progress-tracking/api.spec.md) — API Endpoints
- Spec: [rules.spec.md#Validation,#Authorization,#Error-Handling](../../spec/features/progress-tracking/rules.spec.md)
- Model: `BE/progress-service/src/models/WeightLog.js` (from TASK-030-BE step 1) ✅

## Output
```
BE/progress-service/src/
  ├── controllers/
  │   └── weightLogController.js
  ├── services/
  │   └── weightLogService.js
  ├── routes/
  │   └── weightLog.routes.js
  └── middleware/
      └── weightLogValidation.js (optional, if extra validation needed)
```

With:
- 40+ integration tests covering happy path + error scenarios
- ≥90% coverage on controllers + services
- Proper error responses (400, 401, 409, 500)

## Steps

### 1. Create WeightLogService
File: `BE/progress-service/src/services/weightLogService.js`

**Methods:**

#### `createWeightLog(userId, weight, date = null)`
- Normalize date: convert ISO string to Date object (default: today)
- Validate date not in future (throw 400)
- Check duplicate: query WeightLog where userId + date matches
  - If exists: throw 409 with message "Weight entry already exists for this date"
- Get previous day weight: query date = this.date - 1 day
- Create document with trend = current - previous (or 0 if none)
- Return saved document

#### `getWeightHistory(userId, startDate = null, endDate = null, limit = 30)`
- Normalize dates: convert to Date objects
  - startDate: default = 30 days ago
  - endDate: default = today
- Build query: `{ userId, date: { $gte: startDate, $lte: endDate } }`
- Execute: `WeightLog.find(query).sort({ date: -1 }).limit(limit)`
- Return object: `{ data, count, startDate, endDate }`

### 2. Create WeightLogController
File: `BE/progress-service/src/controllers/weightLogController.js`

#### `createWeightLog(req, res, next)`
- Extract: `userId` from `req.user._id` (from JWT middleware)
- Extract: `weight`, `date` from request body
- Validate (see validation section below)
- Call service: `weightLogService.createWeightLog(userId, weight, date)`
- Response (201): JSON object matching api.spec.md#1 response format
- Error handling: catch and call `next(error)` — middleware handles 400/409/500

#### `getWeightHistory(req, res, next)`
- Extract: `userId` from `req.user._id`
- Extract: `startDate`, `endDate`, `limit` from query params
- Validate optional query params (dates must be ISO if provided)
- Call service: `weightLogService.getWeightHistory(userId, startDate, endDate, limit)`
- Response (200): JSON object matching api.spec.md#2 response format
- Error handling: catch and call `next(error)`

### 3. Create Input Validation Middleware/Validator
File: `BE/progress-service/src/middleware/weightLogValidation.js`

**Validation Rules (from rules.spec.md):**
- `weight`: required, number, 30 ≤ x ≤ 200
  - Error message: "Weight must be between 30-200 kg"
- `date`: optional, ISO format if provided (YYYY-MM-DD or full ISO)
  - Error message: "Invalid date format"
- Query params: startDate, endDate, limit must be valid if provided

**Implementation:**
- Simple validator function: `validateWeightInput(weight, date)` → throws 400 if invalid
- Middleware: `weightLogValidationMiddleware` wraps it
- Use in routes before controller

### 4. Create Routes
File: `BE/progress-service/src/routes/weightLog.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const weightLogController = require('../controllers/weightLogController');
const { authenticate } = require('../middleware/auth'); // from auth-service

// Routes
router.post('/weight', authenticate, weightLogController.createWeightLog);
router.get('/weight', authenticate, weightLogController.getWeightHistory);

module.exports = router;
```

### 5. Mount Routes in App
File: `BE/progress-service/src/app.js`

- Import routes: `const weightLogRoutes = require('./routes/weightLog.routes');`
- Mount: `app.use('/progress', weightLogRoutes);`
- Ensure authenticate middleware is available (import from auth-service or local)

### 6. Error Handling Middleware
- Create custom error classes (optional, but recommended):
  - `ValidationError` (400)
  - `DuplicateEntryError` (409)
  - `DatabaseError` (500)
- Global error handler catches all errors and returns proper HTTP status + message

### 7. Write Integration Tests
File: `BE/progress-service/tests/integration/weightLog.test.js`

**Test Suites:**

#### Create Weight Log Tests
- ✅ POST /progress/weight with valid data → 201 with trend calculated
- ✅ POST with default date (today) → 201
- ✅ POST with past date → 201
- ✅ POST with invalid weight (< 30) → 400 "Weight must be between 30-200 kg"
- ✅ POST with invalid weight (> 200) → 400
- ✅ POST with missing weight → 400 "Weight is required"
- ✅ POST with non-numeric weight → 400 "Weight must be a number"
- ✅ POST with invalid date format → 400 "Invalid date format"
- ✅ POST with future date → 400 "Date cannot be in the future"
- ✅ POST duplicate date same user → 409 "Weight entry already exists for this date"
- ✅ POST without auth token → 401 "Unauthorized"
- ✅ Trend calculation: first entry (no previous) → trend = 0
- ✅ Trend calculation: second entry → trend = current - previous
- ✅ Trend calculation: negative trend (weight loss) → shows negative number

#### Get Weight History Tests
- ✅ GET /progress/weight authenticated → 200 with data array
- ✅ GET returns last 30 entries by default
- ✅ GET with startDate filter → returns entries >= startDate
- ✅ GET with endDate filter → returns entries <= endDate
- ✅ GET with both dates → returns date range
- ✅ GET with limit=10 → returns max 10 entries
- ✅ GET response includes count, startDate, endDate
- ✅ GET results sorted descending by date (newest first)
- ✅ GET with no data → 200 with empty data array
- ✅ GET without auth token → 401

#### Database Constraints
- ✅ Verify unique index enforced (duplicate date rejected at DB level)
- ✅ Verify indexes exist (performance optimization)

**Coverage:** ≥90% on controllers + services

## Acceptance Criteria

✅ POST /progress/weight endpoint exists and creates weight log  
✅ POST validates weight 30-200 kg with proper error messages  
✅ POST validates date format (ISO)  
✅ POST prevents future dates  
✅ POST prevents duplicate entries for same userId+date (409 response)  
✅ POST calculates trend correctly (current - previous day)  
✅ POST requires JWT authentication (401 if missing)  
✅ POST returns 201 with full log entry (id, userId, weight, date, trend, createdAt)  
✅ GET /progress/weight endpoint exists and fetches history  
✅ GET accepts startDate, endDate, limit query params  
✅ GET defaults to last 30 days if no params provided  
✅ GET returns sorted descending by date (newest first)  
✅ GET returns object with data, count, startDate, endDate  
✅ GET requires JWT authentication (401 if missing)  
✅ All endpoints implement proper error handling (400, 401, 409, 500)  
✅ Integration tests: ≥40 test cases, ≥90% coverage  
✅ Tests pass: `npm test -- tests/integration/weightLog.test.js`  
✅ `npm run lint` — zero warnings  

## Mapping

- **Spec:** [api.spec.md#1 Create Weight Log](../../spec/features/progress-tracking/api.spec.md)
- **Spec:** [api.spec.md#2 Get Weight History](../../spec/features/progress-tracking/api.spec.md)
- **Rules:** [rules.spec.md#Validation Rules](../../spec/features/progress-tracking/rules.spec.md)
- **Rules:** [rules.spec.md#Authorization](../../spec/features/progress-tracking/rules.spec.md)
- **Rules:** [rules.spec.md#Error Handling](../../spec/features/progress-tracking/rules.spec.md)

## Testing Strategy

**Integration Testing (Supertest + MongoMemoryServer):**
1. Create test database with WeightLog model
2. Mock JWT token with userId
3. Use Supertest to call endpoints
4. Assert response status, body, database state
5. Verify trend calculation with sequential entries

**Example Test:**
```javascript
test('POST /progress/weight calculates trend correctly', async () => {
  const token = 'valid-jwt-token';
  const userId = new ObjectId();
  
  // First entry (no previous)
  const res1 = await supertest(app)
    .post('/progress/weight')
    .set('Authorization', `Bearer ${token}`)
    .send({ weight: 65.0, date: '2026-05-17' });
  expect(res1.status).toBe(201);
  expect(res1.body.trend).toBe(0);
  
  // Second entry (with previous)
  const res2 = await supertest(app)
    .post('/progress/weight')
    .set('Authorization', `Bearer ${token}`)
    .send({ weight: 65.5, date: '2026-05-18' });
  expect(res2.status).toBe(201);
  expect(res2.body.trend).toBe(0.5); // 65.5 - 65.0
});
```

## Dependencies
- ✅ WeightLog model (TASK-030-BE step 1) ✅
- ✅ Express.js (already in progress-service)
- ✅ JWT middleware (import from auth-service or local)
- ✅ MongoMemoryServer for testing
- ✅ Supertest for integration tests

## Estimated Time: 30-35 minutes
