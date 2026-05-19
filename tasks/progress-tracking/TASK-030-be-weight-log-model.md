# TASK-030-BE: Weight Log Model & Validation

## Title
Create Mongoose Weight Log Model with validation & indexes

## Description
Implement the `WeightLog` Mongoose model for progress-service with:
- Field validation (weight 30-200kg, date ISO format)
- Unique index on userId+date (prevent duplicates)
- Sorting index on userId+date descending
- Pre-save hook to calculate trend (difference from previous day)

## Input
- Spec: [api.spec.md#3](../../spec/features/progress-tracking/api.spec.md) — Database Schema
- Spec: [rules.spec.md#BR-1,BR-2](../../spec/features/progress-tracking/rules.spec.md) — Business Rules

## Output
```
BE/progress-service/src/models/WeightLog.js
```

With:
- Mongoose schema definition
- Field validators (weight range, date format, required checks)
- Unique compound index (userId, date)
- Sorting index (userId, date DESC)
- Pre-save hook for trend calculation
- 100% test coverage in tests/integration/models.test.js

## Steps

### 1. Create WeightLog Model File
- File: `BE/progress-service/src/models/WeightLog.js`
- Import Mongoose, Schema
- Define schema with fields:
  - `userId` (ObjectId, ref: 'User', required)
  - `weight` (Number, min: 30, max: 200, required)
  - `date` (Date, required, indexed)
  - `trend` (Number, default: 0, stored for performance)
  - `notes` (String, maxlength: 200, optional)
  - Timestamps (createdAt, updatedAt)

### 2. Implement Validators
- Weight validation: 30 ≤ weight ≤ 200
- Date validation: Must be ISO format (YYYY-MM-DD or full ISO)
- Date validation: No future dates
- All validators with clear error messages (match rules.spec.md)

### 3. Implement Indexes
- Unique index on `{ userId: 1, date: 1 }` — ensure one entry per user per day
- Regular index on `{ userId: 1, date: -1 }` — optimize GET /weight queries

### 4. Implement Pre-Save Hook
- Before save: calculate trend
  - Query previous day's weight (date = this.date - 1 day)
  - If found: `trend = this.weight - previousWeight`
  - If not found: `trend = 0`
- Handle edge case: creation date vs business date (use date field, not createdAt)

### 5. Export Model
- Export Mongoose model: `module.exports = mongoose.model('WeightLog', weightLogSchema);`

### 6. Write Integration Tests
- File: `BE/progress-service/tests/integration/models.test.js`
- Test suites:
  - ✅ Schema creation & required fields validation
  - ✅ Weight validation (30-200 range)
  - ✅ Date validation (ISO format, no future dates)
  - ✅ Unique index enforcement (duplicate date rejection)
  - ✅ Trend calculation (current - previous day)
  - ✅ Trend = 0 when no previous entry
  - ✅ Timestamps (createdAt, updatedAt)
  - ✅ Optional notes field
- Coverage: ≥95% (model logic)
- Database: MongoMemoryServer (isolated, no external MongoDB)
- Assertions:
  - Document creation succeeds with valid data
  - Validators reject invalid weight/date
  - Unique index prevents duplicate userId+date
  - Trend calculation is accurate
  - Timestamps are auto-set

## Acceptance Criteria

✅ Model file exists at `src/models/WeightLog.js`  
✅ All fields match api.spec.md#3 (weight, date, trend, notes, userId)  
✅ Weight validation: 30 ≤ weight ≤ 200 with error message  
✅ Date validation: ISO format, no future dates  
✅ Unique index on (userId, date) enforced  
✅ Sorting index on (userId, date DESC) created  
✅ Pre-save hook calculates trend correctly  
✅ Trend = 0 when no previous entry exists  
✅ Integration tests: ≥8 test suites, ≥95% coverage  
✅ Tests pass: `npm test -- tests/integration/models.test.js`  
✅ `npm run lint` — zero warnings  

## Mapping

- **Spec:** [api.spec.md#3 Database Schema](../../spec/features/progress-tracking/api.spec.md)
- **Spec:** [schema.spec.md#Backend Models](../../spec/features/progress-tracking/schema.spec.md)
- **Rules:** [rules.spec.md#BR-1 Weight Entry Constraints](../../spec/features/progress-tracking/rules.spec.md)
- **Rules:** [rules.spec.md#BR-2 Trend Calculation](../../spec/features/progress-tracking/rules.spec.md)

## Testing Strategy

**TDD Approach:**
1. Write tests first (assert model behavior)
2. Implement model to pass tests
3. Run `npm test` — all green
4. Coverage report: `npm test -- --coverage`

**Test Files:**
- `tests/integration/models.test.js` — Mongoose model validation & indexes
- Use MongoMemoryServer for isolated database
- Mock userId with ObjectId()

## Dependencies
- ✅ Mongoose (already in package.json)
- ✅ MongoMemoryServer (already for testing)
- ✅ progress-service scaffold (TASK-021 ✅)

## Estimated Time: 15-20 minutes
