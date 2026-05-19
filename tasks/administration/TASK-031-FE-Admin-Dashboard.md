# TASK-031-FE: Admin Dashboard UI

## 📋 Description

Build frontend admin dashboard with protected routes, user management page (list + deactivate modal), and exercise management page (CRUD with forms/modals). All UI built with React + Zustand + TailwindCSS, fully tested.

**Target:** ~45 minutes with TDD approach.

---

## 🎯 Objectives

1. ✅ Create admin layout (sidebar, header, outlet)
2. ✅ Implement Users page (table + deactivate modal)
3. ✅ Implement Exercises page (table + add/edit form + delete modal)
4. ✅ Create Zustand admin store (state + actions)
5. ✅ Create admin service (API client with error handling)
6. ✅ Protected routes (non-admin redirects to login)
7. ✅ TailwindCSS styling only (no `.css` files)
8. ✅ Comprehensive component tests (≥80% coverage)

---

## 📥 Input (From Spec)

**Related Spec Files:**
- `spec/features/administration/schema.spec.md` — Store structure, components
- `spec/features/administration/api.spec.md` — API endpoints
- `FE/DESIGN.md` — Design system (colors, typography)

**Already Implemented:**
- `FE/src/stores/authStore.js` — Auth state (user, tokens)
- `FE/src/pages/ProtectedRoute.jsx` — Auth route wrapper
- `FE/src/services/api.js` — Axios instance with auth headers
- `FE/DESIGN.md` — TailwindCSS color palette (emerald, amber, slate)

---

## 📤 Output (Deliverables)

### Frontend Structure

```
FE/src/
├── services/
│   └── admin.service.js (new)         # API calls for admin
├── stores/
│   └── adminStore.js (new)            # Zustand store (users, exercises, modals)
├── pages/
│   ├── admin/
│   │   ├── AdminLayout.jsx (new)      # Layout with sidebar + header
│   │   ├── AdminPage.jsx (new)        # Redirect /admin → /admin/users
│   │   ├── UsersPage.jsx (new)        # Users table + deactivate modal
│   │   ├── ExercisesPage.jsx (new)    # Exercises table + modals
│   │   └── components/
│   │       ├── UsersTable.jsx (new)
│   │       ├── DeactivateUserModal.jsx (new)
│   │       ├── ExercisesTable.jsx (new)
│   │       ├── ExerciseFormModal.jsx (new)
│   │       ├── DeleteExerciseModal.jsx (new)
│   │       └── AdminSidebar.jsx (new)
└── App.jsx (updated)                  # Add admin routes

FE/tests/
└── integration/
    ├── admin-users.test.jsx (new)
    ├── admin-exercises.test.jsx (new)
    └── admin-layout.test.jsx (new)
```

---

## 🧩 Step-by-Step Implementation

### Step 1: Create Admin Service (5 min)

**File:** `FE/src/services/admin.service.js`

**Methods:**

```javascript
// Users
export const getUsers = async (page = 1, filters = {}) => {
  // GET /api/admin/users?page=1&limit=10&email=...&status=active|all
  // Return: { data, pagination }
  // Error handling: map 401/403 to auth errors
}

export const deactivateUser = async (userId) => {
  // PATCH /api/admin/users/:userId
  // Body: { action: "deactivate" }
  // Return: { message, user }
}

// Exercises
export const getExercises = async (page = 1, filters = {}) => {
  // GET /api/admin/exercises?page=1&limit=10&search=...&muscleGroup=...
  // Return: { data, pagination }
}

export const createExercise = async (data) => {
  // POST /api/admin/exercises
  // Body: { name, description, muscleGroup, sets, reps, restTime, difficulty }
  // Return: { exercise }
}

export const updateExercise = async (exerciseId, data) => {
  // PATCH /api/admin/exercises/:exerciseId
  // Body: partial data
  // Return: { exercise }
}

export const deleteExercise = async (exerciseId) => {
  // DELETE /api/admin/exercises/:exerciseId
  // Return: { message, exercise }
}
```

**Error Handling:**
- Catch axios errors and map to user-friendly messages
- 401/403: "Unauthorized - Admin access required"
- 400: "Invalid input - {error message}"
- 409: "Exercise name already exists"
- 404: "{User/Exercise} not found"
- 500: "Server error - please try again"

---

### Step 2: Create Zustand Admin Store (8 min)

**File:** `FE/src/stores/adminStore.js`

**State:**
```javascript
{
  // Users
  users: [],
  usersLoading: false,
  usersError: null,
  usersPagination: { page: 1, limit: 10, total: 0, pages: 0 },
  usersFilters: { email: "", status: "active" },
  
  // Exercises
  exercises: [],
  exercisesLoading: false,
  exercisesError: null,
  exercisesPagination: { page: 1, limit: 10, total: 0, pages: 0 },
  exercisesFilters: { search: "", muscleGroup: "" },
  
  // Modals
  deactivateUserModal: { open: false, userId: null, userEmail: null },
  exerciseFormModal: { open: false, mode: "add", exerciseId: null, formData: null },
  deleteExerciseModal: { open: false, exerciseId: null, exerciseName: null },
  
  // Modal actions
  openDeactivateUserModal: (userId, userEmail) => {...},
  closeDeactivateUserModal: () => {...},
  openExerciseFormModal: (mode, exerciseId = null, formData = null) => {...},
  closeExerciseFormModal: () => {...},
  openDeleteExerciseModal: (exerciseId, exerciseName) => {...},
  closeDeleteExerciseModal: () => {...},
  
  // Users actions
  fetchUsers: async (page = 1, filters = {}) => {...},
  setUsersFilters: (filters) => {...},
  performDeactivateUser: async (userId) => {...},
  
  // Exercises actions
  fetchExercises: async (page = 1, filters = {}) => {...},
  setExercisesFilters: (filters) => {...},
  performCreateExercise: async (data) => {...},
  performUpdateExercise: async (exerciseId, data) => {...},
  performDeleteExercise: async (exerciseId) => {...},
  
  // Error clearing
  clearUsersError: () => {...},
  clearExercisesError: () => {...}
}
```

**Implementation Notes:**
- Use Zustand `create()` hook
- Separate user and exercise state (independent concerns)
- Modal states: `{ open, userId/exerciseId, formData (for edit) }`
- Loading states prevent duplicate requests
- Error states display in UI
- Actions call admin.service methods and update state

---

### Step 3: Create Admin Layout (6 min)

**File:** `FE/src/pages/admin/components/AdminSidebar.jsx`

**Features:**
- Logo/branding at top
- Navigation links:
  - Users (active: underline/highlight)
  - Exercises (active: underline/highlight)
  - Divider
  - Logout button
- Mobile responsive (hamburger on small screens, optional)
- TailwindCSS: dark slate bg, emerald text for active

**File:** `FE/src/pages/admin/AdminLayout.jsx`

**Structure:**
```
<div className="flex h-screen bg-slate-900">
  <AdminSidebar />
  <div className="flex-1 flex flex-col">
    <header className="bg-slate-800 border-b border-slate-700 p-4">
      <h1 className="text-emerald-400 text-2xl">Admin Dashboard</h1>
      <p className="text-slate-400 text-sm">Manage users and exercises</p>
    </header>
    <main className="flex-1 overflow-auto p-6">
      <Outlet />
    </main>
  </div>
</div>
```

---

### Step 4: Create Users Page (8 min)

**File:** `FE/src/pages/admin/UsersPage.jsx`

**Features:**
- Fetch users on mount
- Display UsersTable component
- Email filter input (onChange updates store, auto-refetch)
- Status filter dropdown (active / all)
- Pagination controls (previous, page numbers, next)
- Loading spinner while fetching
- Error toast if fetch fails

**File:** `FE/src/pages/admin/components/UsersTable.jsx`

**Structure:**
```html
<table className="w-full border-collapse border border-slate-600">
  <thead className="bg-slate-800">
    <tr>
      <th>Email</th>
      <th>Role</th>
      <th>Status</th>
      <th>Created</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {users.map(user => (
      <tr key={user._id} className="border-b border-slate-600 hover:bg-slate-700">
        <td>{user.email}</td>
        <td>{user.role}</td>
        <td>
          <span className={user.isDeleted ? "text-red-400" : "text-emerald-400"}>
            {user.isDeleted ? "Inactive" : "Active"}
          </span>
        </td>
        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
        <td>
          <button onClick={() => openDeactivateUserModal(user._id, user.email)}>
            {user.isDeleted ? "Reactivate" : "Deactivate"}
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**File:** `FE/src/pages/admin/components/DeactivateUserModal.jsx`

**Features:**
- Modal overlay (dark bg with opacity)
- Title: "Deactivate User"
- User email displayed
- Warning message
- Buttons: Cancel, Deactivate
- On deactivate: call store action, close modal, refresh users list
- Loading state on button
- Error handling

---

### Step 5: Create Exercises Page (10 min)

**File:** `FE/src/pages/admin/ExercisesPage.jsx`

**Features:**
- Fetch exercises on mount
- Display ExercisesTable component
- Search input (name/description search)
- MuscleGroup filter dropdown
- Add Exercise button (opens ExerciseFormModal in "add" mode)
- Pagination controls
- Loading spinner
- Error toast

**File:** `FE/src/pages/admin/components/ExercisesTable.jsx`

**Structure:**
```html
<table className="w-full border-collapse">
  <thead className="bg-slate-800">
    <tr>
      <th>Name</th>
      <th>Muscle Group</th>
      <th>Sets</th>
      <th>Reps</th>
      <th>Rest (sec)</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {exercises.map(ex => (
      <tr key={ex._id} className="border-b hover:bg-slate-700">
        <td>{ex.name}</td>
        <td className="capitalize">{ex.muscleGroup}</td>
        <td>{ex.sets}</td>
        <td>{ex.reps}</td>
        <td>{ex.restTime}</td>
        <td>
          <span className={ex.isDeleted ? "text-red-400" : "text-emerald-400"}>
            {ex.isDeleted ? "Deleted" : "Active"}
          </span>
        </td>
        <td>
          <button onClick={() => openExerciseFormModal("edit", ex._id, ex)}>Edit</button>
          <button onClick={() => openDeleteExerciseModal(ex._id, ex.name)}>Delete</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**File:** `FE/src/pages/admin/components/ExerciseFormModal.jsx`

**Features:**
- Modal for add/edit
- Form fields:
  - name (text, required, max 100)
  - description (textarea, optional)
  - muscleGroup (select: chest/back/legs/shoulders/arms/core, required)
  - sets (number, 1-10, required)
  - reps (text, format "X-Y", required)
  - restTime (number, 30-300, required)
  - difficulty (select: beginner/intermediate/advanced, optional)
- Form validation on blur
- Submit button (Create/Update based on mode)
- Cancel button
- Error messages per field
- Loading state on submit
- Close modal on success

**File:** `FE/src/pages/admin/components/DeleteExerciseModal.jsx`

**Features:**
- Modal overlay
- Title: "Delete Exercise"
- Exercise name displayed
- Warning: "This action is permanent" (soft delete)
- Buttons: Cancel, Delete
- On delete: call store action, close modal, refresh list
- Loading state
- Error handling

---

### Step 6: Create Routes (3 min)

**File:** `FE/src/pages/admin/AdminPage.jsx`

Simple redirect:
```javascript
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function AdminPage() {
  const navigate = useNavigate()
  
  useEffect(() => {
    navigate('/admin/users')
  }, [navigate])
  
  return null
}
```

**Update:** `FE/src/App.jsx`

```javascript
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminPage from '@/pages/admin/AdminPage'
import UsersPage from '@/pages/admin/UsersPage'
import ExercisesPage from '@/pages/admin/ExercisesPage'

// In routes array:
{
  element: <ProtectedRoute roleRequired="Admin"><AdminLayout /></ProtectedRoute>,
  children: [
    { path: '/admin', element: <AdminPage /> },
    { path: '/admin/users', element: <UsersPage /> },
    { path: '/admin/exercises', element: <ExercisesPage /> }
  ]
}
```

---

### Step 7: Write Component Tests (5 min)

**File:** `FE/tests/integration/admin-users.test.jsx`

**Test Cases:**

1. UsersTable
   - ✅ Renders table with headers
   - ✅ Displays user rows with email, role, status
   - ✅ Shows "Active" for active users, "Inactive" for deleted
   - ✅ Deactivate button calls openDeactivateUserModal
   - ✅ Empty state message when no users

2. DeactivateUserModal
   - ✅ Displays when open=true
   - ✅ Shows user email
   - ✅ Cancel button closes modal
   - ✅ Deactivate button calls performDeactivateUser
   - ✅ Loading state on button
   - ✅ Displays error message if failed

3. UsersPage
   - ✅ Fetches users on mount
   - ✅ Displays users table
   - ✅ Email filter updates state and refetches
   - ✅ Status filter (active/all) works
   - ✅ Pagination previous/next works
   - ✅ Shows loading spinner
   - ✅ Displays error toast on fetch failure

**File:** `FE/tests/integration/admin-exercises.test.jsx`

**Test Cases:**

1. ExercisesTable
   - ✅ Renders table with headers
   - ✅ Displays exercise rows with all fields
   - ✅ Shows "Active" for active, "Deleted" for soft-deleted
   - ✅ Edit button calls openExerciseFormModal with exercise data
   - ✅ Delete button calls openDeleteExerciseModal

2. ExerciseFormModal (Add mode)
   - ✅ Renders form fields
   - ✅ Validates required fields on blur
   - ✅ Validates sets (1-10)
   - ✅ Validates reps format ("X-Y")
   - ✅ Validates restTime (30-300)
   - ✅ Shows field-level errors
   - ✅ Submit calls performCreateExercise
   - ✅ Cancel closes modal
   - ✅ Loading state on submit

3. ExerciseFormModal (Edit mode)
   - ✅ Pre-fills form with exercise data
   - ✅ Submit calls performUpdateExercise with exerciseId
   - ✅ Can update single field or all fields

4. DeleteExerciseModal
   - ✅ Displays exercise name
   - ✅ Cancel closes modal
   - ✅ Delete button calls performDeleteExercise
   - ✅ Shows error if delete fails

5. ExercisesPage
   - ✅ Fetches exercises on mount
   - ✅ Search filter updates and refetches
   - ✅ MuscleGroup filter works
   - ✅ Add button opens form modal in add mode
   - ✅ Pagination works
   - ✅ Shows loading spinner
   - ✅ Displays error toast

**File:** `FE/tests/integration/admin-layout.test.jsx`

**Test Cases:**

1. AdminLayout
   - ✅ Renders sidebar and header
   - ✅ Sidebar has Users and Exercises links
   - ✅ Current page link highlighted
   - ✅ Logout button calls logout
   - ✅ Outlet renders child routes

2. Non-admin Access
   - ✅ Non-admin users redirected to /login
   - ✅ ProtectedRoute checks role="Admin"

---

## ✅ Acceptance Criteria

- [ ] Admin service: 6 methods (getUsers, deactivateUser, getExercises, create/update/deleteExercise)
- [ ] Admin store: All state + actions implemented
- [ ] AdminLayout: Sidebar + header + outlet working
- [ ] UsersPage: Table + deactivate modal complete
- [ ] ExercisesPage: Table + add/edit/delete modals complete
- [ ] All routes configured in App.jsx
- [ ] Form validation: email filter, search, muscleGroup, exercise fields
- [ ] Pagination: page numbers, previous/next buttons
- [ ] Loading states: spinners while fetching
- [ ] Error handling: toasts/alerts on API errors
- [ ] TailwindCSS: dark mode (slate-900 bg, emerald/amber accent)
- [ ] No `.css` files for new components (Tailwind utility classes only)
- [ ] Component tests: ≥35 test cases
- [ ] Test coverage: ≥80%
- [ ] `npm test` passes all admin tests
- [ ] All components render without errors

---

## 🗂️ Mapping to Spec

| Spec Section | Implementation |
|---|---|
| `schema.spec.md` adminStore.js | Step 2 Zustand store |
| `schema.spec.md` Frontend Components | Step 3-5 Layout, Pages, Components |
| `schema.spec.md` Form Validation | Step 5 ExerciseFormModal validation |
| `schema.spec.md` API Integration Points | Step 1 Admin service |
| `api.spec.md` GET /api/admin/users | Step 1 getUsers, Step 4 UsersPage |
| `api.spec.md` PATCH /api/admin/users/:id | Step 1 deactivateUser, Step 4 DeactivateUserModal |
| `api.spec.md` Exercise endpoints | Step 1 Exercise methods, Step 5 ExercisesPage |
| `rules.spec.md` Test Cases Frontend | Step 7 Component tests |

---

## 💡 Tips

- Use existing `authStore` to access current user + logout
- Use `api.js` (Axios instance) in admin.service for HTTP calls
- MSW (Mock Service Worker) for tests: create `admin.handlers.js` in tests/mocks
- Reuse existing error toast component (or create simple toast)
- TailwindCSS classes: `bg-slate-900`, `text-emerald-400`, `hover:bg-slate-700`, etc.
- Mobile responsive: use `md:` and `lg:` breakpoints
- Loading state: disable button + show spinner
- Modal pattern: overlay + centered box with animation
- Pagination: "Previous", page numbers (1 2 3 ...), "Next"

---

## 📝 Notes

- **Non-admin redirect:** ProtectedRoute with roleRequired="Admin" redirects to /login
- **Modal close:** All modals close after successful action
- **Refresh on action:** After deactivate/create/update/delete, refresh the list
- **Error messages:** Display per-field for forms, toast/banner for API errors
- **TailwindCSS only:** No `.css` imports; use Tailwind utility classes
- **Pagination:** Link to `/admin/users?page=2` or use state (choose one approach)

---

## 🚀 Ready for Implementation?

Yes! Use TDD approach:
1. Create mock handlers in tests/mocks/admin.handlers.js
2. Write test file first
3. Write failing test cases
4. Implement components/store/service to pass tests
5. Run `npm test` — all should pass
