# Business Rules & Validation: Administration

## 🔐 Access Control Rules

### Role-Based Access
```
All admin endpoints require Admin role:

auth-service (port 3001):
  - GET /api/admin/users → 403 if non-admin
  - PATCH /api/admin/users/:id → 403 if non-admin

workout-service (port 3003):
  - GET /api/admin/exercises → 403 if non-admin
  - POST /api/admin/exercises → 403 if non-admin
  - PATCH /api/admin/exercises/:id → 403 if non-admin
  - DELETE /api/admin/exercises/:id → 403 if non-admin
```

### Token Validation
```
- JWT token required in header: Authorization: Bearer <token>
- Token must contain role: "Admin"
- Expired token → 401 Unauthorized
- Invalid/missing token → 401 Unauthorized

NOTE: JWT auth middleware is exported from auth-service
      and imported by workout-service for code reuse
```

---

## 👥 User Management Rules

### Deactivation (Soft Delete)
```
- Only "deactivate" action allowed on PATCH /api/admin/users/:id
- Sets isDeleted: true, deletedAt: now
- User data persists (not removed from DB)
- Deactivated users do NOT appear in GET /api/admin/users (default status=active)
- Cannot deactivate own account (return 400 Bad Request)
- Cannot deactivate already-deactivated user (idempotent, return 200 OK)
```

### User Filters
```
- email filter: case-insensitive, partial match
- status filter:
  - "active" (default): isDeleted=false only
  - "all": both active and deactivated
- Pagination: page ≥ 1, limit = 10 (fixed)
```

---

## 🏋️ Exercise Management Rules

### Exercise Creation
```
- Required fields: name, muscleGroup, sets, reps, restTime
- Validation:
  - name: 1-100 characters, unique (case-insensitive)
  - muscleGroup: enum [chest, back, legs, shoulders, arms, core]
  - sets: 1-10
  - reps: string format "X-Y" where X, Y are numbers (e.g., "8-10")
  - restTime: 30-300 seconds
- Return 400 Bad Request if validation fails
```

### Exercise Update
```
- Any field can be updated
- Same validation rules apply
- Can update soft-deleted exercise (optional: allow/deny?)
```

### Exercise Deletion (Soft Delete)
```
- Only via DELETE endpoint (no hard delete)
- Sets isDeleted: true, deletedAt: now
- Exercise data persists
- Soft-deleted exercises NOT returned in GET /api/admin/exercises
- Cannot delete already-deleted exercise (idempotent, return 200 OK)
```

### Exercise Search & Filters
```
- search: case-insensitive, partial match on name & description
- muscleGroup: exact match filter (optional)
- Pagination: page ≥ 1, limit = 10 (fixed)
- Only active exercises (isDeleted=false) in results
```

---

## ⚠️ CRITICAL: No Hard Delete Policy

### Backend Enforcement
```
- DELETE endpoint ALWAYS uses soft delete (sets isDeleted flag)
- If explicit DELETE request includes "hardDelete: true", return 400 Bad Request
- Database deletion scripts prohibited in admin flow
- Audit: log all soft deletes with admin ID, timestamp
```

### Data Integrity
```
- Soft-deleted data:
  - Not accessible via API (hidden by default)
  - Preserved for analytics, audit trail
  - Can be restored via admin (manual DB update only, not exposed in API)
```

---

## 🎯 Default Sorting

**User List:**
- Default: createdAt DESC (newest first)

**Exercise List:**
- Default: name ASC (A-Z)

---

## 📋 Error Handling

### Standard Response Format
```json
{
  "success": false,
  "message": "User not found",
  "code": "NOT_FOUND"
}
```

### Common Errors
```
400 Bad Request
- Missing required fields
- Invalid enum values
- Hard delete attempt
- Cannot deactivate own account

401 Unauthorized
- Missing/expired JWT token

403 Forbidden
- Non-admin user accessing admin endpoint

404 Not Found
- User/exercise ID not found

409 Conflict
- Exercise name already exists (unique constraint)
```

---

## 🧪 Test Cases (TDD)

### TASK-031-BE-Auth-Admin: User API (auth-service)
```
- ✓ GET /api/admin/users (200, paginated)
- ✓ GET /api/admin/users with email filter (200, filtered)
- ✓ GET /api/admin/users with status=all (200, includes deleted)
- ✓ PATCH /api/admin/users/:id deactivate (200, isDeleted=true)
- ✓ PATCH /api/admin/users/:id (401, no token)
- ✓ PATCH /api/admin/users/:id (403, non-admin)
- ✓ Cannot deactivate own account (400)
- ✓ Deactivate already-deactivated user (200, idempotent)
- ✓ GET excludes soft-deleted by default (status=active)
- ✓ Deactivated user not returned in list (unless status=all)

Total: ~12 tests, ≥80% coverage
```

### TASK-031-BE-Workout-Admin: Exercise API (workout-service)
```
- ✓ GET /api/admin/exercises (200, paginated)
- ✓ GET /api/admin/exercises with search (200, filtered)
- ✓ GET /api/admin/exercises with muscleGroup (200, filtered)
- ✓ GET excludes soft-deleted (status=active default)
- ✓ POST /api/admin/exercises (201, exercise created)
- ✓ POST with missing fields (400)
- ✓ POST with duplicate name (409)
- ✓ PATCH /api/admin/exercises/:id (200, updated)
- ✓ DELETE /api/admin/exercises/:id (200, soft deleted)
- ✓ DELETE already-deleted exercise (200, idempotent)
- ✓ Auth: 401 (no token), 403 (non-admin)
- ✓ Validation: sets, reps format, restTime range

Total: ~15 tests, ≥80% coverage
```

### TASK-031-FE-Admin-Dashboard: UI Components
```
Admin Layout:
- ✓ Non-admin redirects to login
- ✓ Sidebar nav links work (Users, Exercises)
- ✓ Current page highlighted

Users Page:
- ✓ Fetches from auth-service /api/admin/users
- ✓ Displays users table with pagination
- ✓ Email filter works (updates filters, triggers refetch)
- ✓ Status filter (active/all) works
- ✓ Deactivate button opens modal
- ✓ Modal confirms and calls deactivateUser
- ✓ Modal closes on success
- ✓ Error toast on failure

Exercises Page:
- ✓ Fetches from workout-service /api/admin/exercises
- ✓ Displays exercises table with pagination
- ✓ Search filter works
- ✓ MuscleGroup filter works
- ✓ Add button opens form in "add" mode
- ✓ Edit button opens form in "edit" mode with prefilled data
- ✓ Form validates on blur (required fields, ranges)
- ✓ Submit creates/updates exercise
- ✓ Delete button opens confirmation modal
- ✓ Delete confirms and calls deleteExercise
- ✓ Error toast on failure

Total: ~25+ tests, ≥80% coverage
```
