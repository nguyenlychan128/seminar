# TASK-011-fe-auth-setup

## 📋 Overview

Set up the frontend authentication infrastructure: Zustand auth store, API service layer, custom hooks, routing structure, and TypeScript-free component patterns.

**Dependency:** TASK-010-integration-testing-and-docker (BE auth service complete) ✅

**User Stories:** US-001, US-005, US-006

---

## 🎯 Objectives

1. Create Zustand auth store (tokens, user, loading, error state)
2. Create auth API service (login, register, logout, refresh, getMe)
3. Create custom hooks (useAuth, useLogin, useRegister, useAuthCheck)
4. Set up main App.jsx with initial auth check on mount
5. Implement token persistence (localStorage)
6. Set up HTTP client with automatic token injection
7. Configure API base URL from environment variables
8. All code TDD-first: failing tests → implementation

---

## 🔄 Implementation Flow

### Step 1: Zustand Auth Store
**File:** `FE/src/stores/auth.store.js`

Create store with:
- **State:** `tokens` (access, refresh), `user` (userId, email, role), `loading`, `error`, `isAuthenticated`
- **Actions:**
  - `setTokens(accessToken, refreshToken)` — Store tokens
  - `setUser(user)` — Store user info from JWT decode
  - `setLoading(bool)` — Loading state
  - `setError(error)` — Error state
  - `clearAuth()` — Clear all auth state (on logout)
  - `initializeAuth()` — Load tokens from localStorage on app start
  - `setAccessToken(token)` — Update access token (after refresh)

**localStorage keys:**
- `fitgainer_access_token`
- `fitgainer_refresh_token`

**Example state:**
```javascript
{
  tokens: {
    accessToken: null,
    refreshToken: null
  },
  user: {
    userId: null,
    email: null,
    role: null
  },
  loading: false,
  error: null,
  isAuthenticated: false
}
```

### Step 2: Auth API Service
**File:** `FE/src/services/auth.service.js`

Create service with:
- `login(email, password)` → calls POST /api/auth/login → returns { tokens, user }
- `register(email, password, confirmPassword)` → POST /api/auth/register → returns { user }
- `logout()` → POST /api/auth/logout
- `refreshToken(refreshToken)` → POST /api/auth/refresh → returns { tokens }
- `getMe()` → GET /api/auth/me → returns { user }

**Error handling:** Return structured errors:
```javascript
{
  success: false,
  message: "Invalid credentials",
  code: "INVALID_CREDENTIALS"
}
```

### Step 3: HTTP Client with Token Injection
**File:** `FE/src/services/api.js`

Create Axios instance:
- Base URL from `VITE_API_BASE_URL` env
- Auto-add `Authorization: Bearer <accessToken>` header to all requests
- Intercept 401 responses → trigger token refresh
- Intercept refresh failure → clear auth state + redirect to login

**Structure:**
```javascript
import axios from 'axios';
import authStore from '../stores/auth.store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

// Request interceptor: add token to headers
api.interceptors.request.use(config => {
  const { tokens } = authStore.getState();
  if (tokens.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

// Response interceptor: handle 401 → refresh
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Trigger refresh token logic
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Step 4: Custom Hooks
**File:** `FE/src/hooks/useAuth.js`, `useLogin.js`, `useRegister.js`, `useAuthCheck.js`

**useAuth():**
```javascript
export function useAuth() {
  const { user, isAuthenticated, tokens } = useAuthStore();
  return { user, isAuthenticated, tokens };
}
```

**useLogin():**
```javascript
export function useLogin() {
  const { setTokens, setUser, setLoading, setError } = useAuthStore();
  
  return async (email, password) => {
    setLoading(true);
    try {
      const result = await loginService(email, password);
      setTokens(result.accessToken, result.refreshToken);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
}
```

**useRegister():** Similar pattern

**useAuthCheck():** Hook to run on app mount
```javascript
export function useAuthCheck() {
  const { initializeAuth } = useAuthStore();
  
  useEffect(() => {
    initializeAuth(); // Load tokens from localStorage
  }, []);
}
```

### Step 5: App.jsx Setup
**File:** `FE/src/App.jsx`

```javascript
import { useAuthCheck } from './hooks/useAuthCheck';

export default function App() {
  useAuthCheck(); // Initialize auth on mount
  
  return (
    <div>
      {/* Routes here */}
    </div>
  );
}
```

### Step 6: Environment Configuration
**File:** `FE/.env.example`

Ensure:
```bash
VITE_ENV=development
VITE_API_BASE_URL=http://localhost/api
VITE_REACT_QUERY_DEVTOOLS=true
```

---

## ✅ Acceptance Criteria

- [ ] Zustand store created with all state + actions
- [ ] Auth service layer created with login, register, logout, refresh, getMe
- [ ] HTTP client (Axios) created with token injection + 401 refresh intercept
- [ ] Custom hooks: useAuth, useLogin, useRegister, useAuthCheck
- [ ] Tokens persisted to localStorage with `fitgainer_*` keys
- [ ] App.jsx calls useAuthCheck on mount
- [ ] All code follows ES6+ JavaScript (no TypeScript)
- [ ] All code follows Zustand + Axios patterns
- [ ] 100% unit test coverage for store actions
- [ ] 100% integration test coverage for API service (MSW mocked)
- [ ] ESLint passes (zero warnings)

---

## 🧪 Testing Strategy (TDD)

### Unit Tests: Store Actions
**File:** `FE/src/stores/__tests__/auth.store.test.js`

Test suite:
- `setTokens()` stores tokens correctly
- `setUser()` stores user correctly
- `clearAuth()` clears all state
- `initializeAuth()` loads from localStorage
- `setAccessToken()` updates token only
- `localStorage` is updated when tokens change

### Integration Tests: API Service
**File:** `FE/src/services/__tests__/auth.service.test.js`

Use MSW (Mock Service Worker) to mock backend:
- `login()` with valid credentials → returns tokens + user
- `login()` with invalid credentials → returns 401 error
- `register()` with valid data → returns user
- `register()` with duplicate email → returns 409 error
- `logout()` calls endpoint
- `refreshToken()` with valid refresh → returns new tokens
- `refreshToken()` with invalid refresh → returns 401 error
- `getMe()` returns current user

### Integration Tests: HTTP Client
**File:** `FE/src/services/__tests__/api.test.js`

- Token auto-injected in request headers
- 401 response triggers token refresh
- Refresh failure clears auth state
- Retry failed request after refresh

### Integration Tests: Hooks
**File:** `FE/src/hooks/__tests__/useLogin.test.js`, etc.

- `useLogin()` calls auth service + updates store
- `useAuthCheck()` runs on mount + loads localStorage
- Error handling works correctly

---

## 📁 Files to Create

```
FE/
  src/
    stores/
      auth.store.js           # Zustand auth store
    services/
      api.js                  # Axios HTTP client
      auth.service.js         # Auth API methods
    hooks/
      useAuth.js              # Hook to read auth state
      useLogin.js             # Hook to login
      useRegister.js          # Hook to register
      useAuthCheck.js         # Hook to initialize auth
    __tests__/
      [test files for above]
    App.jsx                   # Update to call useAuthCheck
```

---

## 📊 Test Coverage Goals

- **Total tests:** 40+
- **Coverage:** ≥80% for all files
- **MSW mocks:** All auth endpoints mocked

---

## 🔐 Security Considerations

- ✅ Tokens stored in localStorage (accessible to JS, but secure for SPA)
- ✅ HTTP-only cookies not used (localStorage simpler, JWT in localStorage acceptable)
- ✅ Tokens injected via Authorization header (not in URL)
- ✅ Token refresh interceptor prevents stale tokens
- ✅ Logout clears tokens immediately

**Note:** For production, consider HTTP-only cookies if CSRF protection needed.

---

## 🎯 Success Criteria (QA)

1. `npm test` — All 40+ tests passing, ≥80% coverage
2. `npm run lint` — Zero warnings
3. Frontend can successfully:
   - Call login endpoint → store tokens + user
   - Call register endpoint → store tokens + user
   - Inject tokens in all subsequent requests
   - Refresh token on 401 response
   - Logout → clear all state
4. App initializes auth state on mount (from localStorage)

---

## 📌 Notes

- No TypeScript — plain ES6+ JavaScript
- Zustand for state (simpler than Redux)
- MSW for API mocking in tests
- localStorage for token persistence (simple, suitable for SPA)
- Axios for HTTP (already in CLAUDE.md)

---

## 📝 Definition of Done

- [ ] Code written & all tests passing
- [ ] Code reviewed by `code-reviewer` agent
- [ ] Docs updated in `doc-updater` agent
- [ ] Commit created via `git-commit-and-push`
- [ ] Task marked complete in `spec/mapping/story-to-spec.md`
