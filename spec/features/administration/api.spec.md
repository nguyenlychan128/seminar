# API Spec: Administration

## 📍 API Routing (via Nginx Gateway)

| Endpoint | Service | Port |
|---|---|---|
| `/api/admin/users` | auth-service | 3001 |
| `/api/admin/exercises` | workout-service | 3003 |

All requests go through **Nginx gateway** at `http://localhost/` (port 80)

---

## 🔐 Authentication
All endpoints require:
- Header: `Authorization: Bearer <jwt_token>`
- Token must have `role: "Admin"`
- Return `401 Unauthorized` if missing or invalid
- Return `403 Forbidden` if role is not Admin

---

## 👥 User Management API

### GET /api/admin/users
**Get admin user list (paginated)**

**Query Parameters:**
```
page=1&limit=10&email=<search_string>&status=active|all
```

**Response (200):**
```json
{
  "data": [
    {
      "_id": "uuid",
      "email": "user@example.com",
      "role": "User",
      "isDeleted": false,
      "createdAt": "2026-05-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

**Error (401/403):**
```json
{ "message": "Unauthorized" }
```

---

### PATCH /api/admin/users/:userId
**Deactivate user (soft delete)**

**Body:**
```json
{
  "action": "deactivate"
}
```

**Response (200):**
```json
{
  "message": "User deactivated",
  "user": {
    "_id": "uuid",
    "email": "user@example.com",
    "isDeleted": true
  }
}
```

**Error (400):**
```json
{ "message": "Invalid action. Only 'deactivate' is allowed" }
```

---

## 🏋️ Exercise Management API

### GET /api/admin/exercises
**Get exercise list (paginated)**

**Query Parameters:**
```
page=1&limit=10&search=<name_search>&muscleGroup=<group>
```

**Response (200):**
```json
{
  "data": [
    {
      "_id": "uuid",
      "name": "Bench Press",
      "description": "Upper chest exercise",
      "muscleGroup": "chest",
      "sets": 4,
      "reps": "8-10",
      "restTime": 90,
      "isDeleted": false,
      "createdAt": "2026-05-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

### POST /api/admin/exercises
**Create new exercise**

**Body:**
```json
{
  "name": "Bench Press",
  "description": "Upper chest exercise",
  "muscleGroup": "chest",
  "sets": 4,
  "reps": "8-10",
  "restTime": 90
}
```

**Response (201):**
```json
{
  "message": "Exercise created",
  "exercise": {
    "_id": "uuid",
    "name": "Bench Press",
    "...": "..."
  }
}
```

**Error (400):**
```json
{ "message": "Validation failed: name, sets, reps required" }
```

---

### PATCH /api/admin/exercises/:exerciseId
**Update exercise**

**Body:**
```json
{
  "name": "Incline Bench Press",
  "sets": 3,
  "reps": "6-8",
  "restTime": 120
}
```

**Response (200):**
```json
{
  "message": "Exercise updated",
  "exercise": { "...": "..." }
}
```

---

### DELETE /api/admin/exercises/:exerciseId
**Soft delete exercise**

**Response (200):**
```json
{
  "message": "Exercise deleted",
  "exercise": {
    "_id": "uuid",
    "isDeleted": true
  }
}
```

**Error (400) - Hard delete attempt:**
```json
{ "message": "Hard delete not allowed. Use soft delete via API." }
```

---

## 📋 Notes

- All timestamps in ISO 8601 format (UTC)
- Pagination: 1-indexed pages
- Search is case-insensitive, partial match on name/email
- Status filter: "active" (isDeleted=false), "all" (both)
- All responses follow `{ message, data/user/exercise, pagination }` format

---

## 🔄 Service Responsibilities

### auth-service (Port 3001)
- **GET /api/admin/users** — List users with pagination and email filter
- **PATCH /api/admin/users/:userId** — Deactivate user (soft delete)
- User model management (existing)
- JWT authentication middleware (existing)

### workout-service (Port 3003)
- **GET /api/admin/exercises** — List exercises with pagination and search
- **POST /api/admin/exercises** — Create new exercise
- **PATCH /api/admin/exercises/:exerciseId** — Update exercise
- **DELETE /api/admin/exercises/:exerciseId** — Soft delete exercise
- Exercise model management (existing)
- Reuse JWT middleware from auth-service (exported)
