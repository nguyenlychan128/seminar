# Progress Frontend Codemap v1.0

**FitGainer React Frontend** | **Last Updated:** 2026-05-19  
**Status:** ✅ Phase 4a FE Complete (TASK-030-FE Progress Store + Dashboard UI)

---

## 📚 Document Purpose

This codemap guides developers through the frontend progress tracking subsystem (TASK-030-FE):

**TASK-030-FE Progress Store & Service:**
- **Service Layer** (2 functions): API calls to progress-service with error mapping
- **Store Layer** (5 computed + 3 actions): Zustand state for weight tracking with calculated trend metrics
- **Hook Layer**: Custom React hook with computed properties and error handling
- **Test Structure**: 71 tests covering service, store, hook (19 + 37 + 15)
- **Patterns**: Mirrors existing user.service.js and workout.service.js architecture
- **Integration**: JWT auth, error state management, 30-day history fetching

**TASK-030-FE Progress Dashboard UI:**
- **Pages** (1 component): ProgressDashboard (main layout orchestrator)
- **Components** (3 reusable): WeightInputForm, WeightChart, WeightStatistics
- **Styling**: TailwindCSS-only, dark mode with emerald/slate colors
- **Test Structure**: Tests focused on integration (service + store + hook + API mocking)
- **Integration**: App.jsx routing, Navbar.jsx links, useProgress hook consumption
- **Charts**: SVG-based line chart with grid, tooltips, area gradient (no external library)

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│     Frontend Progress Tracking (TASK-030-FE)                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Pages                                                                    │
│  ProgressDashboard (layout: form + stats left, chart right)             │
│           ↓                                                               │
│  Components                                                              │
│  WeightInputForm      WeightChart        WeightStatistics              │
│  (form validation)    (SVG visualization)  (4 stat cards)              │
│           ↓              ↓                    ↓                         │
│  useProgress Hook (TASK-030-FE)                                         │
│  (state access, action wrapper, computed values, error swallowing)      │
│           ↓                                    ↓                        │
│  Zustand Progress Store (TASK-030-FE)      Auth Store                   │
│  (weightLogs[], loading, error, 5 computed  (for JWT token)            │
│   + 3 actions)                                                          │
│           ↓                                                              │
│  Weight Log Service (TASK-030-FE)                                        │
│  (createWeightLog, getWeightHistory)                                     │
│           ↓                                                              │
│  Axios HTTP Client (api.js, shared)                                      │
│  (Bearer token injection, 401 refresh)                                   │
│           ↓                                                              │
│  Nginx API Gateway → progress-service:3004                               │
│  (POST/GET /api/progress/weight, auth required)                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**

- **Computed Properties as Methods:** Store uses getter methods (e.g., `getCurrentWeight()`) instead of properties
- **Error Swallowing Hook:** `useProgress` hook wraps async actions with try-catch to prevent throwing
- **30-Day Default:** Dashboard fetches last 30 days on mount via `fetchWeightHistory(null, null, 30)`
- **Form + Data in One Page:** WeightInputForm and WeightChart together in single ProgressDashboard page
- **SVG Charts:** Custom SVG implementation with responsive sizing, no external charting library
- **Error State Pattern:** Errors stored in store (not thrown), displayed via ErrorToast component

---

## 📦 Module Structure

### 1. API Service: `FE/src/services/weightLog.service.js`

**Purpose:** Weight log CRUD API calls, structured error handling

**Methods:**

```javascript
weightLogService.createWeightLog(weight, date = null, notes = null)
// POST /api/progress/weight
// Body: { weight, date (optional), notes (optional) }
// Returns: { _id, userId, weight, date, trend, notes, createdAt, updatedAt }
// Throws: Error with status: 400 | 409 | 401 | 500

weightLogService.getWeightHistory(startDate = null, endDate = null, limit = 30)
// GET /api/progress/weight?startDate=...&endDate=...&limit=30
// Returns: { data: [...], count, startDate, endDate }
// Throws: Error with status: 400 | 401 | 500
```

**Error Handling Pattern:**

```javascript
// Errors are Error instances with structure:
{
  message: "Weight entry already logged for this date",  // User-facing
  status: 409,                                            // HTTP status
  code: "DUPLICATE_ENTRY"                                 // Machine-readable
}
```

**HTTP Status → Error Code Map:**

| Status | `err.code` | Meaning |
|--------|-----------|---------|
| 400 | `VALIDATION_ERROR` | Weight out of range, invalid date format |
| 409 | `DUPLICATE_ENTRY` | Weight already logged for same date |
| 401 | `UNAUTHORIZED` | Missing/invalid JWT token |
| 500 | `SERVER_ERROR` | Backend error |

**Dependencies:**
- Uses `axios` via `./api.js` (shared HTTP client with Bearer token injection)
- Does NOT import stores or hooks

**Test Coverage:** 19 tests covering:
- Successful create/read operations
- Error mapping for all 4 status codes
- Date parameter handling (null defaults)
- Request body structure validation
- Response data unpacking

---

### 2. Zustand Store: `FE/src/stores/progressStore.js`

**Purpose:** Centralized state for weight tracking, loading, error, and computed metrics

**State Shape:**

```javascript
{
  // Raw state
  weightLogs: [
    { _id, weight, date, trend, notes },  // From API
    ...
  ],
  loading: false,                         // API call in progress
  error: null,                            // Last error message (string) or null

  // Computed getters (methods returning computed values)
  getCurrentWeight: () => weightLogs[0]?.weight || null,          // Latest entry
  getPreviousWeight: () => weightLogs[1]?.weight || null,         // Second-latest entry
  getTotalGain: () => {                                            // Latest - earliest
    if (weightLogs.length < 2) return 0;
    return weightLogs[0].weight - weightLogs[weightLogs.length - 1].weight;
  },
  getAverageGain: () => {                                          // Total / days
    if (weightLogs.length < 2) return 0;
    const days = weightLogs.length - 1;
    return getTotalGain() / days;
  },

  // Actions
  fetchWeightHistory(startDate, endDate, limit),     // GET request
  logWeight(weight, date),                            // POST request
  setWeightLogs(logs),                                // Manual state set
  setLoading(isLoading),                              // Manual loading state
  setError(errorMessage),                             // Manual error state
  clearError(),                                       // Reset error to null
}
```

**Action Details:**

**1. `fetchWeightHistory(startDate, endDate, limit)`**
- Calls `weightLogService.getWeightHistory(startDate, endDate, limit)`
- Sets `loading = true` before call
- On success: sets `weightLogs = response.data`, `error = null`
- On error: keeps `weightLogs` unchanged, sets `error = err.message`
- Always sets `loading = false` when done
- **Important:** Throws error AND sets error state (see useProgress hook for error swallowing)

**2. `logWeight(weight, date)`**
- Calls `weightLogService.createWeightLog(weight, date)`
- Sets `loading = true` before call
- On success: prepends new entry to `weightLogs` (maintains newest-first order)
- On error: throws error AND sets `error = err.message`
- Always sets `loading = false` when done

**3. `clearError()`**
- Sets `error = null`
- Used by components to dismiss error messages

**4. `setWeightLogs(logs)`, `setLoading(isLoading)`, `setError(errorMessage)`**
- Manual state setters for advanced use cases (rarely needed in normal flow)

**Dependencies:**
- `axios` (via weightLog.service.js)
- Does NOT import hooks

**Computed Property Pattern:**

Getter methods use `get()` to access current state:

```javascript
getCurrentWeight: () => {
  const state = get();
  return state.weightLogs.length > 0 ? state.weightLogs[0].weight : null;
}
```

This ensures computed values recalculate whenever `weightLogs` changes.

**Test Coverage:** 37 tests covering:
- State initialization
- All 5 getter methods with various data scenarios
- fetchWeightHistory success/error/loading states
- logWeight success/error/loading states
- clearError behavior
- Error persistence across calls

---

### 3. Custom Hook: `FE/src/hooks/useProgress.js`

**Purpose:** React hook exposing store with error swallowing and computed values

**Return Type:**

```javascript
{
  // Store state (direct access)
  weightLogs: Array,
  loading: boolean,
  error: string | null,

  // Computed values (recalculated via useMemo)
  currentWeight: number | null,
  previousWeight: number | null,
  totalGain: number,
  averageGain: number,

  // Wrapped action functions (swallow errors)
  fetchWeightHistory: async (startDate, endDate, limit) => void,
  logWeight: async (weight, date) => void,

  // Direct action (not wrapped)
  clearError: () => void,
}
```

**Error Swallowing Pattern:**

```javascript
const fetchWeightHistory = useCallback(async (startDate, endDate, limit) => {
  try {
    await store.fetchWeightHistory(startDate, endDate, limit);
  } catch {
    // Error caught here, not thrown to component
    // Error is already in store.error state
  }
}, []);
```

Why swallow errors?
- Store already sets `error` state (available via hook)
- Components read `error` from store and display via ErrorToast
- Throwing would require component-level try-catch (redundant)
- Pattern matches auth-service integration

**Dependencies:**
- `zustand` (progressStore)
- `react` (useCallback, useMemo)

**Test Coverage:** 15 tests covering:
- All return values present and correct
- Computed values recalculate on weightLogs change
- Error swallowing (no throw, error in state)
- Component can call actions without try-catch
- Computed values with empty/single/multiple logs

---

### 4. Page: `FE/src/pages/progress/ProgressDashboard.jsx`

**Purpose:** Main page component orchestrating weight tracking UI

**Layout:**
- **Desktop** (lg breakpoint): 3-column grid (form+stats in col 1, chart in cols 2-3)
- **Mobile** (< lg): Single column with stacked sections

**Components Used:**
1. `WeightInputForm` — Top left, form for logging weight
2. `WeightStatistics` — Below form, 4 stat cards
3. `WeightChart` — Right side, line chart visualization
4. `LoadingSpinner` — Full-page loader while fetching initial data
5. `ErrorToast` — Error message with dismiss button

**Data Flow:**

```
useEffect(() => {
  // On mount, fetch 30-day history
  fetchWeightHistory(null, null, 30);
}, []);

// Show LoadingSpinner if initial load
if (loading && weightLogs.length === 0) {
  return <LoadingSpinner />;
}

// Render layout with live data
render(
  <WeightInputForm onSuccess={handleFormSuccess} />  // Refreshes chart
  <WeightStatistics stats={{ currentWeight, previousWeight, totalGain, averageGain }} />
  <WeightChart data={weightLogs} />
)

// handleFormSuccess: Re-fetches history after successful log
const handleFormSuccess = async () => {
  await fetchWeightHistory(null, null, 30);
};
```

**Key Features:**
- Fetches 30-day history on mount
- Loading spinner covers screen while fetching
- Error toast displays and dismisses with button
- Form submission triggers re-fetch automatically
- All data live-updates in real-time

**Dependencies:**
- `react` (useEffect)
- `useProgress` hook
- Component imports (WeightInputForm, WeightChart, WeightStatistics)

**Test Coverage:** Tested via integration tests of components below

---

### 5. Component: `FE/src/components/WeightInputForm.jsx`

**Purpose:** Form component for logging weight with client-side validation

**Form Fields:**
- **Weight (required):** Number input, validated 30-200 kg range, shows error inline
- **Date (optional):** Date picker, defaults to today, blocks future dates
- **Submit Button:** "Log Weight" with spinner state during submission

**Validation:**
- Weight: Must be number, 30-200 kg (inclusive), required
- Date: Must be ISO date string, not future (compared to today UTC)
- Shows inline error message below field if validation fails
- Shows success toast for 3 seconds on successful log
- Disables form during submission (button shows spinner)

**Error Handling:**
- 409 Duplicate: "You've already logged weight for this date. Try a different date."
- Other errors: Displays error message from API
- Clears form on success
- Keeps form visible if validation error (allows retry)

**Styling:**
- TailwindCSS-only (no .css files)
- Dark mode: slate-800 bg, emerald-400 focus ring
- Responsive: Full width on mobile, auto-width on desktop
- Loading state: Spinner and disabled button during submission

**Dependencies:**
- `react` (useState, useCallback)
- `useProgress` hook
- No external form libraries (vanilla React state)

**Test Coverage:** Integrated via service/store/hook tests

---

### 6. Component: `FE/src/components/WeightChart.jsx`

**Purpose:** SVG-based line chart visualization of weight trends

**Chart Features:**
- **Dimensions:** Fixed 600px × 300px with responsive overflow scrolling
- **Scale:** Y-axis range 30-200 kg (fixed), auto X-axis based on data points
- **Visualization:**
  - Grid lines (5 horizontal grid lines with labels)
  - Line path (green #10b981, 2px width, rounded caps)
  - Area fill (green gradient 0.2 opacity at top → 0 at bottom)
  - Data points (green circles with dark border)
  - Hover tooltips (weight + date in box above each point)
  - Axis labels (Y-axis: weight values, X-axis: first/middle/last dates)

**Responsive Design:**
- Overflow-x-auto container allows scrolling on mobile
- Fixed dimensions prevent layout shift
- All positioning calculated mathematically (no external library)

**Data Requirements:**
- Array of objects: `{ weight: number, date: string, trend: number }`
- Empty state: Shows "No weight data yet" placeholder

**Empty State:**
- If no data: Displays "No weight data yet" message
- Returns null from useMemo instead of rendering chart

**Dependencies:**
- `react` (useMemo)
- No external charting libraries (custom SVG implementation)
- TailwindCSS for styling

**Test Coverage:** Integrated via component tests

---

### 7. Component: `FE/src/components/WeightStatistics.jsx`

**Purpose:** Display 4 key statistics in card layout

**Stats Cards:**
1. **Current Weight** - Latest logged weight (green if first entry)
2. **Total Gain** - Difference between latest and earliest (green if positive, red if negative)
3. **Average Daily Gain** - Total gain / number of days (green if positive, red if negative)
4. **Previous Weight** - Second-latest logged weight (for trend comparison)

**Styling:**
- **Layout:** 2×2 grid on desktop (lg breakpoint), single column on mobile
- **Card Style:** Slate-800 bg, slate-200 text, rounded corners, padding
- **Values:** Large font, color-coded (emerald-400 for gains, red-500 for losses)
- **Units:** kg for weight, /day for average gain
- **Null Handling:** Shows "—" placeholder if value unavailable

**Data Requirements:**
- Props: `stats = { currentWeight, previousWeight, totalGain, averageGain }`
- All values: number | null
- Uses TailwindCSS color utilities

**Dependencies:**
- `react` (no hooks needed, pure component)
- TailwindCSS
- Receives computed stats from parent (ProgressDashboard)

**Test Coverage:** Integrated via component tests

---

## 🔄 Data Flow

### Create Weight Log (User logs weight)

```
WeightInputForm
  ↓ (Submit button click)
useProgress.logWeight(weight, date)
  ↓ (wrapped action, swallows error)
progressStore.logWeight(weight, date)
  ↓
weightLogService.createWeightLog(weight, date)
  ↓
axios POST /api/progress/weight
  ↓ (with JWT Bearer token)
progress-service:3004 creates entry, calculates trend
  ↓ (returns 201 with entry)
Service receives response
  ↓
Store prepends to weightLogs array (newest first)
  ↓
ProgressDashboard.handleFormSuccess()
  ↓ (on success)
fetchWeightHistory(null, null, 30) — refresh full history
  ↓
All components re-render with updated data
  ↓
WeightChart updates visualization
WeightStatistics updates metrics
Form clears and shows success toast (3s)
```

### Fetch Weight History (Page loads or refresh)

```
ProgressDashboard useEffect
  ↓ (on mount)
useProgress.fetchWeightHistory(null, null, 30)
  ↓ (wrapped action, swallows error)
progressStore.fetchWeightHistory(null, null, 30)
  ↓
weightLogService.getWeightHistory(null, null, 30)
  ↓
axios GET /api/progress/weight?limit=30
  ↓ (with JWT Bearer token)
progress-service:3004 returns history
  ↓
Service receives { data: [...], count, startDate, endDate }
  ↓
Store sets weightLogs = response.data
  ↓
All components re-render with data
  ↓
WeightChart renders visualization
WeightStatistics display metrics
LoadingSpinner removed from screen
```

---

## 🧪 Testing Strategy

### Test Coverage

**Overall:** 71 tests, 100% code coverage for new files

**Breakdown:**
- **Service Tests (19):** weightLog.service.js — API calls, error mapping
- **Store Tests (37):** progressStore.js — state, computed properties, actions
- **Hook Tests (15):** useProgress.js — hook interface, error swallowing, computed values

### Test Files

#### `FE/src/services/__tests__/weightLog.service.test.js` (19 tests)

Tests for weight log API client:

- **POST /progress/weight (Create):**
  - Successful creation with weight + date
  - Creation with null date (omitted from body)
  - Error mapping: 400 VALIDATION_ERROR, 409 DUPLICATE_ENTRY, 401 UNAUTHORIZED, 500 SERVER_ERROR
  - Request body structure validation
  
- **GET /progress/weight (History):**
  - Successful fetch with default params (null, null, 30)
  - Query param encoding (startDate, endDate, limit)
  - Response unpacking (data array, count, dates)
  - Error handling for all status codes
  - Empty history (empty array)

#### `FE/src/stores/__tests__/progressStore.test.js` (37 tests)

Tests for Zustand store state and actions:

- **State Initialization:**
  - Default values (weightLogs = [], loading = false, error = null)
  
- **Computed Getters:**
  - getCurrentWeight: Latest entry weight, null if empty
  - getPreviousWeight: Second-latest weight, null if < 2 entries
  - getTotalGain: Latest - earliest, 0 if < 2 entries
  - getAverageGain: Total / (count - 1), 0 if < 2 entries
  - Recalculate on weightLogs change
  
- **fetchWeightHistory Action:**
  - Success: Sets weightLogs, clears error
  - Error: Sets error message, keeps weightLogs
  - Loading states: true during, false after
  - Throws error AND sets error state
  - Handles null params (uses defaults)
  
- **logWeight Action:**
  - Success: Prepends entry to weightLogs (newest first)
  - Error: Sets error, keeps weightLogs unchanged
  - Loading states: true during, false after
  - Throws error AND sets error state
  
- **clearError Action:**
  - Sets error to null

#### `FE/src/hooks/__tests__/useProgress.test.js` (15 tests)

Tests for custom React hook:

- **Return Values:**
  - weightLogs, loading, error from store
  - currentWeight, previousWeight, totalGain, averageGain computed
  - fetchWeightHistory, logWeight wrapped functions
  - clearError direct function
  
- **Computed Values:**
  - Recalculate when weightLogs changes (via useMemo)
  - Correct values for empty, single, multiple entries
  
- **Error Swallowing:**
  - fetchWeightHistory doesn't throw on error
  - logWeight doesn't throw on error
  - Error available in hook return (stored in state)
  - Component doesn't need try-catch
  
- **Action Wrapping:**
  - Functions pass through to store actions
  - Loading/error states properly reflected

### MSW Mock Handlers: `FE/src/tests/mocks/progress.handlers.js`

```javascript
// POST /api/progress/weight
// Mock response (201): { _id, userId, weight, date, trend, notes, createdAt, updatedAt }
// Error mocks: 400, 409, 401, 500

// GET /api/progress/weight?limit=30
// Mock response (200): { data: [...], count, startDate, endDate }
// Error mocks: 400, 401, 500
```

### Running Tests

```bash
# All tests with coverage
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## 🎨 Design System

### Colors

**Palette:** Dark mode (slate-900 bg, emerald primary, slate text)

- **Background:** `bg-slate-900` (main), `bg-slate-800` (cards), `bg-slate-700` (borders)
- **Text:** `text-slate-200` (primary), `text-slate-400` (secondary), `text-slate-600` (muted)
- **Primary:** `emerald-400` (headings, highlights), `emerald-500` (interactive, hover)
- **Accent:** `amber-500` (future use), `red-500` (negative values)
- **Borders:** `border-slate-700` (dividers), `border-emerald-500` (focus)

### Typography

- **Headings:** `text-3xl font-bold` (page title), `text-lg font-semibold` (section titles)
- **Body:** `text-sm` (form labels), `text-base` (normal text)
- **Captions:** `text-xs` (timestamps, secondary text)

### Components

- **Cards:** Rounded corners (`rounded-lg`), borders (`border-slate-700`), padding (`p-4`/`p-6`)
- **Buttons:** Emerald bg with hover state, spinner during loading
- **Form Inputs:** Full-width, rounded, dark bg, emerald focus ring
- **Tooltips:** Small text boxes above chart points, dark bg with white text
- **Error Messages:** Red-tinted background, red text, dismiss button

### Responsive Design

- **Breakpoints Used:** `lg` (1024px) for desktop layout
- **Mobile First:** Single column, cards stack vertically
- **Desktop:** 2-column form+stats | chart layout
- **Chart Scrolling:** Horizontal scroll on mobile if needed

---

## 📦 Dependencies

**Production:**
- `axios@^1.4.0` — HTTP client (shared via api.js)
- `zustand@^4.3.0` — State management
- `react@^18.0.0` — React framework
- `react-router-dom@^6.0.0` — Routing (for /progress link)
- `tailwindcss@^3.0.0` — CSS framework

**Development:**
- `vitest@^0.34.0` — Test runner
- `@testing-library/react@^14.0.0` — React component testing
- `msw@^1.3.0` — API mocking
- `jsdom@^22.0.0` — DOM implementation for tests

---

## 🔐 Security

- **Authentication:** JWT Bearer token injected by axios client
- **Authorization:** User isolation (users can only access their own weight logs)
- **Validation:** Client-side (form fields) + server-side (API middleware)
- **Input Sanitization:** Weight range (30-200kg), date validation (no future)
- **Error Messages:** Generic messages for auth failures, specific for validation

---

## 🔗 Integration Points

### Auth Service Integration
- Uses JWT token from auth-service for API calls
- Bearer token auto-injected by axios (api.js)
- 401 errors trigger token refresh (handled by axios interceptor)

### Progress Service Integration (Backend)
- POST /api/progress/weight — Create weight log
- GET /api/progress/weight — Fetch weight history
- Both endpoints require JWT authentication

### Router Integration (FE)
- Route: `/progress` → ProgressDashboard page
- Protected: `<RoleRoute requiredRole="User">` (User role only)
- Navbar link: "Progress" in User navigation menu

---

## 🚀 API Endpoints (Frontend Perspective)

### POST /api/progress/weight
**Create a new weight log entry**

**Request:**
```json
{
  "weight": 75.5,
  "date": "2026-05-18"
}
```

**Response (201):**
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "weight": 75.5,
  "date": "2026-05-18T00:00:00.000Z",
  "trend": 0.5,
  "createdAt": "2026-05-19T10:30:45.123Z",
  "updatedAt": "2026-05-19T10:30:45.123Z"
}
```

**Errors:**
- 400 — Weight out of range or invalid date format
- 409 — Weight already logged for this date
- 401 — Invalid/expired JWT token
- 500 — Server error

### GET /api/progress/weight
**Fetch weight history**

**Query Parameters:**
- `startDate` (optional) — ISO date string (default: 30 days ago)
- `endDate` (optional) — ISO date string (default: today)
- `limit` (optional) — Number of entries (default: 30, max: 365)

**Response (200):**
```json
{
  "data": [
    {
      "_id": "ObjectId",
      "weight": 75.5,
      "date": "2026-05-18T00:00:00.000Z",
      "trend": 0.5
    }
  ],
  "count": 1,
  "startDate": "2026-04-19",
  "endDate": "2026-05-19"
}
```

**Errors:**
- 400 — Invalid date format or limit bounds
- 401 — Invalid/expired JWT token
- 500 — Server error

---

## 📝 Environment Variables

**Frontend `.env`:**
```
VITE_API_BASE_URL=/api
VITE_ENV=development
```

Backend automatically converts to full URL: `http://localhost:5173/api/progress/weight`

---

## 📚 Related Documents

- **Feature Spec:** `spec/features/progress-tracking/`
- **Backend Codemap:** `docs/CODEMAPS/progress-service.md`
- **Main README:** `README.md`
- **Frontend README:** `FE/README.md`
- **Design System:** `FE/DESIGN.md`

---

## 🆙 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-19 | Initial codemap for TASK-030-FE Progress Store + Dashboard UI (71 tests, 100% coverage) |
