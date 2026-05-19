# TASK-031-BE-Auth-Admin: Admin User Management API

## 📋 Description

Build admin User management APIs in **auth-service**: User list (paginated, filterable) and deactivate (soft delete). All endpoints require Admin role verification.

**Target:** ~30 minutes with TDD approach.

**Service:** auth-service (port 3001)

---

## 🎯 Objectives

1. ✅ Add `isDeleted` + `deletedAt` fields to User model
2. ✅ Add index on `isDeleted` field
3. ✅ Implement User API: GET list (paginated, filterable) + PATCH deactivate (soft delete)
4. ✅ All endpoints require Admin role authentication
5. ✅ Comprehensive integration tests (≥80% coverage)
6. ✅ Cannot deactivate own account (400 error)
7. ✅ Soft delete idempotent (already-deleted returns 200 OK)

---

## 📥 Input (From Spec)

**Related Spec Files:**
- `spec/features/administration/api.spec.md` — All endpoint schemas
- `spec/features/administration/schema.spec.md` — MongoDB models
- `spec/features/administration/rules.spec.md` — Business rules & validation

**Already Implemented:**
- `BE/auth-service/TASK-006` — JWT authenticate & authorize middleware
  - `authenticate()` middleware (verifies JWT from Authorization header)
  - `authorize(allowedRoles)` middleware (checks role in decoded token)
- `BE/auth-service` runs on port 3001, provides `/api/auth/` endpoints

---

## 📤 Output (Deliverables)

### Backend Structure (auth-service)

```
BE/auth-service/
├── src/
│   ├── models/
│   │   └── User.js (UPDATE)           # Add isDeleted + deletedAt + index
│   ├── routes/
│   │   └── admin.routes.js (new)      # Admin user endpoints (GET, PATCH)
│   ├── controllers/
│   │   └── adminController.js (new)   # GET/PATCH handlers
│   ├── services/
│   │   └── adminService.js (new)      # getUserList, deactivateUser
│   ├── middleware/
│   │   └── adminValidation.js (new)   # validateUserDeactivate
│   └── app.js (updated)               # Register admin routes
├── tests/
│   └── integration/
│       └── admin-users.test.js (new)  # ~12 tests
└── ... (rest of auth-service structure)
```

---

## 🧩 Step-by-Step Implementation

### Step 1: Update User Model (5 min)

**File:** `src/models/User.js` (MODIFY EXISTING)

**Add to User schema:**
- `isDeleted` (boolean, default: false, indexed)
- `deletedAt` (Date, optional)

**Add indexes:**
- Index on `isDeleted` field

**Add pre-save hook:**
- If `isDeleted` set to true and `deletedAt` not set, set `deletedAt: Date.now()`

**Notes:**
- Don't remove existing fields (email, password, role, etc.)
- This is a NON-BREAKING change (all existing users have isDeleted=false)
- Existing Mongoose indexes (email) should already be in place

---

### Step 2: Create Admin Service Layer (7 min)

**File:** `src/services/adminService.js`

**User Service Methods:**

1. `getUserList(page, limit, emailFilter, statusFilter)`
   - Filter by `isDeleted` based on statusFilter (active=false, all=both)
   - If emailFilter provided, use case-insensitive partial match on email
   - Sort by `createdAt DESC` (newest first)
   - Pagination: 1-indexed, limit=10 (fixed)
   - Return: `{ users: [...], pagination: { page, limit, total, pages } }`

2. `deactivateUser(userId, adminUserId)`
   - Find user by `_id`
   - Check if `userId !== adminUserId` (cannot deactivate self → throw error)
   - Set `isDeleted: true`, `deletedAt: Date.now()`
   - Save to database
   - Return updated user
   - Idempotent: if already deleted, return success (200 OK)

---

### Step 3: Create Admin Controller (6 min)

**File:** `src/controllers/adminController.js`

**User Controllers:**

1. `getUserList(req, res, next)`
   - Extract query: `page` (default=1), `limit` (default=10), `email` (optional), `status` (default=active)
   - Call `adminService.getUserList(page, limit, email, status)`
   - Return 200 with `{ data: [...], pagination: {...} }`
   - Catch errors: 400, 500

2. `deactivateUser(req, res, next)`
   - Extract: `userId` from params, `action` from body
   - Validate: check `body.action === "deactivate"` (else return 400)
   - Call `adminService.deactivateUser(userId, req.user._id)` (req.user from JWT token)
   - Handle "cannot deactivate self" error → return 400
   - Return 200 with `{ message: "User deactivated", user: {...} }`
   - Catch errors: 404 (user not found), 500

---

### Step 4: Create Validation Middleware (3 min)

**File:** `src/middleware/adminValidation.js`

**Validators:**

1. `validateUserDeactivate(req, res, next)`
   - Check `body.action` exists
   - Check `body.action === "deactivate"` (only this action allowed)
   - Return 400 if invalid with message: "Invalid action. Only 'deactivate' is allowed"
   - If valid, call `next()`

---

### Step 5: Create Admin Routes (2 min)

**File:** `src/routes/admin.routes.js`

```javascript
import express from 'express'
import { authenticate, authorize } from '../middleware/index.js'
import { validateUserDeactivate } from '../middleware/adminValidation.js'
import adminController from '../controllers/adminController.js'

const router = express.Router()

// User management endpoints
router.get(
  '/users',
  authenticate,
  authorize(['Admin']),
  adminController.getUserList
)

router.patch(
  '/users/:userId',
  authenticate,
  authorize(['Admin']),
  validateUserDeactivate,
  adminController.deactivateUser
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

**File:** `tests/integration/admin-users.test.js`

**Test Suite: Admin Users API**

```javascript
describe('Admin Users API', () => {
  // GET /api/admin/users
  describe('GET /api/admin/users', () => {
    it('should return paginated list of active users (200)', () => {...})
    it('should filter by email (case-insensitive, partial match)', () => {...})
    it('should include deleted users when status=all', () => {...})
    it('should return 401 without token', () => {...})
    it('should return 403 with non-admin token', () => {...})
    it('should return correct pagination metadata', () => {...})
  })

  // PATCH /api/admin/users/:userId
  describe('PATCH /api/admin/users/:userId', () => {
    it('should deactivate user (isDeleted: true, 200)', () => {...})
    it('should return 400 with invalid action', () => {...})
    it('should return 400 when deactivating own account', () => {...})
    it('should be idempotent (already-deleted returns 200)', () => {...})
    it('should return 404 for non-existent user', () => {...})
    it('should return 401 without token', () => {...})
    it('should return 403 with non-admin token', () => {...})
  })
})
```

**Total: ~12 tests, target ≥80% coverage**

---

## ✅ Acceptance Criteria

- [ ] User model updated with `isDeleted` + `deletedAt` + index
- [ ] Admin service: 2 methods (getUserList, deactivateUser) implemented
- [ ] Admin controller: 2 handlers (GET/PATCH) implemented
- [ ] Admin validation: 1 validator (validateUserDeactivate) implemented
- [ ] Admin routes: 2 endpoints with auth/authz middleware
- [ ] App.js updated with admin routes
- [ ] Integration tests: ~12 test cases passing
- [ ] Test coverage: ≥80% statements and branches
- [ ] `npm test` passes all admin tests
- [ ] `npm run lint` zero warnings
- [ ] Docker build succeeds
- [ ] Soft-delete behavior working (isDeleted filtering, idempotent ops)
- [ ] Cannot deactivate own account (400 error)
- [ ] Already-deactivated user returns 200 OK (idempotent)

---

## 🗂️ Mapping to Spec

| Spec Section | Implementation |
|---|---|
| `api.spec.md` GET /api/admin/users | Step 1 User model, Step 2 Service getUserList, Step 3 Controller, Step 5 Routes |
| `api.spec.md` PATCH /api/admin/users/:id | Step 1 User model, Step 2 Service deactivateUser, Step 3 Controller, Step 4 Validation, Step 5 Routes |
| `schema.spec.md` User Model (isDeleted) | Step 1 User.js |
| `schema.spec.md` MongoDB Indexes | Step 1 User.js indexes |
| `schema.spec.md` adminStore (users state) | Step 2 Service exports for Frontend to consume |
| `rules.spec.md` Auth Rules | Step 5 Routes with authenticate + authorize middleware |
| `rules.spec.md` User Management Rules | Step 2 Service deactivateUser logic |
| `rules.spec.md` Test Cases (User API) | Step 6 Integration tests |

---

## 💡 Tips

- Use existing `authenticate` and `authorize` middleware from TASK-006
- Reuse User model from auth-service (add `isDeleted` field if not exists)
- Use MongoMemoryServer in tests like prior tasks (TASK-002, TASK-024, etc.)
- Validate input early in middleware, not in controller
- Keep service methods pure (no HTTP knowledge)
- Soft delete: set `isDeleted: true` + `deletedAt: Date.now()`
- Always filter `isDeleted: false` in GET responses by default
- Test idempotent operations (already-deleted returns 200, not 404)

---

## 📝 Notes

- **No hard delete:** DELETE endpoint only does soft delete. If request includes `hardDelete: true`, return 400.
- **Idempotent deactivate:** If user already deleted, return 200 OK (not error)
- **Idempotent delete:** If exercise already deleted, return 200 OK (not error)
- **Cannot deactivate self:** Admin trying to deactivate own account → 400 Bad Request
- **Pagination:** Fixed limit=10, 1-indexed pages
- **Soft delete filtering:** Always exclude `isDeleted: true` from GET responses by default, unless `status=all` requested

---

## 🚀 Ready for Implementation?

Yes! Run the TDD approach:
1. Write test file (tests/integration/admin-users.test.js)
2. Write failing test cases
3. Implement code to make tests pass
4. Repeat for exercises
5. Run full suite: `npm test`
6. Check coverage: `npm test -- --coverage`
