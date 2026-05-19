# TASK-031-BE-Workout-Admin: Admin Exercise Management API

## 📋 Description

Build admin Exercise management APIs in **workout-service**: Exercise list (paginated, searchable), CRUD operations, and soft delete. All endpoints require Admin role verification.

**Target:** ~30 minutes with TDD approach.

**Service:** workout-service (port 3003)

---

## 🎯 Objectives

1. ✅ Add `isDeleted` + `deletedAt` fields to Exercise model
2. ✅ Add index on `isDeleted` field
3. ✅ Implement Exercise API: GET list, POST create, PATCH update, DELETE soft-delete
4. ✅ All endpoints require Admin role authentication
5. ✅ Comprehensive integration tests (≥80% coverage)
6. ✅ No hard delete allowed (400 error if attempted)
7. ✅ Soft delete idempotent (already-deleted returns 200 OK)

---

## 📥 Input (From Spec)

**Related Spec Files:**
- `spec/features/administration/api.spec.md` — All endpoint schemas
- `spec/features/administration/schema.spec.md` — MongoDB models
- `spec/features/administration/rules.spec.md` — Business rules & validation

**Already Implemented:**
- `BE/workout-service/TASK-022` — Exercise model exists
- `BE/auth-service/TASK-006` — JWT authenticate & authorize middleware (exported for reuse)
- `BE/workout-service` runs on port 3003, provides `/api/exercises` endpoints

---

## 📤 Output (Deliverables)

### Backend Structure (workout-service)

```
BE/workout-service/
├── src/
│   ├── models/
│   │   └── Exercise.js (UPDATE)       # Add isDeleted + deletedAt + index
│   ├── routes/
│   │   └── admin.routes.js (new)      # Admin exercise endpoints (GET, POST, PATCH, DELETE)
│   ├── controllers/
│   │   └── adminController.js (new)   # GET/POST/PATCH/DELETE handlers
│   ├── services/
│   │   └── adminService.js (new)      # getExerciseList, createExercise, updateExercise, deleteExercise
│   ├── middleware/
│   │   └── adminValidation.js (new)   # validateExerciseCreate, validateExerciseUpdate
│   └── app.js (updated)               # Register admin routes, import auth middleware from auth-service
├── tests/
│   └── integration/
│       └── admin-exercises.test.js (new)  # ~15 tests
└── ... (rest of workout-service structure)
```

---

## 🧩 Step-by-Step Implementation

### Step 1: Update Exercise Model (5 min)

**File:** `src/models/Exercise.js` (MODIFY EXISTING)

**Add to Exercise schema:**
- `isDeleted` (boolean, default: false, indexed)
- `deletedAt` (Date, optional)

**Add indexes:**
- Index on `isDeleted` field

**Add pre-save hook:**
- If `isDeleted` set to true and `deletedAt` not set, set `deletedAt: Date.now()`

**Notes:**
- Don't remove existing fields (name, muscleGroup, sets, reps, restTime, etc.)
- This is a NON-BREAKING change (all existing exercises have isDeleted=false)
- Existing Mongoose indexes (name, muscleGroup) should already be in place

---

### Step 2: Create Admin Service Layer (8 min)

**File:** `src/services/adminService.js`

**Exercise Service Methods:**

1. `getExerciseList(page, limit, searchFilter, muscleGroupFilter)`
   - Filter `isDeleted: false` (only active exercises)
   - If search provided, partial match on `name` + `description` (case-insensitive)
   - If muscleGroup provided, exact match on muscleGroup
   - Sort by `name ASC` (A-Z alphabetical)
   - Pagination: 1-indexed, limit=10 (fixed)
   - Return: `{ exercises: [...], pagination: { page, limit, total, pages } }`

2. `createExercise(data)`
   - Input: name, description, muscleGroup, sets, reps, restTime, difficulty (optional)
   - Validate required: name, muscleGroup, sets, reps, restTime
   - Validate types and ranges:
     - name: string 1-100 chars
     - muscleGroup: enum [chest, back, legs, shoulders, arms, core]
     - sets: number 1-10
     - reps: string format "X-Y" (regex: /^\d+-\d+$/)
     - restTime: number 30-300 (seconds)
   - Check name uniqueness (case-insensitive) → return 409 if duplicate
   - Save to database
   - Return created exercise
   - Throw errors: 400 (validation), 409 (duplicate)

3. `updateExercise(exerciseId, data)`
   - Find exercise by `_id`
   - Update any fields that are provided (partial update)
   - Validate types and ranges for updated fields (same as create)
   - Check name uniqueness on update (if name field changed)
   - Save to database
   - Return updated exercise
   - Throw errors: 404 (not found), 400 (validation), 409 (duplicate name)

4. `deleteExercise(exerciseId)`
   - Find exercise by `_id`
   - Set `isDeleted: true`, `deletedAt: Date.now()`
   - Save to database
   - Return updated exercise
   - Idempotent: if already deleted, return success (200 OK)
   - Throw errors: 404 (not found)

---

### Step 3: Create Admin Controller (7 min)

**File:** `src/controllers/adminController.js`

**Exercise Controllers:**

1. `getExerciseList(req, res, next)`
   - Extract query: `page` (default=1), `limit` (default=10), `search` (optional), `muscleGroup` (optional)
   - Call `adminService.getExerciseList(page, limit, search, muscleGroup)`
   - Return 200 with `{ data: [...], pagination: {...} }`
   - Catch errors: 400, 500

2. `createExercise(req, res, next)`
   - Extract body: name, description, muscleGroup, sets, reps, restTime, difficulty
   - Call `adminService.createExercise(body)`
   - Return 201 with `{ message: "Exercise created", exercise: {...} }`
   - Handle 400 (validation), 409 (duplicate name)

3. `updateExercise(req, res, next)`
   - Extract: `exerciseId` from params, body data (partial update)
   - Call `adminService.updateExercise(exerciseId, body)`
   - Return 200 with `{ message: "Exercise updated", exercise: {...} }`
   - Handle 404 (not found), 400 (validation), 409 (duplicate name)

4. `deleteExercise(req, res, next)`
   - Extract: `exerciseId` from params
   - Call `adminService.deleteExercise(exerciseId)`
   - Return 200 with `{ message: "Exercise deleted", exercise: { _id, isDeleted: true } }`
   - Handle 404 (not found)

---

### Step 4: Create Validation Middleware (4 min)

**File:** `src/middleware/adminValidation.js`

**Validators:**

1. `validateExerciseCreate(req, res, next)`
   - Check required fields: name, muscleGroup, sets, reps, restTime
   - Validate types and ranges
   - Return 400 if validation fails
   - If valid, call `next()`

2. `validateExerciseUpdate(req, res, next)`
   - Same as create but all fields optional
   - Only validate fields that are present in body
   - Return 400 if validation fails
   - If valid, call `next()`

---

### Step 5: Create Admin Routes (3 min)

**File:** `src/routes/admin.routes.js`

```javascript
import express from 'express'
import { authenticate, authorize } from '../../../auth-service/src/middleware/index.js' // Reuse from auth-service
import { validateExerciseCreate, validateExerciseUpdate } from '../middleware/adminValidation.js'
import adminController from '../controllers/adminController.js'

const router = express.Router()

// Exercise management endpoints
router.get(
  '/exercises',
  authenticate,
  authorize(['Admin']),
  adminController.getExerciseList
)

router.post(
  '/exercises',
  authenticate,
  authorize(['Admin']),
  validateExerciseCreate,
  adminController.createExercise
)

router.patch(
  '/exercises/:exerciseId',
  authenticate,
  authorize(['Admin']),
  validateExerciseUpdate,
  adminController.updateExercise
)

router.delete(
  '/exercises/:exerciseId',
  authenticate,
  authorize(['Admin']),
  adminController.deleteExercise
)

export default router
```

**Update `src/app.js`:**
```javascript
import adminRoutes from './routes/admin.routes.js'

// ... other routes ...
app.use('/api/admin', adminRoutes)
```

---

### Step 6: Write Integration Tests (5 min)

**File:** `tests/integration/admin-exercises.test.js`

**Test Suite: Admin Exercises API**

```javascript
describe('Admin Exercises API', () => {
  // GET /api/admin/exercises
  describe('GET /api/admin/exercises', () => {
    it('should return paginated list of active exercises (200)', () => {...})
    it('should filter by search (name + description, case-insensitive)', () => {...})
    it('should filter by muscleGroup', () => {...})
    it('should exclude soft-deleted exercises', () => {...})
    it('should return 401 without token', () => {...})
    it('should return 403 with non-admin token', () => {...})
  })

  // POST /api/admin/exercises
  describe('POST /api/admin/exercises', () => {
    it('should create new exercise (201)', () => {...})
    it('should return 400 with missing required fields', () => {...})
    it('should return 409 with duplicate name (case-insensitive)', () => {...})
    it('should return 400 with invalid sets (not 1-10)', () => {...})
    it('should return 400 with invalid reps format (not "X-Y")', () => {...})
    it('should return 400 with invalid restTime (not 30-300)', () => {...})
    it('should return 401 without token', () => {...})
    it('should return 403 with non-admin token', () => {...})
  })

  // PATCH /api/admin/exercises/:exerciseId
  describe('PATCH /api/admin/exercises/:exerciseId', () => {
    it('should update single field (200)', () => {...})
    it('should update multiple fields (200)', () => {...})
    it('should return 400 with validation errors', () => {...})
    it('should return 404 for non-existent exercise', () => {...})
    it('should return 409 with duplicate name on update', () => {...})
    it('should return 401 without token', () => {...})
    it('should return 403 with non-admin token', () => {...})
  })

  // DELETE /api/admin/exercises/:exerciseId
  describe('DELETE /api/admin/exercises/:exerciseId', () => {
    it('should soft-delete exercise (isDeleted: true, 200)', () => {...})
    it('should be idempotent (already-deleted returns 200)', () => {...})
    it('should return 404 for non-existent exercise', () => {...})
    it('should return 401 without token', () => {...})
    it('should return 403 with non-admin token', () => {...})
  })
})
```

**Total: ~15 tests, target ≥80% coverage**

---

## ✅ Acceptance Criteria

- [ ] Exercise model updated with `isDeleted` + `deletedAt` + index
- [ ] Admin service: 4 methods (getExerciseList, createExercise, updateExercise, deleteExercise) implemented
- [ ] Admin controller: 4 handlers (GET/POST/PATCH/DELETE) implemented
- [ ] Admin validation: 2 validators (validateExerciseCreate, validateExerciseUpdate) implemented
- [ ] Admin routes: 4 endpoints with auth/authz middleware
- [ ] App.js updated with admin routes
- [ ] Import authenticate/authorize from auth-service (reuse middleware)
- [ ] Integration tests: ~15 test cases passing
- [ ] Test coverage: ≥80% statements and branches
- [ ] `npm test` passes all admin tests
- [ ] `npm run lint` zero warnings
- [ ] Docker build succeeds
- [ ] Soft-delete behavior working (isDeleted filtering, idempotent ops)
- [ ] Cannot create duplicate exercise names (409)
- [ ] Already-deleted exercise returns 200 OK (idempotent)

---

## 🗂️ Mapping to Spec

| Spec Section | Implementation |
|---|---|
| `api.spec.md` GET /api/admin/exercises | Step 1 Exercise model, Step 2 Service getExerciseList, Step 3 Controller, Step 5 Routes |
| `api.spec.md` POST /api/admin/exercises | Step 1 Exercise model, Step 2 Service createExercise, Step 3 Controller, Step 4 Validation, Step 5 Routes |
| `api.spec.md` PATCH /api/admin/exercises/:id | Step 1 Exercise model, Step 2 Service updateExercise, Step 3 Controller, Step 4 Validation, Step 5 Routes |
| `api.spec.md` DELETE /api/admin/exercises/:id | Step 1 Exercise model, Step 2 Service deleteExercise, Step 3 Controller, Step 5 Routes |
| `schema.spec.md` Exercise Model (isDeleted) | Step 1 Exercise.js |
| `schema.spec.md` MongoDB Indexes | Step 1 Exercise.js indexes |
| `schema.spec.md` adminStore (exercises state) | Step 2 Service exports for Frontend to consume |
| `rules.spec.md` Auth Rules | Step 5 Routes with authenticate + authorize middleware (imported from auth-service) |
| `rules.spec.md` Exercise Management Rules | Step 2 Service validation logic |
| `rules.spec.md` Test Cases (Exercise API) | Step 6 Integration tests |

---

## 💡 Tips

- **Reuse auth middleware:** Import `authenticate` and `authorize` from auth-service (TASK-006)
  - Path: `BE/auth-service/src/middleware/` exports these
  - Don't duplicate code, import and use as-is
- Use MongoMemoryServer in tests like prior tasks (TASK-022, TASK-024, etc.)
- Validate input early in middleware, not in controller
- Keep service methods pure (no HTTP knowledge)
- Soft delete: set `isDeleted: true` + `deletedAt: Date.now()`
- Always filter `isDeleted: false` in GET responses by default
- Test idempotent operations (already-deleted returns 200, not 404)
- Test duplicate exercise names (case-insensitive uniqueness)

---

## 📝 Notes

- **No hard delete:** DELETE endpoint only does soft delete.
- **Idempotent delete:** If exercise already deleted, return 200 OK (not error)
- **Pagination:** Fixed limit=10, 1-indexed pages
- **Soft delete filtering:** Always exclude `isDeleted: true` from GET responses by default
- **Search:** Partial match on both `name` and `description` fields, case-insensitive
- **Uniqueness:** Exercise names must be unique (case-insensitive) → return 409 if duplicate

---

## 🚀 Ready for Implementation?

Yes! Run the TDD approach:
1. Write test file (tests/integration/admin-exercises.test.js)
2. Write failing test cases
3. Implement code to make tests pass
4. Run full suite: `npm test`
5. Check coverage: `npm test -- --coverage`
