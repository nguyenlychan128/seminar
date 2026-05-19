# Frontend User Profile Codemap

**FitGainer React Frontend** | **Last Updated:** 2026-05-17  
**Status:** ✅ Complete (TASK-018 — User Profile Data Layer; TASK-019 — Profile Setup UI; TASK-020 — Profile Viewing & Editing Page)

---

## 📚 Document Purpose

This codemap guides developers through the frontend user profile subsystem:
- **Data Layer** (TASK-018): State management, API service, custom hook
- **UI Layer** (TASK-019): ProfileSetupPage, ProfileForm, BmiResultCard components for initial setup
- **Profile Viewing & Editing** (TASK-020): ProfilePage for viewing and updating existing profiles
- Where modules live and how they relate
- State management with Zustand (user.store.js)
- API service with structured error handling (user.service.js)
- Custom React hook for profile operations (useUserProfile.js)
- Reusable components with TailwindCSS-only styling (no .css files)
- Silent 404 handling (no profile yet = valid state)
- Cross-store integration (clearAuth → clearProfile)
- Routes: `/profile` (view/edit), `/profile/setup` (initial setup)
- Data flows for fetch / create / update / logout

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│     Frontend User Profile System (TASK-018 + TASK-019 + TASK-020)       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Pages                              Components (TASK-019)               │
│  ProfileSetupPage (TASK-019)        ProfileForm ├─ validateProfileForm  │
│  ProfilePage (TASK-020)             BmiResultCard (BMI badge display)   │
│  (setup vs view/edit)                          ↑                       │
│           ↓                                    ↑                        │
│           └────────────────────────────────────┘                        │
│                     ↓                                                    │
│  useUserProfile Hook (TASK-018)                                         │
│  (auto-fetch, computed hasProfile/isUnderweight, action delegation)     │
│           ↓                              ↓                              │
│  Zustand User Store (TASK-018)      Auth Store                          │
│  (profile, isLoading,               (isAuthenticated — gates auto-fetch)│
│   error, CRUD actions)                   ↓                              │
│           ↓                    clearAuth() → clearProfile() integration  │
│  User Service (TASK-018)                                                │
│  (getProfile, createProfile,                                            │
│   updateProfile, calcBmi)                                               │
│           ↓                                                              │
│  Axios HTTP Client (api.js)                                             │
│  (Bearer token injection, 401 refresh)                                  │
│           ↓                                                              │
│  Nginx API Gateway → user-service:3002                                  │
│  (GET/POST/PUT /api/users/profile, GET /api/users/profile/bmi)          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**

**TASK-018 (Data Layer):**
- **Silent 404:** A 404 from `getProfile` means the user hasn't created a profile yet — not an error. `profile=null, error=null` (not thrown).
- **Merge-not-replace on update:** `updateProfile` merges server response into existing profile with null guard, preserving fields the server doesn't return.
- **Cross-store logout:** `auth.store.clearAuth()` calls `useUserStore.getState().clearProfile()` to reset profile on logout — one-way dependency (user.store does NOT import auth.store).
- **Error shape consistency:** `err.status` (number) + `err.code` (string `HTTP_${status}`) on all user service errors, matching auth service error shape.

**TASK-019 (UI Layer):**
- **TailwindCSS-only styling:** All components use utility classes; no `.css` files created (see `FE/DESIGN.md` for design tokens).
- **ProfileForm validation:** Extracted `validateProfileForm()` function for reusable validation logic; on-blur validation with error display; full validation on submit.
- **BmiResultCard:** Classless component that displays BMI + body classification badge; handles empty state (prompts for input); color-coded by classification (emerald=normal, amber=underweight, orange=overweight, red=obese).
- **ProfileSetupPage:** Main page flow: loading state → form + BMI preview → success message + redirect to dashboard; calls `useUserProfile.createProfile()` and awaits the returned profile data for BMI display.

---

## 🎨 UI Components (TASK-019 & TASK-020)

### 1. ProfileSetupPage: `FE/src/pages/profile/ProfileSetupPage.jsx`

**Purpose:** Main page for first-time profile setup; displays form + live BMI preview; handles async flow with success redirect.

**Props:** None (uses hooks internally)

**State:**
```javascript
submitLoading   // bool — form submission in progress
submitError     // string | null — error message to display
bmiResult       // object | null — { bmi, bodyClassification } returned from createProfile
successMessage  // string — success feedback before redirect
timerRef        // React ref — setTimeout handle for cleanup
```

**Data Flow:**
1. `useUserProfile()` auto-fetches on mount → if `hasProfile`, redirects to `/dashboard` (exit flow)
2. If no profile: renders form + BMI preview card
3. User submits → `handleSubmit()` calls `useUserProfile.createProfile(formData)`
4. On success: `setBmiResult(profile)` → shows success message → 1500ms timer → navigates to `/dashboard`
5. On error: sets `submitError` → form remains for retry

**UI Sections:**
- **Header:** Icon + title "Thiết lập hồ sơ" + subtitle
- **Decorative blobs:** Emerald + amber background gradients (pointer-events-none)
- **BMI Preview Card:** Live display of calculated BMI (empty state → prompts for input)
- **Form Card:** ProfileForm component + error/success alerts
- **Footer note:** Privacy statement about data usage

**Styling:** TailwindCSS only; dark theme (slate-900 base) with emerald accent; responsive (sm:px-6).

**Key Implementation Details:**
- Timer cleanup in useEffect return to prevent memory leaks
- Redirect only after `hasProfile` AND `!isLoading` to avoid race conditions
- `submitLoading` separate from hook `isLoading` to distinguish form submission from initial fetch

---

### 2. ProfileForm: `FE/src/components/profile/ProfileForm.jsx`

**Purpose:** Reusable profile form with validation, error display, and field state tracking.

**Exports:**
```javascript
validateProfileForm(values)  // Pure validation function
export default ProfileForm   // Component
```

**Props:**
```javascript
{
  initialValues: {            // object — pre-fill form (e.g., for edit flow)
    height?: number,
    weight?: number,
    age?: number,
    gender?: 'male' | 'female',
  },
  onSubmit: (formData) => {},  // callback — receives validated { height, weight, age, gender } as numbers
  isLoading: boolean,         // button disabled, inputs disabled, shows spinner
  submitLabel: string,        // button text (default: "Lưu")
}
```

**Validation Rules (in `validateProfileForm`):**
- **height:** 100–250 cm, required, must be finite number
- **weight:** 20–300 kg, required, must be finite number
- **age:** 10–100, required, must be integer (no decimals), must be finite
- **gender:** required, must be 'male' or 'female'

**Error Handling:**
- On-blur: validates touched field, shows error below input
- On-submit: marks all fields as touched, validates all, shows errors if invalid
- Error state cleared when field value changes (after first blur)
- Input border turns red on error; focus ring turns red

**UI Elements:**
- 4 inputs: height (cm), weight (kg), age (years), gender (radio buttons)
- Each input has label, placeholder, aria-required, aria-describedby (for screen readers)
- Gender: 2 equal-width radio buttons with visual toggle styling
- Submit button: emerald, uppercase label, spinner on loading, aria-busy attribute

**Styling:** TailwindCSS only; consistent with design system (slate-700/60 inputs, emerald-500 focus, red-400 errors).

**Data Flow:**
```javascript
User types in field
  ↓
onChange: updates local state, re-validates if field already touched
  ↓
onBlur: marks field as touched, validates, shows error
  ↓
User submits
  ↓
Mark all fields touched, validate all, show errors if any
  ↓ (if all valid)
onSubmit({ height: num, weight: num, age: num, gender: str })
```

---

### 3. BmiResultCard: `FE/src/components/profile/BmiResultCard.jsx`

**Purpose:** Stateless display card for BMI + body classification badge; used in ProfileSetupPage as live preview.

**Props:**
```javascript
{
  bmi: number | null,                                  // null or <= 0 → shows empty state
  bodyClassification: 'underweight' | 'normal' | ... // Classification label
}
```

**Behavior:**
- **Empty State (bmi null/undefined/≤0):**
  - Shows gray icon + "Nhập thông tin để xem chỉ số BMI" message
  - No BMI number or badge displayed

- **Valid State:**
  - Shows BMI as fixed-point 1 decimal (e.g., "17.6")
  - Shows classification badge with color-coded styling:
    - **underweight:** amber bg/text, amber border
    - **normal:** emerald bg/text, emerald border
    - **overweight:** orange bg/text, orange border
    - **obese:** red bg/text, red border
    - **undefined:** slate (fallback)
  - Glow shadow matches badge color

**Styling:**
- Container: rounded-xl, slate-800/60 base, border-slate-700/50
- Icon circle: slate-700/60 background, svg size 4x4
- BMI number: 2xl font-bold, color matches classification
- Badge: rounded-full, small font, `data-testid="bmi-badge"` for testing

**No State:** Pure component, no useState or effects — renders based on props.

---

### 4. ProfilePage (View & Edit): `FE/src/pages/profile/ProfilePage.jsx` (TASK-020)

**Purpose:** Main page for viewing and editing an existing profile; displayed after profile exists (redirects from ProfileSetupPage).

**Props:** None (uses hooks internally)

**State:**
```javascript
submitLoading    // bool — form submission in progress (separate from hook isLoading)
submitError      // string | null — error message on update failure
bmiResult        // object | null — { bmi, bodyClassification } from updateProfile
showToast        // bool — success message visibility
timerRef         // React ref — setTimeout handle for auto-hide toast
initializedRef   // React ref — guards against reinitializing bmiResult after updates
```

**Data Flow:**
1. Component mounts → `useUserProfile()` auto-fetches profile
2. If no profile after fetch: redirects to `/profile/setup` (silent, no UI)
3. If profile exists: renders page with pre-filled form + BMI preview
4. Initialize bmiResult from profile on first load (refs prevent re-init after update)
5. User edits form → `handleSubmit()` calls `updateProfile(formData)`
6. On success: bmiResult updates, toast shows for 3s, form pre-fills with new data
7. On error: submitError displays, user can retry

**UI Sections:**
- **Header:** User icon + title "My Profile" + subtitle (English)
- **Decorative blobs:** Emerald + amber background gradients
- **BMI Preview Card:** Live display with current/updated BMI
- **Form Card:** Pre-filled ProfileForm component + error/success alerts
- **Success Toast:** Fixed top-right toast (3s auto-hide) on successful update
- **Footer note:** Data usage privacy statement

**Styling:** TailwindCSS only; dark theme (slate-900) with emerald accents; responsive.

**Key Implementation Details:**
- `submitLoading` separate from hook `isLoading` → form submission doesn't show initial fetch spinner
- `initializedRef` prevents bmiResult reset on profile updates (only init once on mount)
- Success toast auto-hides after 3s (via timerRef + clearTimeout)
- Redirect happens only when `!isLoading && !hasProfile` → prevents race conditions
- Form pre-fills with `displayedProfile?.field ?? ''` (fallback to empty string)
- Submit label: "Update Profile" (English, differs from ProfileSetupPage's "Thiết lập hồ sơ")

**Routing:**
- Path: `/profile` (protected by ProtectedRoute in App.jsx)
- Redirect source: ProfileSetupPage after initial setup
- Navbar links to `/profile` for `user?.role === 'User'`

---

## 📦 Module Structure

### 1. API Service: `FE/src/services/user.service.js`

**Purpose:** User profile CRUD and BMI calculation API calls, structured Vietnamese error messages

**Methods:**

```javascript
userService.getProfile()
// GET /api/users/profile
// Returns: { userId, height, weight, age, gender, bmi, bodyClassification, updatedAt }
// Throws: Error with status: 404 | 401 | 400 | 5xx
// 404 is caught silently in the store — not an error for the user

userService.createProfile(data)
// POST /api/users/profile
// Body: { height, weight, age, gender }
// Returns: created profile object
// Throws: Error with status: 409 (already exists) | 400 | 401 | 5xx

userService.updateProfile(data)
// PUT /api/users/profile
// Body: partial profile fields to update
// Returns: updated profile object (may be partial — store merges it)
// Throws: Error with status: 400 | 401 | 5xx

userService.calcBmi(height, weight)
// GET /api/users/profile/bmi?height=X&weight=Y
// Returns: { bmi, bodyClassification }
// Throws: Error with status: 400 | 401 | 5xx
```

**Error Handling Pattern:**

```javascript
// Errors are Error instances with structure:
{
  message: "Hồ sơ chưa tồn tại",   // Vietnamese user-facing message
  status: 404,                       // HTTP status as number
  code: "HTTP_404"                   // Machine-readable code string
}
```

**HTTP Status → Error Message Map:**

| Status | `err.message` (Vietnamese) | `err.code` |
|--------|---------------------------|------------|
| 404 | "Hồ sơ chưa tồn tại" | `HTTP_404` |
| 409 | "Hồ sơ đã tồn tại" | `HTTP_409` |
| 401 | "Phiên đăng nhập hết hạn" | `HTTP_401` |
| 400 | Server message or "Dữ liệu không hợp lệ" | `HTTP_400` |
| other | Server message or "Có lỗi xảy ra" | `HTTP_<status>` |

**Why both `err.status` and `err.code`?**
- `err.status` (number) used for conditional logic: `if (error.status === 404)`
- `err.code` (string) for switch-case matching: `case 'HTTP_404'`
- Consistent with `auth.service.js` error shape — predictable across the app

**Dependencies:**
- Uses `axios` via `./api.js` (shared HTTP client with Bearer token injection)
- Does NOT import any stores or hooks

---

### 2. Zustand Store: `FE/src/stores/user.store.js`

**Purpose:** Centralized state for user body profile data, loading, and errors

**State Shape:**

```javascript
{
  profile: {
    userId: string,               // Linked user ID
    height: number,               // in cm
    weight: number,               // in kg
    age: number,
    gender: 'male' | 'female',
    bmi: number,                  // Calculated by backend
    bodyClassification: 'underweight' | 'normal' | 'overweight' | 'obese',
    updatedAt: string             // ISO 8601 timestamp
  } | null,                       // null = profile not yet created or not loaded
  isLoading: boolean,             // Any async operation in progress
  error: string | null            // Last error message (null = no error)
}
```

**Key Actions:**

| Action | Purpose | Behaviour |
|--------|---------|-----------|
| `fetchProfile()` | Load profile from backend | 404 → silent (profile=null, error=null). Other errors → set error. |
| `createProfile(data)` | Create new profile | On success: sets profile. On error: sets error + re-throws. |
| `updateProfile(data)` | Update existing profile | Merges response into current profile with null guard. On error: re-throws. |
| `clearProfile()` | Reset to initialState | Called by `auth.store.clearAuth()` on logout |

**Critical Behaviour — Silent 404:**

```javascript
fetchProfile: async () => {
  set({ isLoading: true, error: null });
  try {
    const profile = await userService.getProfile();
    set({ profile, isLoading: false });
  } catch (error) {
    if (error.status === 404) {
      // 404 = user hasn't created profile yet — valid state, not an error
      set({ profile: null, isLoading: false, error: null });
    } else {
      set({ error: error.message, isLoading: false });
    }
  }
}
```

**Critical Behaviour — Merge-not-Replace on Update:**

```javascript
set((state) => ({
  profile: updated ? { ...state.profile, ...updated } : state.profile,
  isLoading: false,
}));
// null guard: if server returns null/undefined, keep existing profile
// merge: server may return only changed fields, not the full object
```

**Cross-Store Integration:**

`auth.store.js` imports `useUserStore` and calls `clearProfile()` inside `clearAuth()`:

```javascript
// auth.store.js (relevant excerpt)
import useUserStore from './user.store';

clearAuth: () => {
  useUserStore.getState().clearProfile(); // Reset profile on logout
  // ... reset auth state
}
```

- Dependency is **one-way only**: auth.store → user.store
- `user.store` does NOT import `auth.store` (no circular dependency)

---

### 3. Custom Hook: `FE/src/hooks/useUserProfile.js`

**Purpose:** Encapsulates profile state + auto-fetch logic for use in any component

**Usage:**

```javascript
function ProfileSection() {
  const {
    profile,
    isLoading,
    error,
    hasProfile,        // Computed: Boolean(profile)
    isUnderweight,     // Computed: profile?.bodyClassification === 'underweight'
    fetchProfile,
    createProfile,
    updateProfile,
    clearProfile,
  } = useUserProfile();

  if (isLoading) return <Spinner />;
  if (!hasProfile) return <ProfileSetupForm onSubmit={createProfile} />;

  return (
    <ProfileCard
      profile={profile}
      isUnderweight={isUnderweight}
      onUpdate={updateProfile}
    />
  );
}
```

**Auto-fetch Behaviour:**

```javascript
useEffect(() => {
  if (isAuthenticated && profile === null) {
    fetchProfile();
  }
}, [isAuthenticated, profile, fetchProfile]);
```

- Runs when: user becomes authenticated OR profile becomes null
- Does NOT re-fetch if profile already loaded (null check)
- Full dep array `[isAuthenticated, profile, fetchProfile]` satisfies exhaustive-deps lint rule

**Computed Values:**

| Value | Expression | Use Case |
|-------|-----------|---------|
| `hasProfile` | `Boolean(profile)` | Conditional rendering (show setup form vs. profile card) |
| `isUnderweight` | `profile?.bodyClassification === 'underweight'` | Feature gates for weight-gain specific content |

**Dependencies:**
- Reads `profile, isLoading, error` from `useUserStore()`
- Reads `isAuthenticated` from `useAuthStore()`
- Does NOT trigger re-renders from the full store — subscribes only to used fields

---

### 4. HTTP Client: `FE/src/services/api.js` (shared)

User service shares the same Axios instance used by auth service:

```javascript
baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost/api'
```

All requests automatically get `Authorization: Bearer <accessToken>` injected by the request interceptor. 401 responses trigger the token refresh flow (see [auth-frontend.md](auth-frontend.md#3-http-client-fesrcservicesapijs)).

---

## 🔄 Data Flows

### Fetch Profile Flow (App Mount / Route Entry)

```
useUserProfile hook mounts in a component
    ↓
useEffect fires: isAuthenticated=true AND profile=null
    ↓
fetchProfile() called from user.store
    ↓
set({ isLoading: true, error: null })
    ↓
userService.getProfile() → GET /api/users/profile
    ↓ (Nginx routes to user-service:3002)
    ↓ 200 OK
set({ profile: <data>, isLoading: false })
    ↓ 404 Not Found (user has no profile yet)
set({ profile: null, isLoading: false, error: null })  ← silent
    ↓ Other error (401, 500, etc.)
set({ error: <message>, isLoading: false })
    ↓
Component re-renders based on profile / isLoading / error state
```

### Create Profile Flow

```
User submits profile setup form
    ↓
Component calls createProfile(formData)
    ↓
set({ isLoading: true, error: null })
    ↓
userService.createProfile(data) → POST /api/users/profile
    ↓ 201 Created
set({ profile: <created>, isLoading: false })
Component proceeds (hasProfile now true)
    ↓ 409 Conflict (already exists)
set({ error: "Hồ sơ đã tồn tại", isLoading: false })
throw error  ← component catches and shows error
    ↓ 400 Bad Request
set({ error: "Dữ liệu không hợp lệ", isLoading: false })
throw error
```

### Update Profile Flow

```
User submits edit form
    ↓
Component calls updateProfile(partialData)
    ↓
set({ isLoading: true, error: null })
    ↓
userService.updateProfile(data) → PUT /api/users/profile
    ↓ 200 OK with updated fields
set(state => ({
  profile: updated ? { ...state.profile, ...updated } : state.profile,
  isLoading: false
}))
Component re-renders with merged profile
    ↓ Error
set({ error: <message>, isLoading: false })
throw error  ← component catches and shows error
```

### Logout Flow (Cross-Store)

```
User clicks logout in Navbar
    ↓
useLogout() hook called (auth domain)
    ↓
authService.logout() → POST /api/auth/logout
    ↓ (success or failure — doesn't matter)
auth.store.clearAuth():
  1. useUserStore.getState().clearProfile()
     → set({ profile: null, isLoading: false, error: null })
  2. Resets auth state: tokens, user, isAuthenticated = false
  3. Removes localStorage tokens
    ↓
Components re-render:
  - isAuthenticated = false
  - profile = null
  - Navbar shows Login/Register
  - ProtectedRoute redirects to /login
```

### BMI Calculation Flow (On-Demand)

```
Component calls userService.calcBmi(height, weight) directly
(or via a hook that wraps it)
    ↓
GET /api/users/profile/bmi?height=X&weight=Y
    ↓ 200 OK
Returns: { bmi: 18.5, bodyClassification: 'normal' }
    ↓ 400 Bad Request (invalid params)
Throws: Error { message: "Dữ liệu không hợp lệ", status: 400, code: "HTTP_400" }
```

---

## 🧪 Testing Map

### Service Tests: `FE/src/tests/services/user.service.test.js` — 20 Tests ✅

**Method:** MSW (Mock Service Worker) — real Axios calls intercepted in-process

**Base URL:** `http://localhost/api` (matches `api.js` default, Nginx gateway)

| Test Group | Tests | Coverage |
|------------|-------|---------|
| `getProfile()` happy path | 1 | 200 response shape |
| `getProfile()` errors | 3 | 404, 401, 500 → correct message + status + code |
| `createProfile()` happy path | 1 | 201 response shape |
| `createProfile()` errors | 3 | 409, 400, 401 |
| `updateProfile()` happy path | 1 | 200 response shape |
| `updateProfile()` errors | 2 | 400, 401 |
| `calcBmi()` happy path | 1 | Returns bmi + bodyClassification |
| `calcBmi()` errors | 2 | 400, 401 |
| Error shape assertions | 6 | All methods verify `err.status` + `err.code` + `err.message` |

**Key MSW pattern:**
```javascript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const BASE = 'http://localhost/api';

const server = setupServer(
  http.get(`${BASE}/users/profile`, () =>
    HttpResponse.json({ userId: 'user_123', height: 165, weight: 48, ... })
  ),
  http.get(`${BASE}/users/profile`, () =>
    new HttpResponse(null, { status: 404 })
  ),
);
```

---

### Store Tests: `FE/src/tests/stores/user.store.test.js` — 24 Tests ✅

**Method:** `vi.mock()` on `user.service.js` — full store logic tested in isolation

**beforeEach pattern:**
```javascript
beforeEach(() => {
  useUserStore.setState({ profile: null, isLoading: false, error: null });
  vi.clearAllMocks();
});
```

| Test Group | Tests | Coverage |
|------------|-------|---------|
| Initial State | 3 | profile=null, isLoading=false, error=null |
| `fetchProfile()` success | 2 | Sets profile, clears loading |
| `fetchProfile()` 404 silent | 2 | profile=null, error=null (not error state) |
| `fetchProfile()` other error | 2 | Sets error, clears loading |
| `createProfile()` success | 2 | Sets profile |
| `createProfile()` error | 2 | Sets error, re-throws |
| `updateProfile()` success | 3 | Merges, null guard |
| `updateProfile()` error | 2 | Sets error, re-throws |
| `clearProfile()` | 2 | Resets to initialState |
| Loading state transitions | 4 | isLoading true → false on all async paths |

**Key test — silent 404:**
```javascript
it('should set profile=null and error=null on 404 (user has no profile yet)', async () => {
  userService.getProfile.mockRejectedValue(
    Object.assign(new Error('Hồ sơ chưa tồn tại'), { status: 404 })
  );
  await useUserStore.getState().fetchProfile();
  const state = useUserStore.getState();
  expect(state.profile).toBeNull();
  expect(state.error).toBeNull();     // NOT set — 404 is not an error
  expect(state.isLoading).toBe(false);
});
```

**Key test — merge with null guard:**
```javascript
it('should keep existing profile if server returns null on update', async () => {
  useUserStore.setState({ profile: { height: 165, weight: 48, bmi: 17.63 } });
  userService.updateProfile.mockResolvedValue(null);
  await useUserStore.getState().updateProfile({ weight: 50 });
  expect(useUserStore.getState().profile.height).toBe(165); // unchanged
});
```

---

### Hook Tests: `FE/src/tests/hooks/useUserProfile.test.js` — 21 Tests ✅

**Method:** `vi.mock()` on both `user.store` and `auth.store` — pure hook logic tested

| Test Group | Tests | Coverage |
|------------|-------|---------|
| Returns store values | 3 | profile, isLoading, error passed through |
| Computed `hasProfile` | 3 | null=false, object=true, undefined=false |
| Computed `isUnderweight` | 3 | matches bodyClassification |
| Auto-fetch: triggers | 2 | isAuthenticated=true + profile=null → calls fetchProfile |
| Auto-fetch: skips | 3 | isAuthenticated=false, or profile already loaded |
| Action delegation | 4 | createProfile/updateProfile/clearProfile/fetchProfile forwarded |
| Store re-render | 3 | Hook reflects store updates |

**Key test — auto-fetch condition:**
```javascript
it('should call fetchProfile when authenticated and profile is null', async () => {
  mockAuthStore.isAuthenticated = true;
  mockUserStore.profile = null;
  renderHook(() => useUserProfile());
  expect(mockUserStore.fetchProfile).toHaveBeenCalledTimes(1);
});

it('should NOT call fetchProfile when profile already loaded', () => {
  mockAuthStore.isAuthenticated = true;
  mockUserStore.profile = { userId: 'user_123', ... };
  renderHook(() => useUserProfile());
  expect(mockUserStore.fetchProfile).not.toHaveBeenCalled();
});
```

---

### Cross-Store Integration Test: `FE/src/stores/__tests__/auth.store.test.js`

One integration test (added in TASK-018) verifies the cross-store logout behaviour:

```javascript
it('should reset user profile store when clearAuth is called (cross-store integration)', () => {
  useUserStore.setState({
    profile: { userId: 'user_123', height: 165, weight: 48, bmi: 17.63 },
    error: 'some error',
    isLoading: false,
  });

  useAuthStore.getState().clearAuth();

  const userState = useUserStore.getState();
  expect(userState.profile).toBeNull();
  expect(userState.error).toBeNull();
  expect(userState.isLoading).toBe(false);
});
```

---

## 🔗 Nginx Gateway Routing

All user profile API calls go through Nginx at `http://localhost/api`:

```nginx
# infra/nginx/conf.d/gateway.conf (relevant upstream + route)
upstream user_service {
  server user-service:3002;
}

location /api/users/ {
  proxy_pass         http://user_service/;
  proxy_set_header   Authorization $http_authorization;
  proxy_set_header   Host $host;
  proxy_set_header   X-Real-IP $remote_addr;
}
```

**Routing Table (user-service paths):**

| FE Request | Nginx Route | Backend Handler |
|-----------|------------|----------------|
| `GET /api/users/profile` | → `user-service:3002/users/profile` | GET profile |
| `POST /api/users/profile` | → `user-service:3002/users/profile` | Create profile |
| `PUT /api/users/profile` | → `user-service:3002/users/profile` | Update profile |
| `GET /api/users/profile/bmi?h=X&w=Y` | → `user-service:3002/users/profile/bmi` | Calc BMI |

---

## 🛠️ Common Patterns

### Using Profile in a Component

```javascript
import useUserProfile from '../hooks/useUserProfile';

function MyComponent() {
  const { profile, isLoading, error, hasProfile, isUnderweight } = useUserProfile();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorAlert message={error} />;

  if (!hasProfile) {
    return <p>Bạn chưa thiết lập hồ sơ cơ thể.</p>;
  }

  return (
    <div>
      <p>BMI: {profile.bmi}</p>
      {isUnderweight && <WeightGainTips />}
    </div>
  );
}
```

### Creating a Profile

```javascript
function ProfileSetupForm() {
  const { createProfile, isLoading, error } = useUserProfile();
  const [form, setForm] = useState({ height: '', weight: '', age: '', gender: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProfile(form);
      // profile now set in store, component re-renders
    } catch (err) {
      // err.message already in store.error, also available here for side effects
      if (err.code === 'HTTP_409') {
        // Profile already exists — fetch it instead
      }
    }
  };

  return ( /* form JSX */ );
}
```

### Handling Error Codes

```javascript
catch (err) {
  switch (err.code) {
    case 'HTTP_409':
      // Profile already exists
      break;
    case 'HTTP_400':
      // Validation error — show field errors
      break;
    case 'HTTP_401':
      // Session expired — auth interceptor handles refresh, but show message
      break;
    default:
      // Unexpected error
  }
}
```

---

## 📋 Environment Configuration

No additional environment variables beyond the shared API base URL:

```bash
# FE/.env
VITE_API_BASE_URL=http://localhost/api   # Nginx gateway — routes to all services
```

User service is reached at `/api/users/` — no separate env var needed.

---

## 📝 File Reference

| File | Lines | Purpose | Task |
|------|-------|---------|------|
| **Data Layer** | | | TASK-018 |
| `FE/src/services/user.service.js` | ~60 | User profile CRUD + BMI API calls, Vietnamese error messages | 018 |
| `FE/src/stores/user.store.js` | ~60 | Zustand store: profile state, fetch/create/update/clear actions; createProfile returns profile | 018/019 |
| `FE/src/hooks/useUserProfile.js` | ~32 | Auto-fetch hook, computed hasProfile/isUnderweight, action delegation | 018 |
| **UI Components & Pages** | | | TASK-019 & TASK-020 |
| `FE/src/pages/profile/ProfileSetupPage.jsx` | ~132 | Initial setup page: form + BMI preview, submit flow, success redirect to /dashboard | 019 |
| `FE/src/pages/profile/ProfilePage.jsx` | ~145 | View/edit page: pre-filled form + BMI preview, update flow, success toast | 020 |
| `FE/src/components/profile/ProfileForm.jsx` | ~244 | Reusable form with on-blur validation, exports validateProfileForm() + default component | 019/020 |
| `FE/src/components/profile/BmiResultCard.jsx` | ~73 | Stateless BMI display card, color-coded by classification, empty state handling | 019/020 |
| **Modified Files** | | | |
| `FE/src/stores/auth.store.js` | ~90 | Added cross-store clearProfile() call in clearAuth() | 018 |
| `FE/src/services/api.js` | ~105 | Fixed fallback baseURL to `http://localhost/api` (was `:3001`) | 018 |
| `FE/.env` | 3 | Fixed VITE_API_BASE_URL to Nginx gateway (was auth-service :3001) | 018 |
| `CLAUDE.md` | Updated | Added TailwindCSS-only rule, VITE_API_BASE_URL fix documentation | 019 |
| **Infrastructure** | | | |
| `infra/nginx/nginx.conf` | ~40 | Nginx main config: worker settings, gzip, includes conf.d | 018 |
| `infra/nginx/conf.d/gateway.conf` | ~80 | API gateway: 6 upstreams, path-based routing, /health endpoint | 018 |
| **Tests** | | | |
| `FE/src/tests/services/user.service.test.js` | ~200 | 20 MSW integration tests for user.service.js | 018 |
| `FE/src/tests/stores/user.store.test.js` | ~280 | 24 unit tests for user.store.js (mocked service) + createProfile return test | 018/019 |
| `FE/src/tests/hooks/useUserProfile.test.js` | ~200 | 21 unit tests for useUserProfile.js (mocked stores) | 018 |
| `FE/src/tests/components/profile/ProfileForm.test.jsx` | ~400 | 55 component tests: validation, error display, field state, submit flow | 019 |
| `FE/src/tests/components/profile/BmiResultCard.test.jsx` | ~250 | 21 component tests: empty state, all classifications, color mappings | 019/020 |
| `FE/src/tests/pages/profile/ProfileSetupPage.test.jsx` | ~300 | 20 page integration tests: initial load, form submit, success flow, redirect | 019 |
| `FE/src/tests/pages/profile/ProfilePage.test.jsx` | ~400 | 31 page integration tests: loading, redirect when no profile, form prefill, update flow, success toast, error handling | 020 |
| `FE/src/stores/__tests__/auth.store.test.js` | ~360 | Added 1 cross-store integration test for clearAuth → clearProfile | 018 |

**Test Count Summary:**
- TASK-018: 66 tests (20 service + 24 store + 21 hook + 1 cross-store integration)
- TASK-019: 96 tests (55 ProfileForm + 21 BmiResultCard + 20 ProfileSetupPage)
- TASK-020: 31 tests (31 ProfilePage page integration)
- **Total:** 193 tests across data layer and UI layer

---

## ✅ Quality Checklist

**TASK-018 — User Profile Data Layer:**
- [x] `user.service.js` — all 4 methods implemented (getProfile, createProfile, updateProfile, calcBmi)
- [x] Vietnamese error messages mapped for 404 / 409 / 401 / 400 / 5xx
- [x] `err.status` (number) + `err.code` (string) on all errors — consistent with auth service shape
- [x] `user.store.js` — Zustand store with initialState + 4 actions
- [x] Silent 404: `fetchProfile` treats 404 as `profile=null, error=null` (not an error state)
- [x] Merge-not-replace: `updateProfile` uses `{ ...state.profile, ...updated }` with null guard
- [x] `createProfile` and `updateProfile` re-throw errors for component-level catch
- [x] `createProfile` returns profile object (TASK-019 integration)
- [x] `clearProfile` resets to `initialState` (not ad-hoc object — single source of truth)
- [x] `useUserProfile.js` — auto-fetch on `isAuthenticated && profile === null`
- [x] Full `useEffect` dep array `[isAuthenticated, profile, fetchProfile]` — no lint warnings
- [x] Computed `hasProfile = Boolean(profile)` and `isUnderweight = profile?.bodyClassification === 'underweight'`
- [x] Cross-store: `auth.store.clearAuth()` calls `useUserStore.getState().clearProfile()` on logout
- [x] No circular dependency: user.store does NOT import auth.store
- [x] Cross-store integration test added to `auth.store.test.js`
- [x] 20 service tests (MSW) — all green
- [x] 24 store tests (mocked service) + 1 test for createProfile return value — all green
- [x] 21 hook tests (mocked stores) — all green
- [x] Nginx gateway designed: 6 upstreams, path routing, `/health` endpoint
- [x] `FE/.env` corrected: `VITE_API_BASE_URL=http://localhost/api` (not :3001)
- [x] `api.js` fallback corrected to `http://localhost/api`
- [x] TypeScript-free (plain ES6+ JS)
- [x] No spec-exceeding features added

**TASK-019 — Profile Setup Page & UI Components:**
- [x] `ProfileSetupPage.jsx` — main page with form + BMI preview card, handles initial load + submit flow
- [x] Auto-redirect to `/dashboard` if user already has profile
- [x] Loading spinner shown only on initial fetch, not during form submission
- [x] Success message displayed before redirect (1500ms delay for UX)
- [x] Timer cleanup in useEffect return to prevent memory leaks
- [x] `ProfileForm.jsx` — reusable form with validation, error display, field state
- [x] Exported `validateProfileForm()` for testing and potential reuse
- [x] On-blur validation: touches field, shows error if invalid
- [x] On-submit validation: marks all fields touched, validates all, prevents submission if any error
- [x] Form disabled (inputs + button) during submission (isLoading=true)
- [x] Error messages cleared when field changes (after first blur)
- [x] Gender selector: radio buttons with visual toggle styling
- [x] Submit button shows spinner with "Đang lưu..." during submission
- [x] `BmiResultCard.jsx` — stateless display component for BMI + classification badge
- [x] Empty state handling: prompts "Nhập thông tin để xem chỉ số BMI" when bmi null/undefined/<= 0
- [x] Color-coded classification: emerald (normal), amber (underweight), orange (overweight), red (obese)
- [x] Badge styling matches classification with glow shadow
- [x] All styling uses TailwindCSS utility classes only (no .css files)
- [x] Dark theme (slate-900, slate-800) with emerald + amber accent colors
- [x] Responsive design (sm:px-6 media query for mobile)
- [x] Accessibility: proper labels, aria-required, aria-describedby, aria-busy, role=alert
- [x] 55 ProfileForm tests — validation rules, error display, field state, submit flow
- [x] 21 BmiResultCard tests — empty state, all classifications, color mappings
- [x] 20 ProfileSetupPage tests — initial load, redirect, form submit, success flow, error handling
- [x] All tests use React Testing Library (render, screen, userEvent, waitFor)
- [x] No dependency on live backend — all API calls mocked (useUserProfile hook mocked)
- [x] CLAUDE.md updated with TailwindCSS-only rule and styling constraints

**TASK-020 — Profile Viewing & Editing Page:**
- [x] `ProfilePage.jsx` — main page for viewing and editing existing profiles
- [x] Auto-redirect to `/profile/setup` if user has no profile (after fetch)
- [x] No UI shown during redirect (silent, clean transition)
- [x] Loading spinner shown only on initial fetch, not during form submission
- [x] Form pre-fills with existing profile data (height, weight, age, gender)
- [x] BMI preview card displays current profile BMI on first load
- [x] User submits form → `updateProfile(formData)` called via hook
- [x] On success: bmiResult updates, success toast shown, toast auto-hides after 3s
- [x] On error: submitError displayed below form, user can retry
- [x] `submitLoading` separate from hook `isLoading` to prevent form submission spinner on initial fetch
- [x] `initializedRef` prevents bmiResult reinit after updates (only init once on mount)
- [x] Timer cleanup in useEffect return to prevent memory leaks on unmount
- [x] Navbar link: `/profile` added only for `user?.role === 'User'`
- [x] Route in App.jsx: `/profile` wrapped in ProtectedRoute
- [x] TailwindCSS-only styling (no .css files): slate-900 base, emerald accents, responsive
- [x] Accessibility: proper labels, aria-label for spinner, aria-live for toast, role=status/alert
- [x] 31 ProfilePage tests — loading, redirect when no profile, prefill, update flow, success toast, error handling
- [x] All tests use React Testing Library (render, screen, fireEvent, waitFor, userEvent)
- [x] Tests mock useUserProfile hook + useNavigate for isolated testing
- [x] No dependency on live backend — all API calls mocked via hook mock
- [x] English text for headers/labels/buttons (differs from ProfileSetupPage Vietnamese)

---

## 🔗 Related Documentation

- **Tasks:**
  - `tasks/user-profile/TASK-018-fe-user-store-and-service.md` — Data layer
  - `tasks/user-profile/TASK-019-fe-profile-setup-ui.md` — Initial setup UI
  - `tasks/user-profile/TASK-020-fe-profile-page.md` — View & edit profile page
- **Feature & API Specs:**
  - `spec/features/user-profile/feature.spec.md` — Overview & user stories
  - `spec/features/user-profile/api.spec.md` — REST endpoint specifications
  - `spec/features/user-profile/schema.spec.md` — Data models
  - `spec/features/user-profile/rules.spec.md` — Business & validation rules
- **Design & Architecture:**
  - `FE/DESIGN.md` — Design system (colors, typography, spacing, dark mode)
  - `docs/CODEMAPS/auth-frontend.md` — Auth data layer (auth.store, api.js, interceptors)
  - `docs/CODEMAPS/user-service.md` — Backend service codemap
  - `docs/architecture/user-service.md` — Backend architecture decisions
- **Frontend Setup & Configuration:**
  - `FE/README.md` — Frontend setup, quick start, auth flow guide, design system
  - `CLAUDE.md` — Project identity, TailwindCSS-only rule, testing rules
- **Infrastructure:**
  - `infra/nginx/conf.d/gateway.conf` — Nginx API gateway routing
  - `README.md` — Main project README
- **Story Mapping:**
  - `spec/mapping/story-to-spec.md` — Raw user stories → spec mapping

---

**Last Updated:** 2026-05-17  
**Status:** Complete (TASK-018 Data Layer + TASK-019 Setup UI + TASK-020 Profile View/Edit Page)  
**Test Coverage:** 193 tests  
- TASK-018: 66 tests (20 service + 24 store + 21 hook + 1 cross-store integration)  
- TASK-019: 96 tests (55 ProfileForm + 21 BmiResultCard + 20 ProfileSetupPage)  
- TASK-020: 31 tests (31 ProfilePage)  

**Lines of Code:**  
- Data Layer: ~150 (service + store + hook) + ~650 (tests)  
- UI Layer: ~600 (ProfileSetupPage + ProfilePage + ProfileForm + BmiResultCard) + ~1,300 (component tests)  
- Total: ~2,700+ LOC (code + tests)  

**Modules:**  
- Data: user.service.js, user.store.js, useUserProfile.js  
- UI: ProfileSetupPage.jsx, ProfilePage.jsx, ProfileForm.jsx, BmiResultCard.jsx  
- Tests: service.test.js, store.test.js, hook.test.js, ProfileForm.test.jsx, BmiResultCard.test.jsx, ProfileSetupPage.test.jsx, ProfilePage.test.jsx  

**Routing:**  
- `/profile/setup` — Initial setup page (after registration, redirects to `/dashboard` if profile exists)  
- `/profile` — View/edit page (redirects to `/profile/setup` if no profile exists)  
- Both routes protected by ProtectedRoute + Navbar link only for `user?.role === 'User'`  

**Maintainer:** Frontend Team
