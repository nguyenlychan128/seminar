# TASK-028: Backend — Workout Execution API (Complete)

**Status:** Pending  
**Priority:** High  
**Estimated effort:** 20 hours

---

## 📝 Description

Implement the complete backend for workout execution in workout-service:
1. MongoDB schema (WorkoutSession model)
2. Service layer (business logic, validation, denormalization)
3. HTTP endpoint (POST /api/workouts/sessions)
4. Comprehensive tests (unit + integration, >80% coverage)

---

## 📥 Input / References

**Spec Files:**
- `spec/features/workout-execution/feature.spec.md`
- `spec/features/workout-execution/api.spec.md`
- `spec/features/workout-execution/schema.spec.md`
- `spec/features/workout-execution/rules.spec.md`

---

## 📤 Output Files

```
BE/workout-service/src/
  ├── models/WorkoutSession.js          (schema + pre-save hooks)
  ├── services/workoutSessionService.js (business logic)
  ├── controllers/workoutSessionController.js
  ├── routes/workoutSessionRoutes.js    (or extend existing)
  └── tests/
      ├── unit/models/WorkoutSession.test.js
      ├── unit/services/workoutSessionService.test.js
      └── integration/api/workoutSession.e2e.test.js
```

---

## 🎯 Acceptance Criteria

### 1. WorkoutSession Model (schema.spec.md)

- [x] **SetResultSchema**: setNumber, actualReps (0-100), weight (0-500), rpe (1-10, optional), notes (max 200)
- [x] **ExerciseSessionSchema**: exerciseId, name, muscleGroup, status (completed/skipped), plannedSets, plannedReps, sets array, notes (max 300)
- [x] **WorkoutSession schema**: userId, planId, weekNumber, dayNumber, sessionDate, exercises, totalDuration (0-300 optional), mood (enum optional), notes (max 500 optional), completedAt, timestamps
- [x] **Indexes**:
  - Unique: `{ userId, planId, weekNumber, dayNumber, sessionDate }`
  - Query: `{ userId }`, `{ sessionDate }`
- [x] **Pre-save hooks**:
  - Validate sessionDate not in future (BR-02)
  - Validate completed exercises have >= 1 set (BR-03)
  - Validate actualReps (0-100) and weight (0-500) (BR-04)
  - Set completedAt timestamp

### 2. WorkoutSessionService (rules.spec.md)

**Input Validation:**
- [x] sessionDate: required, not future, YYYY-MM-DD format
- [x] planId, weekNumber, dayNumber: required, positive/ObjectId
- [x] exercises: required, non-empty array
- [x] totalDuration: 0-300 (if provided)
- [x] mood: enum ["great", "good", "ok", "tired"] (if provided)
- [x] notes: max 500 chars (if provided)

**Exercise-level:**
- [x] exerciseId: valid ObjectId
- [x] status: "completed" or "skipped"
- [x] plannedSets, plannedReps: required
- [x] sets: required array; if completed, must have >= 1 set
- [x] notes: max 300 chars (if provided)

**Set-level:**
- [x] setNumber: positive integer
- [x] actualReps: 0-100
- [x] weight: 0-500
- [x] rpe: 1-10 (if provided)
- [x] notes: max 200 chars (if provided)

**Business Logic:**
- [x] Check duplicate: same (userId, planId, weekNumber, dayNumber, sessionDate) → 409
- [x] Denormalize: extract exercise name, muscleGroup from request
- [x] userId from parameter only (SR-01)
- [x] Return saved session with _id and timestamps

### 3. POST /api/workouts/sessions Endpoint (api.spec.md)

- [x] Route: `POST /api/workouts/sessions`
- [x] Auth: Requires JWT (Bearer token)
- [x] Extract userId from JWT (not request body)
- [x] Call service.createSession(userId, sessionData)

**Responses:**
- [x] **201**: `{ success: true, data: { sessionId, userId, ...(all fields) } }`
- [x] **400**: `{ success: false, message: "Validation failed: ..." }`
- [x] **401**: `{ success: false, message: "Unauthorized - invalid or missing token" }`
- [x] **409**: `{ success: false, message: "Duplicate session - already logged for this date/plan/week/day" }`
- [x] **500**: `{ success: false, message: "Internal server error" }`

### 4. Tests (Jest + Supertest + MongoMemoryServer)

**Unit Tests: Model**
- [x] Schema validation (all fields, ranges, enums)
- [x] Unique index enforcement
- [x] Pre-save hooks (dates, validations)

**Unit Tests: Service**
- [x] All validation rules (input, exercise, set levels)
- [x] Denormalization logic
- [x] Duplicate check
- [x] Error handling (ValidationError, DuplicateSessionError, DatabaseError)

**Integration Tests: API**
- [x] 201 success with valid data
- [x] 400 validation errors (all scenarios)
- [x] 401 unauthorized (missing/invalid token)
- [x] 409 duplicate session
- [x] 500 server error
- [x] Database persistence verification

**Coverage: >= 80% for business logic**

---

## 🧪 Testing Strategy (TDD)

1. **Before implementation:** Write tests based on this spec
2. **During implementation:** Run tests, fix failures
3. **After:** Verify >= 80% coverage, all tests green

Use:
- Jest for test runner
- Supertest for HTTP testing
- MongoMemoryServer for database (no external DB needed)
- Mock JWT tokens for auth tests

---

## 🔗 Dependencies

- Blocks: TASK-029 (FE component) — cannot start until API exists
- Parallel: None

---

## 📋 Implementation Notes

- Keep validation logic in service (easier to test and reuse)
- Use pre-save hooks for schema-level validation
- Throw specific error types (ValidationError, DuplicateSessionError)
- userId NEVER from request body (security)
- Denormalization: store exercise name/muscleGroup snapshot
- No inter-service calls — exercise data in request body
- Response format must match api.spec.md exactly

