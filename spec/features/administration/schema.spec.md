# Schema Spec: Administration

## 📦 Backend Models (by Service)

### TASK-031-BE-Auth-Admin: User Model (auth-service)
Model already exists from TASK-002. **Just add isDeleted flag:**

```javascript
{
  _id: ObjectId (auto),
  email: string (unique, required),
  password: string (hashed, required),
  role: string ("User" | "Admin", default: "User"),
  
  // Profile fields (from User Service)
  firstName: string,
  lastName: string,
  height: number (cm),
  weight: number (kg),
  age: number,
  sex: string ("M" | "F"),
  bmi: number (calculated),
  
  // 🆕 Soft delete flag (ADD THIS)
  isDeleted: boolean (default: false),
  deletedAt: Date (optional),
  
  // Existing timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### TASK-031-BE-Workout-Admin: Exercise Model (workout-service)
Model already exists from TASK-022. **Just add isDeleted flag:**

```javascript
{
  _id: ObjectId (auto),
  name: string (required, unique),
  description: string,
  muscleGroup: string (required) // "chest", "back", "legs", "shoulders", "arms", "core"
  sets: number (required, min: 1),
  reps: string (required) // "8-10", "6-8", "10-12"
  restTime: number (required, seconds) // 60, 90, 120
  
  // Metadata
  difficulty: string ("beginner" | "intermediate" | "advanced", default: "beginner")
  imageUrl: string (optional),
  videoUrl: string (optional),
  
  // 🆕 Soft delete flag (ADD THIS)
  isDeleted: boolean (default: false),
  deletedAt: Date (optional),
  
  // Existing timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## 🎨 Frontend State (Zustand Store)

### TASK-031-FE-Admin-Dashboard: adminStore.js
```javascript
{
  // Users (from auth-service)
  users: [],
  usersLoading: false,
  usersError: null,
  usersPagination: { page: 1, limit: 10, total: 0, pages: 0 },
  usersFilters: { email: "", status: "active" },
  
  // Exercises (from workout-service)
  exercises: [],
  exercisesLoading: false,
  exercisesError: null,
  exercisesPagination: { page: 1, limit: 10, total: 0, pages: 0 },
  exercisesFilters: { search: "", muscleGroup: "" },
  
  // Modals
  deactivateUserModal: { open: false, userId: null, userEmail: null },
  exerciseFormModal: { open: false, mode: "add", exerciseId: null, formData: null },
  deleteExerciseModal: { open: false, exerciseId: null, exerciseName: null },
  
  // User Actions
  fetchUsers(page, filters),
  performDeactivateUser(userId),
  setUsersFilters(filters),
  clearUsersError(),
  
  // Exercise Actions
  fetchExercises(page, filters),
  performCreateExercise(data),
  performUpdateExercise(id, data),
  performDeleteExercise(id),
  setExercisesFilters(filters),
  clearExercisesError(),
  
  // Modal Actions
  openDeactivateUserModal(userId, userEmail),
  closeDeactivateUserModal(),
  openExerciseForm(mode, exerciseId, formData),
  closeExerciseForm(),
  openDeleteExerciseModal(exerciseId, exerciseName),
  closeDeleteExerciseModal()
}
```

---

## 🧩 Frontend Components

### Layout
```
AdminLayout
├── Sidebar (nav links: Users, Exercises, Logout)
├── Header (admin title, user info)
└── Outlet (page content)
```

### Pages
```
AdminPage (protected route)
├── /admin (redirect to /admin/users)
├── /admin/users
│   ├── UsersTable (list, pagination, search, deactivate button)
│   ├── DeactivateUserModal (confirmation)
│   └── UserDetail (side panel, optional)
│
└── /admin/exercises
    ├── ExercisesTable (list, pagination, search, edit/delete buttons)
    ├── ExerciseFormModal (add/edit form)
    ├── DeleteExerciseModal (confirmation)
    └── MuscleGroupFilter (dropdown)
```

### Form Validation (Frontend)
```
Exercise Form:
- name: required, max 100 chars
- muscleGroup: required, enum
- sets: required, number 1-10
- reps: required, e.g. "8-10"
- restTime: required, number 30-300 (seconds)
```

---

## 🔄 API Integration Points

**Frontend calls Backend via axios:**
1. GET `/api/admin/users?page=1&limit=10&email=&status=active`
2. PATCH `/api/admin/users/:userId` (deactivate)
3. GET `/api/admin/exercises?page=1&limit=10&search=&muscleGroup=`
4. POST `/api/admin/exercises`
5. PATCH `/api/admin/exercises/:id`
6. DELETE `/api/admin/exercises/:id`

All requests include:
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 📊 Database Indexes (Mongoose)

**User (auth-service):**
- `email` (unique) — ✅ existing
- `isDeleted` (for filtering) — 🆕 add index
- `createdAt` (for sorting) — ✅ existing

**Exercise (workout-service):**
- `name` (unique) — ✅ existing
- `muscleGroup` (for filtering) — ✅ existing
- `isDeleted` (for filtering) — 🆕 add index
- `createdAt` (for sorting) — ✅ existing

---

## 🔗 Inter-Service Communication

**Frontend calls both services via Nginx gateway:**
```
Frontend (React)
  ├─ GET /api/admin/users → Nginx → auth-service:3001
  ├─ PATCH /api/admin/users/:id → Nginx → auth-service:3001
  ├─ GET /api/admin/exercises → Nginx → workout-service:3003
  ├─ POST /api/admin/exercises → Nginx → workout-service:3003
  ├─ PATCH /api/admin/exercises/:id → Nginx → workout-service:3003
  └─ DELETE /api/admin/exercises/:id → Nginx → workout-service:3003
```

**No direct service-to-service calls** (each service is independent)
