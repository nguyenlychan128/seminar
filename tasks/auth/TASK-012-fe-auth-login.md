# TASK-012-fe-auth-login

## 📋 Overview

Create a fully functional Login page component with form validation, API integration, error handling, and user-friendly feedback.

**Dependencies:** TASK-011-fe-auth-setup ✅

**User Stories:** US-001, US-002, US-003

---

## 🎯 Objectives

1. Create LoginPage component with email + password form
2. Implement client-side validation (email format, password length)
3. Integrate with `useLogin()` hook from TASK-011
4. Handle loading state (disable button, show spinner)
5. Display error messages (invalid credentials, server errors)
6. On successful login, store tokens + user in store
7. Redirect to appropriate page based on role:
   - Role "User" → `/dashboard` (workout plan page)
   - Role "Admin" → `/admin` (admin dashboard)
8. All code TDD-first: failing tests → implementation

---

## 🔄 Implementation Flow

### Step 1: LoginPage Component
**File:** `FE/src/pages/auth/LoginPage.jsx`

**Structure:**
```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../../hooks/useLogin';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const login = useLogin();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      // Redirect based on role
      if (role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h1>Login to FitGainer</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
        <p>Don't have an account? <a href="/register">Register here</a></p>
      </form>
    </div>
  );
}
```

### Step 2: Client-Side Validation
**Helper:** `FE/src/utils/validation.js`

```javascript
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateLoginForm = (email, password) => {
  const errors = {};
  
  if (!email) errors.email = 'Email is required';
  else if (!validateEmail(email)) errors.email = 'Invalid email format';
  
  if (!password) errors.password = 'Password is required';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
  
  return errors;
};
```

### Step 3: Update LoginPage with Validation
Add validation to form submission:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const errors = validateLoginForm(email, password);
  if (Object.keys(errors).length > 0) {
    setError(errors.email || errors.password);
    return;
  }
  
  setError('');
  setLoading(true);
  try {
    await login(email, password);
    if (role === 'Admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  } catch (err) {
    setError(err.message || 'Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### Step 4: Styling with TailwindCSS
Add TailwindCSS classes to LoginPage:
```javascript
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
  <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Login to FitGainer</h1>
    
    {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
    
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      />
      
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      />
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
    
    <p className="mt-4 text-center text-gray-600">
      Don't have an account? <a href="/register" className="text-blue-600 hover:underline">Register here</a>
    </p>
  </div>
</div>
```

### Step 5: Error Handling Strategy
**Error scenarios:**
1. **400 Bad Request** — Missing/invalid email or password
   - Display: "Invalid email or password"
2. **401 Unauthorized** — Credentials don't match
   - Display: "Invalid email or password"
3. **409 Conflict** — Should not happen on login, but handle gracefully
4. **500 Server Error** — Database or server issue
   - Display: "Server error. Please try again later"

Map error codes from `auth.service.js`:
```javascript
const errorMessages = {
  'INVALID_CREDENTIALS': 'Invalid email or password',
  'VALIDATION_ERROR': 'Please check your input and try again',
  'SERVER_ERROR': 'Server error. Please try again later',
  'NETWORK_ERROR': 'Network error. Please check your connection'
};
```

---

## ✅ Acceptance Criteria

- [ ] LoginPage component created with form inputs (email, password)
- [ ] Form submission calls `useLogin()` hook
- [ ] Client-side validation:
  - Email format validated
  - Password min length checked (8 chars)
- [ ] Loading state:
  - Button disabled while loading
  - Text changes to "Logging in..."
- [ ] Error handling:
  - 401 errors display "Invalid email or password"
  - 400 errors display specific validation error
  - 500 errors display generic server error
- [ ] On success:
  - Tokens stored in auth store (from TASK-011)
  - User info stored in auth store
  - Redirect based on role: Admin → `/admin`, User → `/dashboard`
- [ ] No TypeScript — plain JavaScript
- [ ] Styled with TailwindCSS + shadcn/ui (form components if available)
- [ ] 100% unit test coverage (component logic)
- [ ] 100% integration test coverage (form submission + API)

---

## 🧪 Testing Strategy (TDD)

### Unit Tests: LoginPage Component
**File:** `FE/src/pages/auth/__tests__/LoginPage.test.jsx`

Test suite:
- Renders form with email and password inputs
- Email input accepts user input
- Password input accepts user input
- Form submission prevents default
- Form submission calls login() hook
- Loading state disables button
- Error message displays when login fails
- Success redirects to `/dashboard` for User role
- Success redirects to `/admin` for Admin role

### Unit Tests: Validation Utils
**File:** `FE/src/utils/__tests__/validation.test.js`

Test suite:
- `validateEmail()` returns true for valid emails
- `validateEmail()` returns false for invalid emails
- `validateLoginForm()` returns errors for missing fields
- `validateLoginForm()` returns errors for invalid format
- `validateLoginForm()` returns empty object for valid input

### Integration Tests: Login Flow
**File:** `FE/src/pages/auth/__tests__/LoginPage.integration.test.jsx`

Use MSW to mock `/api/auth/login` endpoint:
- User enters email and password
- User submits form
- Request is sent to backend
- Response succeeds with tokens + user
- Auth store is updated
- User redirected to dashboard

Error scenarios:
- Invalid credentials (401) → error message displayed
- Validation error (400) → specific error shown
- Server error (500) → generic error shown
- Network error → handled gracefully

### Integration Tests: Role-Based Redirect
- Login as User → redirected to `/dashboard`
- Login as Admin → redirected to `/admin`

---

## 📁 Files to Create/Update

```
FE/
  src/
    pages/
      auth/
        LoginPage.jsx                    # NEW
        __tests__/
          LoginPage.test.jsx             # NEW
          LoginPage.integration.test.jsx # NEW
    utils/
      validation.js                      # NEW
      __tests__/
        validation.test.js               # NEW
    stores/
      auth.store.js                      # UPDATED (if needed)
    hooks/
      useLogin.js                        # UPDATED (ensure error handling)
```

---

## 📊 Test Coverage Goals

- **Total tests:** 35+
- **Coverage:** ≥80% for LoginPage component
- **MSW mocks:** Login endpoint fully mocked

---

## 🎯 Success Criteria (QA)

1. `npm test` — All tests passing, ≥80% coverage
2. `npm run lint` — Zero warnings
3. Manual testing:
   - [x] Valid credentials → login succeeds, redirect works
   - [x] Invalid credentials → error message shown
   - [x] Empty fields → validation error shown
   - [x] Network error → graceful fallback
   - [x] Loading state works (button disabled, text changes)

---

## 📌 Notes

- Email validation uses simple regex (not RFC 5322, for frontend simplicity)
- Backend validates password strength (frontend just checks length)
- Role-based redirect assumes `useAuth()` updates immediately after login
- Error messages are user-friendly (no technical details)
- Styling uses TailwindCSS; shadcn/ui components optional (if available)

---

## 📝 Definition of Done

- [ ] LoginPage.jsx created with full form + validation
- [ ] useLogin() hook integrated and working
- [ ] Client-side validation implemented
- [ ] Error handling covers all scenarios
- [ ] Role-based redirect working (Admin vs User)
- [ ] All 35+ tests passing, ≥80% coverage
- [ ] Code reviewed by `code-reviewer` agent
- [ ] Docs updated by `doc-updater` agent
- [ ] Commit created via `git-commit-and-push`
- [ ] Task marked complete
