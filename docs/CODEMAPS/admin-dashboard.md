# Admin Dashboard Frontend Codemap v1.0

**FitGainer React Frontend** | **Last Updated:** 2026-05-19  
**Status:** ✅ Phase 4b FE Complete (TASK-031-FE-Admin-Dashboard)

---

## 📚 Document Purpose

This codemap guides developers through the admin dashboard UI subsystem (TASK-031-FE-Admin-Dashboard):

**TASK-031-FE-Admin-Dashboard Admin Dashboard:**
- **Service Layer** (6 functions): API calls to auth-service + workout-service with error mapping
- **Store Layer** (state + actions): Zustand state for users/exercises with pagination and modal management
- **Layout Components** (2 components): AdminLayout wrapper and AdminSidebar navigation
- **Pages** (2 pages): UsersPage and ExercisesPage with separate concerns
- **Table Components** (2 components): UsersTable and ExercisesTable with actions
- **Modal Components** (3 components): DeactivateUserModal, ExerciseFormModal, DeleteExerciseModal
- **Test Structure**: 60+ tests covering service, store, components (comprehensive coverage)
- **Patterns**: Mirrors existing progress dashboard + workout components architecture
- **Integration**: JWT auth, role-based routing (Admin only), error state management

**Key Features:**
- User management: List, filter, deactivate users with pagination
- Exercise management: CRUD operations (list, create, update, delete) with modals
- Form validation: Name, muscleGroup, sets, reps, restTime with client-side validation
- Pagination + filtering: Both users and exercises support pagination and search
- Protected routes: RoleRoute enforces Admin-only access
- Dark mode styling: TailwindCSS-only with emerald/slate theme
- Real-time feedback: Toast notifications for success/error states

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│     Frontend Admin Dashboard (TASK-031-FE-Admin-Dashboard)              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Pages                                                                    │
│  AdminPage (layout)                                                      │
│  ├─ AdminLayout (sidebar + header)                                      │
│  │   ├─ AdminSidebar (navigation)                                       │
│  │   ├─ UsersPage (user management)                                     │
│  │   └─ ExercisesPage (exercise management)                             │
│  │                                                                        │
│  └─ Child Routes                                                         │
│     ├─ UsersTable + DeactivateUserModal                                 │
│     └─ ExercisesTable + ExerciseFormModal + DeleteExerciseModal         │
│           ↓                                                              │
│  useAdminStore Hook (Zustand store wrapper)                             │
│  (users, exercises, modals state + actions)                             │
│           ↓                    ↓                                          │
│  admin.service.js          Auth/Workout Stores                          │
│  (6 API methods)           (for JWT token)                              │
│           ↓                                                              │
│  Axios HTTP Client (api.js, shared)                                      │
│  (Bearer token injection, 401 refresh)                                   │
│           ↓                                                              │
│  Nginx API Gateway                                                       │
│  → auth-service:3001 /api/admin/users                                    │
│  → workout-service:3003 /api/admin/exercises                             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**

- **Separate Pages:** UsersPage and ExercisesPage maintain clean separation of concerns
- **Modal State:** adminStore manages modal visibility (show/hide for create, edit, delete)
- **Pagination:** Fixed limit=10, 1-indexed pages, stored in store for navigation
- **Soft Delete Only:** No hard delete, 400 error returned if attempted
- **Idempotent Actions:** Already-deleted/deactivated returns 200 OK
- **TailwindCSS Only:** All styling via utility classes, dark mode with emerald primary
- **Role-Based Access:** RoleRoute enforces Admin role requirement

---

## 📦 Module Structure

### 1. API Service: `FE/src/services/admin.service.js`

**Purpose:** Admin API CRUD operations, structured error handling

**Methods:**

```javascript
// User Management
adminService.getUsers(page = 1, filters = {})
// GET /api/admin/users?page=1&limit=10&email=...&status=...
// Returns: { data: [...], count, page, pages, limit }
// Filters: { email: string, status: 'active' | 'inactive' }

adminService.deactivateUser(userId)
// PATCH /api/admin/users/:userId
// Body: { action: 'deactivate' }
// Returns: { success: true, data: { _id, email, isDeleted, deletedAt } }

// Exercise Management
adminService.getExercises(page = 1, filters = {})
// GET /api/admin/exercises?page=1&limit=10&search=...&muscleGroup=...
// Returns: { data: [...], count, page, pages, limit }
// Filters: { search: string, muscleGroup: string }

adminService.createExercise(data)
// POST /api/admin/exercises
// Body: { name, muscleGroup, difficulty, equipment, sets, reps, restTime, ... }
// Returns: { _id, name, muscleGroup, ... }

adminService.updateExercise(exerciseId, data)
// PATCH /api/admin/exercises/:exerciseId
// Body: { name, muscleGroup, difficulty, ... } (partial)
// Returns: { _id, name, muscleGroup, ... }

adminService.deleteExercise(exerciseId)
// DELETE /api/admin/exercises/:exerciseId
// Returns: { success: true, data: { _id, isDeleted, deletedAt } }
```

**Error Handling Pattern:**

```javascript
// Errors are Error instances with structure:
{
  message: "User not found",              // User-facing
  status: 404,                            // HTTP status
  code: "NOT_FOUND"                       // Machine-readable
}
```

**HTTP Status → Error Code Map:**

| Status | `err.code` | Meaning |
|--------|-----------|---------|
| 400 | `VALIDATION_ERROR` | Invalid input, soft-delete already deleted |
| 401 | `UNAUTHORIZED` | Missing/invalid JWT token |
| 403 | `FORBIDDEN` | Admin role required |
| 404 | `NOT_FOUND` | User/exercise not found |
| 500 | `SERVER_ERROR` | Backend error |

**Dependencies:**
- Uses `axios` via `./api.js` (shared HTTP client with Bearer token injection)
- Does NOT import stores or hooks

**Test Coverage:** 15+ tests covering:
- User CRUD operations (list, deactivate)
- Exercise CRUD operations (list, create, update, delete)
- Error mapping for all status codes
- Pagination parameter handling
- Request body structure validation

---

### 2. Zustand Store: `FE/src/stores/adminStore.js`

**Purpose:** Centralized state for admin UI (users, exercises, modals, pagination)

**State Shape:**

```javascript
{
  // Users Management
  users: [],                             // Array of user objects from API
  usersLoading: false,                   // API call in progress
  usersError: null,                      // Last error message or null
  usersPage: 1,                          // Current page (1-indexed)
  usersTotal: 0,                         // Total user count
  usersFilters: { email: '', status: 'all' },  // Active filters

  // Exercises Management
  exercises: [],                         // Array of exercise objects from API
  exercisesLoading: false,               // API call in progress
  exercisesError: null,                  // Last error message or null
  exercisesPage: 1,                      // Current page (1-indexed)
  exercisesTotal: 0,                     // Total exercise count
  exercisesFilters: { search: '', muscleGroup: 'all' },  // Active filters

  // Modal States
  modals: {
    deactivateUser: { isOpen: false, userId: null },
    exerciseForm: { isOpen: false, exerciseId: null, mode: 'create' },  // mode: 'create' | 'edit'
    deleteExercise: { isOpen: false, exerciseId: null },
  },

  // Actions
  // Users
  fetchUsers(page, filters),             // GET list with pagination/filters
  deactivateUser(userId),                // PATCH deactivate action
  setUsersFilters(filters),              // Update filter state
  setUsersPage(page),                    // Update current page
  
  // Exercises
  fetchExercises(page, filters),         // GET list with pagination/filters
  createExercise(data),                  // POST create
  updateExercise(exerciseId, data),      // PATCH update
  deleteExercise(exerciseId),            // DELETE soft-delete
  setExercisesFilters(filters),          // Update filter state
  setExercisesPage(page),                // Update current page

  // Modals
  openModal(modalName, payload),         // Open specific modal
  closeModal(modalName),                 // Close specific modal

  // Error Handling
  clearError(section),                   // Clear error for users/exercises
}
```

**Action Details:**

**1. `fetchUsers(page = 1, filters = {})`**
- Calls `adminService.getUsers(page, filters)`
- Sets `usersLoading = true` before call
- On success: sets `users = response.data`, `usersTotal = response.count`, `usersError = null`
- On error: keeps `users` unchanged, sets `usersError = err.message`
- Always sets `usersLoading = false` when done

**2. `deactivateUser(userId)`**
- Calls `adminService.deactivateUser(userId)`
- Sets `usersLoading = true` before call
- On success: removes user from `users` array (soft delete), closes modal
- On error: sets `usersError`, keeps `users` unchanged
- Closes modal regardless of result

**3. `fetchExercises(page = 1, filters = {})`**
- Calls `adminService.getExercises(page, filters)`
- Sets `exercisesLoading = true` before call
- On success: sets `exercises = response.data`, `exercisesTotal = response.count`, `exercisesError = null`
- On error: keeps `exercises` unchanged, sets `exercisesError = err.message`
- Always sets `exercisesLoading = false` when done

**4. `createExercise(data)`, `updateExercise(id, data)`, `deleteExercise(id)`**
- Call respective API service methods
- On success: refresh full exercises list (re-fetch current page)
- On error: set `exercisesError`
- Close modal after operation

**5. Modal Methods**
- `openModal(modalName, payload)` — Sets modal visibility and optional payload (userId, exerciseId, mode)
- `closeModal(modalName)` — Hides modal and clears payload

**Dependencies:**
- `admin.service` (API calls)
- Does NOT import hooks

**Test Coverage:** 40+ tests covering:
- State initialization
- All user actions (fetch, deactivate, filter, paginate)
- All exercise actions (fetch, create, update, delete, filter, paginate)
- Modal open/close with payloads
- Error handling for all operations
- Loading states

---

### 3. Layout: `FE/src/pages/admin/AdminLayout.jsx`

**Purpose:** Main wrapper for admin dashboard with sidebar + content area

**Structure:**

```
AdminLayout
├─ Header
│  └─ "Admin Dashboard" title + user info
├─ Sidebar (AdminSidebar)
│  ├─ "Users" link → /admin/users
│  ├─ "Exercises" link → /admin/exercises
│  └─ Dark mode toggle (optional)
└─ Main Content
   └─ Outlet (router children: UsersPage or ExercisesPage)
```

**Styling:**
- TailwindCSS-only layout: flex with sidebar (fixed) + content (flex-grow)
- Responsive: Sidebar collapses on mobile (hamburger menu)
- Dark mode: slate-900 bg, emerald-400 accents
- Header: 60px height, sticky positioning

**Dependencies:**
- `react-router-dom` (Outlet)
- `AdminSidebar` component
- No hooks needed (layout component)

---

### 4. Sidebar: `FE/src/pages/admin/components/AdminSidebar.jsx`

**Purpose:** Navigation sidebar for admin sections

**Navigation Links:**
1. **Dashboard** → `/admin` (overview, optional)
2. **Users** → `/admin/users` (user management)
3. **Exercises** → `/admin/exercises` (exercise management)

**Styling:**
- Width: 250px (fixed) on desktop, full-width overlay on mobile
- Height: 100vh (full viewport)
- Dark mode: slate-800 bg, slate-200 text, emerald-400 hover
- Active link highlighting: Bold + emerald background
- Padding: Standard spacing with visual hierarchy

**Dependencies:**
- `react-router-dom` (useLocation for active link detection)
- TailwindCSS

---

### 5. Page: `FE/src/pages/admin/UsersPage.jsx`

**Purpose:** User management page with list, filters, and deactivate actions

**Layout:**
- **Header:** "Users Management" title + "Total: X users" info
- **Filters:** Email search + Status dropdown (all/active/inactive)
- **Table:** UsersTable component with pagination
- **Modals:** DeactivateUserModal for confirmation

**Data Flow:**

```
useEffect(() => {
  // Fetch users on mount or when filters/page change
  fetchUsers(usersPage, usersFilters);
}, [usersPage, usersFilters]);

// Render
<SearchInput 
  onChange={(email) => setUsersFilters({ ...usersFilters, email })}
  onFilter={() => setUsersPage(1)}  // Reset to page 1 when filtering
/>
<UsersTable 
  users={users}
  onDeactivate={(userId) => openModal('deactivateUser', { userId })}
  onNextPage={() => setUsersPage(usersPage + 1)}
  onPrevPage={() => setUsersPage(usersPage - 1)}
/>
<DeactivateUserModal 
  isOpen={modals.deactivateUser.isOpen}
  userId={modals.deactivateUser.userId}
  onConfirm={() => deactivateUser(userId)}
/>
```

**Dependencies:**
- `useAdminStore` hook (custom)
- `UsersTable` component
- `DeactivateUserModal` component

**Test Coverage:** 20+ tests covering:
- Loading spinner on initial fetch
- Filtering and pagination
- User list rendering with actions
- Modal open/close flow
- Error handling and display

---

### 6. Page: `FE/src/pages/admin/ExercisesPage.jsx`

**Purpose:** Exercise management page with CRUD operations and modals

**Layout:**
- **Header:** "Exercise Management" title + "Total: X exercises" info
- **Filters:** Search (exercise name) + Muscle Group dropdown
- **Create Button:** "Add Exercise" button opens ExerciseFormModal
- **Table:** ExercisesTable component with pagination
- **Modals:** ExerciseFormModal (create/edit) and DeleteExerciseModal (confirm delete)

**Data Flow:**

```
useEffect(() => {
  // Fetch exercises on mount or when filters/page change
  fetchExercises(exercisesPage, exercisesFilters);
}, [exercisesPage, exercisesFilters]);

// Render
<Button onClick={() => openModal('exerciseForm', { mode: 'create' })}>
  Add Exercise
</Button>
<SearchInput 
  onChange={(search) => setExercisesFilters({ ...exercisesFilters, search })}
  onFilter={() => setExercisesPage(1)}  // Reset to page 1
/>
<ExercisesTable 
  exercises={exercises}
  onEdit={(exerciseId) => openModal('exerciseForm', { exerciseId, mode: 'edit' })}
  onDelete={(exerciseId) => openModal('deleteExercise', { exerciseId })}
  onNextPage={() => setExercisesPage(exercisesPage + 1)}
  onPrevPage={() => setExercisesPage(exercisesPage - 1)}
/>
<ExerciseFormModal 
  isOpen={modals.exerciseForm.isOpen}
  mode={modals.exerciseForm.mode}
  exerciseId={modals.exerciseForm.exerciseId}
  onSubmit={(data) => {
    if (mode === 'create') createExercise(data);
    else updateExercise(exerciseId, data);
  }}
/>
<DeleteExerciseModal 
  isOpen={modals.deleteExercise.isOpen}
  exerciseId={modals.deleteExercise.exerciseId}
  onConfirm={() => deleteExercise(exerciseId)}
/>
```

**Dependencies:**
- `useAdminStore` hook (custom)
- `ExercisesTable` component
- `ExerciseFormModal` component
- `DeleteExerciseModal` component

**Test Coverage:** 20+ tests covering:
- Loading spinner on initial fetch
- Filtering and pagination
- Exercise list rendering with actions
- Modal flows for create, edit, delete
- Form validation
- Error handling and display

---

### 7. Table: `FE/src/pages/admin/components/UsersTable.jsx`

**Purpose:** Display users in table format with actions and pagination

**Columns:**
1. **Email** — User email address
2. **Role** — 'User' or 'Admin' badge (color-coded)
3. **Status** — 'Active' or 'Inactive' badge (emerald/red)
4. **Joined** — Registration date (formatted)
5. **Actions** — Deactivate button (disabled if already inactive)

**Pagination:**
- Bottom row: "Page X of Y" + Previous/Next buttons
- Previous disabled if page = 1
- Next disabled if page = total pages

**Styling:**
- Table: Full-width, striped rows, hover effects
- Cells: Padding, vertical alignment, text overflow handling
- Badges: Color-coded by status (emerald for active, red for inactive)
- Buttons: Emerald primary, red for dangerous actions (deactivate)

**Dependencies:**
- `formatDate()` utility function
- TailwindCSS
- No hooks needed (pure component)

**Test Coverage:** 15+ tests covering:
- User list rendering
- All columns displayed correctly
- Badge colors and status formatting
- Action button callbacks
- Pagination controls
- Empty state handling

---

### 8. Table: `FE/src/pages/admin/components/ExercisesTable.jsx`

**Purpose:** Display exercises in table format with CRUD actions and pagination

**Columns:**
1. **Name** — Exercise name (truncated if long)
2. **Muscle Group** — Badge (chest=red, back=blue, shoulders=yellow, arms=purple, legs=orange, core=green)
3. **Difficulty** — 'Beginner' / 'Intermediate' / 'Advanced' badge
4. **Sets × Reps** — "4×8", "3×10", etc.
5. **Rest** — Rest time in seconds (e.g., "60s", "90s")
6. **Actions** — Edit button + Delete button

**Pagination:**
- Bottom row: "Page X of Y" + Previous/Next buttons
- Previous disabled if page = 1
- Next disabled if page = total pages

**Styling:**
- Table: Full-width, striped rows, hover effects
- Cells: Padding, text truncation, aligned columns
- Badges: Color-coded by muscle group / difficulty
- Buttons: Emerald for edit, red for delete

**Dependencies:**
- `getMuscleGroupColor()` utility
- TailwindCSS
- No hooks needed (pure component)

**Test Coverage:** 15+ tests covering:
- Exercise list rendering
- All columns displayed
- Badge colors and formatting
- Action button callbacks (edit/delete)
- Pagination controls
- Empty state handling

---

### 9. Modal: `FE/src/pages/admin/components/DeactivateUserModal.jsx`

**Purpose:** Confirmation dialog for deactivating a user

**Modal Content:**
- **Title:** "Deactivate User"
- **Message:** "Are you sure you want to deactivate [email]? They won't be able to log in."
- **Buttons:**
  - Cancel (gray) — Closes modal without action
  - Confirm (red) — Calls `deactivateUser(userId)` and closes modal
- **Loading State:** Button shows spinner while deactivating

**Styling:**
- Overlay: Dark background with 70% opacity
- Modal: Centered, 400px max-width, rounded corners
- Dark mode: slate-800 bg, slate-200 text, slate-700 borders
- Buttons: Full-width, spacing between them

**Dependencies:**
- TailwindCSS
- No hooks needed (receives props)

**Test Coverage:** 10+ tests covering:
- Modal rendering when isOpen = true
- Hidden when isOpen = false
- Cancel button closes modal
- Confirm button triggers callback
- Loading state during deactivation

---

### 10. Modal: `FE/src/pages/admin/components/ExerciseFormModal.jsx`

**Purpose:** Form dialog for creating/editing exercises

**Form Fields:**
1. **Name** (required) — Text input, unique validation on server
2. **Muscle Group** (required) — Select dropdown (chest, back, shoulders, arms, legs, core)
3. **Difficulty** (required) — Select dropdown (beginner, intermediate, advanced)
4. **Equipment** (required) — Select/text input
5. **Sets** (required) — Number input (1-10)
6. **Reps** (required) — Number input (1-50)
7. **Rest Time** (required) — Number input in seconds (15-300s)
8. **Description** (optional) — Text area

**Validation:**
- Client-side: Required fields, number ranges, format validation
- Shows inline error messages below fields
- Submit button disabled if validation fails
- Loading spinner during submission

**Modal Buttons:**
- Cancel (gray) — Closes modal without saving
- Save (emerald) — Validates form, calls API, closes on success

**Styling:**
- TailwindCSS-only dark mode
- Form layout: Vertical stack with labels
- Input styling: Full-width, rounded, dark bg, emerald focus ring
- Error messages: Red text below field

**Dependencies:**
- `useCallback` (form handlers)
- TailwindCSS
- No store imports (receives onSubmit callback)

**Test Coverage:** 15+ tests covering:
- Form rendering in create mode (empty fields)
- Form rendering in edit mode (pre-filled fields)
- Validation: Required fields, number ranges
- Error message display
- Submit callback with form data
- Modal close on cancel/success
- Loading state during submission

---

### 11. Modal: `FE/src/pages/admin/components/DeleteExerciseModal.jsx`

**Purpose:** Confirmation dialog for deleting an exercise

**Modal Content:**
- **Title:** "Delete Exercise"
- **Message:** "Are you sure you want to delete '[exerciseName]'? This action cannot be undone."
- **Buttons:**
  - Cancel (gray) — Closes modal without action
  - Delete (red) — Calls `deleteExercise(exerciseId)` and closes modal
- **Loading State:** Button shows spinner while deleting

**Styling:**
- Same as DeactivateUserModal
- Centered, 400px max-width, dark mode
- Buttons: Full-width with spacing

**Dependencies:**
- TailwindCSS
- No hooks needed (receives props)

**Test Coverage:** 10+ tests covering:
- Modal rendering when isOpen = true
- Hidden when isOpen = false
- Cancel button closes modal
- Delete button triggers callback
- Loading state during deletion

---

## 🔄 Data Flow

### Create Exercise (Admin adds new exercise)

```
ExerciseFormModal (create mode)
  ↓ (Submit button click with form data)
ExercisesPage → createExercise(data)
  ↓
adminStore.createExercise(data)
  ↓
admin.service.createExercise(data)
  ↓
axios POST /api/admin/exercises
  ↓ (with JWT Bearer token, Admin role required)
workout-service:3003 creates exercise
  ↓ (returns 201 with exercise)
Service receives response
  ↓
Store fetches full exercises list (page 1)
  ↓
ExercisesTable re-renders with new exercise
ExerciseFormModal closes
Success toast shown (3s auto-dismiss)
```

### Update Exercise (Admin edits exercise)

```
ExercisesTable (edit button)
  ↓ (Click)
ExercisesPage → openModal('exerciseForm', { exerciseId, mode: 'edit' })
  ↓
ExerciseFormModal renders with pre-filled data
  ↓ (User modifies fields and submits)
ExercisesPage → updateExercise(exerciseId, data)
  ↓
adminStore.updateExercise(exerciseId, data)
  ↓
admin.service.updateExercise(exerciseId, data)
  ↓
axios PATCH /api/admin/exercises/:exerciseId
  ↓
workout-service:3003 updates exercise
  ↓ (returns 200 with updated exercise)
Service receives response
  ↓
Store fetches full exercises list (current page)
  ↓
ExercisesTable re-renders with updates
ExerciseFormModal closes
Success toast shown
```

### Deactivate User (Admin deactivates user)

```
UsersTable (deactivate button)
  ↓ (Click)
UsersPage → openModal('deactivateUser', { userId })
  ↓
DeactivateUserModal opens with confirmation
  ↓ (User confirms)
UsersPage → deactivateUser(userId)
  ↓
adminStore.deactivateUser(userId)
  ↓
admin.service.deactivateUser(userId)
  ↓
axios PATCH /api/admin/users/:userId
  ↓ (with body: { action: 'deactivate' })
auth-service:3001 deactivates user
  ↓ (returns 200)
Service receives response
  ↓
Store removes user from users array
DeactivateUserModal closes
Success toast shown (3s auto-dismiss)
```

---

## 🧪 Testing Strategy

### Test Coverage

**Overall:** 60+ tests, comprehensive coverage for all components

**Breakdown:**
- **Service Tests (15):** admin.service.js — API calls, error mapping
- **Store Tests (40):** adminStore.js — state, actions, modals
- **Component Tests (25):** Layout, sidebar, tables, modals
- **Integration Tests (10):** Full flows (create/edit/delete/deactivate)

### Test Files

#### `FE/src/services/__tests__/admin.service.test.js` (15 tests)

Tests for admin API client:

- **User Operations:**
  - getUsers: success, pagination, filtering
  - deactivateUser: success, error (not found, already deleted)
  
- **Exercise Operations:**
  - getExercises: success, pagination, filtering, search
  - createExercise: success, error (validation, duplicate)
  - updateExercise: success, error (not found, validation)
  - deleteExercise: success, error (not found, already deleted)

#### `FE/src/stores/__tests__/adminStore.test.js` (40 tests)

Tests for Zustand store:

- **User Actions:**
  - fetchUsers: success/error/loading states, pagination, filters
  - deactivateUser: success/error, modal closing
  - Filter/page setters
  
- **Exercise Actions:**
  - fetchExercises: success/error/loading states
  - createExercise: success/error, list refresh
  - updateExercise: success/error, list refresh
  - deleteExercise: success/error, list refresh
  - Filter/page setters
  
- **Modal Actions:**
  - openModal: visibility + payload
  - closeModal: visibility reset
  - Multiple modals independent state

#### `FE/src/pages/admin/__tests__/admin-layout.test.jsx` (10 tests)

Tests for layout and sidebar:

- AdminLayout rendering
- AdminSidebar navigation links
- Active link highlighting
- Mobile responsiveness

#### `FE/src/pages/admin/__tests__/admin-users.test.jsx` (15 tests)

Tests for UsersPage and components:

- User list rendering
- Filter and pagination
- Deactivate modal flow
- Error handling

#### `FE/src/pages/admin/__tests__/admin-exercises.test.jsx` (15 tests)

Tests for ExercisesPage and components:

- Exercise list rendering
- Filter and pagination
- Create/edit/delete modal flows
- Form validation
- Error handling

### MSW Mock Handlers: `FE/src/tests/mocks/admin.handlers.js`

```javascript
// User endpoints
// GET /api/admin/users (list with pagination/filtering)
// PATCH /api/admin/users/:userId (deactivate)

// Exercise endpoints
// GET /api/admin/exercises (list with pagination/search)
// POST /api/admin/exercises (create)
// PATCH /api/admin/exercises/:exerciseId (update)
// DELETE /api/admin/exercises/:exerciseId (delete)
```

### Running Tests

```bash
# All tests with coverage
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Admin dashboard tests only
npm test admin
```

---

## 🎨 Design System

### Colors

**Palette:** Dark mode (slate-900 bg, emerald primary, slate text)

- **Background:** `bg-slate-900` (main), `bg-slate-800` (cards/tables), `bg-slate-700` (hover)
- **Text:** `text-slate-200` (primary), `text-slate-400` (secondary), `text-slate-600` (muted)
- **Primary:** `emerald-400` (active links, save buttons), `emerald-500` (hover)
- **Danger:** `red-500` (delete, deactivate buttons)
- **Status:** `emerald-400` (active), `red-500` (inactive), `blue-500` (pending)
- **Borders:** `border-slate-700` (dividers), `border-emerald-500` (focus)

### Muscle Group Badges

- **Chest:** Red (#ef4444)
- **Back:** Blue (#3b82f6)
- **Shoulders:** Yellow (#eab308)
- **Arms:** Purple (#a855f7)
- **Legs:** Orange (#f97316)
- **Core:** Green (#10b981)

### Difficulty Badges

- **Beginner:** Emerald (#10b981)
- **Intermediate:** Amber (#f59e0b)
- **Advanced:** Red (#ef4444)

### Typography

- **Headings:** `text-2xl font-bold` (page title), `text-lg font-semibold` (section titles)
- **Body:** `text-sm` (form labels), `text-base` (table cells, normal text)
- **Captions:** `text-xs` (secondary text, timestamps)

### Components

- **Tables:** Full-width, striped rows, hover effects, fixed headers
- **Buttons:** Rounded corners, loading spinners, disabled states
- **Modals:** Centered overlay, 400-500px width, rounded corners
- **Form Inputs:** Full-width, rounded, dark bg, emerald focus ring
- **Error Messages:** Red-tinted background, red text, inline below field

### Responsive Design

- **Breakpoints Used:** `lg` (1024px) for desktop layout
- **Mobile First:** Single column, stacked modals
- **Desktop:** Multi-column tables with pagination
- **Sidebar:** Collapsible on mobile (hamburger menu, optional)

---

## 📦 Dependencies

**Production:**
- `axios@^1.4.0` — HTTP client (shared via api.js)
- `zustand@^4.3.0` — State management
- `react@^18.0.0` — React framework
- `react-router-dom@^6.0.0` — Routing
- `tailwindcss@^3.0.0` — CSS framework

**Development:**
- `vitest@^0.34.0` — Test runner
- `@testing-library/react@^14.0.0` — React component testing
- `msw@^1.3.0` — API mocking
- `jsdom@^22.0.0` — DOM implementation for tests

---

## 🔐 Security

- **Authentication:** JWT Bearer token injected by axios client
- **Authorization:** Admin role required (checked by RoleRoute)
- **Validation:** Client-side (form fields) + server-side (API middleware)
- **Input Sanitization:** Regex validation on name, number ranges, muscle group enum
- **Error Messages:** Generic messages for auth failures, specific for validation
- **Soft Delete Only:** No hard delete operations, safe restoration possible
- **Idempotent Operations:** Already-deleted returns 200 OK (safe to retry)

---

## 🔗 Integration Points

### Auth Service Integration
- Uses JWT token from auth-service for API calls
- Bearer token auto-injected by axios (api.js)
- 401 errors trigger token refresh (handled by axios interceptor)
- Admin role enforcement via RoleRoute

### Workout Service Integration
- CRUD operations on exercises via workout-service
- Same JWT auth mechanism
- Admin role required for all endpoints

### Router Integration (FE)
- Route: `/admin` → AdminPage (AdminLayout wrapper)
- Protected: `<RoleRoute requiredRole="Admin">` (Admin role only)
- Child routes: `/admin/users`, `/admin/exercises`
- Navbar link: "Admin" in top navigation (only for Admin role)

---

## 🚀 API Endpoints (Frontend Perspective)

### User Management

#### GET /api/admin/users
**Fetch user list with pagination and filters**

**Query Parameters:**
- `page` (optional) — Page number (1-indexed, default: 1)
- `limit` (optional) — Items per page (fixed: 10)
- `email` (optional) — Filter by email (partial match)
- `status` (optional) — Filter by status ('active' | 'inactive' | 'all')

**Response (200):**
```json
{
  "data": [
    {
      "_id": "ObjectId",
      "email": "user@example.com",
      "role": "User",
      "isDeleted": false,
      "createdAt": "2026-05-18T10:30:45.123Z"
    }
  ],
  "count": 25,
  "page": 1,
  "pages": 3,
  "limit": 10
}
```

#### PATCH /api/admin/users/:userId
**Deactivate (soft delete) a user**

**Request:**
```json
{
  "action": "deactivate"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "email": "user@example.com",
    "isDeleted": true,
    "deletedAt": "2026-05-19T10:30:45.123Z"
  }
}
```

**Errors:**
- 400 — Invalid action, cannot deactivate own account, user not found
- 401 — Invalid/expired JWT token
- 403 — Admin role required
- 500 — Server error

### Exercise Management

#### GET /api/admin/exercises
**Fetch exercise list with pagination and filters**

**Query Parameters:**
- `page` (optional) — Page number (1-indexed, default: 1)
- `limit` (optional) — Items per page (fixed: 10)
- `search` (optional) — Search exercise name (partial match)
- `muscleGroup` (optional) — Filter by muscle group

**Response (200):**
```json
{
  "data": [
    {
      "_id": "ObjectId",
      "name": "Barbell Bench Press",
      "muscleGroup": "chest",
      "difficulty": "beginner",
      "equipment": "barbell",
      "sets": 4,
      "reps": 8,
      "restTime": 90
    }
  ],
  "count": 36,
  "page": 1,
  "pages": 4,
  "limit": 10
}
```

#### POST /api/admin/exercises
**Create a new exercise**

**Request:**
```json
{
  "name": "Dumbbell Flyes",
  "muscleGroup": "chest",
  "difficulty": "beginner",
  "equipment": "dumbbell",
  "sets": 3,
  "reps": 12,
  "restTime": 60,
  "description": "Optional description"
}
```

**Response (201):**
```json
{
  "_id": "ObjectId",
  "name": "Dumbbell Flyes",
  "muscleGroup": "chest",
  "difficulty": "beginner",
  "equipment": "dumbbell",
  "sets": 3,
  "reps": 12,
  "restTime": 60,
  "createdAt": "2026-05-19T10:30:45.123Z"
}
```

#### PATCH /api/admin/exercises/:exerciseId
**Update an exercise**

**Request (partial):**
```json
{
  "reps": 10,
  "sets": 4
}
```

**Response (200):** Updated exercise object

#### DELETE /api/admin/exercises/:exerciseId
**Delete (soft delete) an exercise**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "name": "Exercise Name",
    "isDeleted": true,
    "deletedAt": "2026-05-19T10:30:45.123Z"
  }
}
```

**Errors:**
- 400 — Validation error, already deleted, cannot hard delete
- 401 — Invalid/expired JWT token
- 403 — Admin role required
- 404 — Exercise not found
- 500 — Server error

---

## 📝 Environment Variables

**Frontend `.env`:**
```
VITE_API_BASE_URL=/api
VITE_ENV=development
```

Backend automatically converts to full URL: `http://localhost:5173/api/admin/users`, etc.

---

## 📚 Related Documents

- **Feature Spec:** `spec/features/administration/`
- **Backend Auth Codemap:** `docs/CODEMAPS/auth-service.md` (admin user API)
- **Backend Workout Codemap:** `docs/CODEMAPS/workout-service.md` (admin exercises API)
- **Main README:** `README.md`
- **Frontend README:** `FE/README.md`
- **Design System:** `FE/DESIGN.md`

---

## 🆙 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-19 | Initial codemap for TASK-031-FE-Admin-Dashboard (60+ tests, comprehensive admin UI with user + exercise management) |
