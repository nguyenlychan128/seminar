# TASK-013-fe-auth-register

## 📋 Overview

Create a fully functional Register page component with form validation, API integration, error handling, and password confirmation verification.

**Dependencies:** TASK-011-fe-auth-setup, TASK-012-fe-auth-login ✅

**User Stories:** US-005

---

## 🎯 Objectives

1. Create RegisterPage component with email, password, confirm password form
2. Implement strong client-side validation:
   - Email format (RFC 5322 basic)
   - Password strength (min 8 chars, uppercase, lowercase, number, special char)
   - Password confirmation match
3. Integrate with `useRegister()` hook from TASK-011
4. Handle loading state (disable button, show spinner)
5. Display specific error messages for validation failures
6. Handle registration errors (email already exists, server errors)
7. On successful registration:
   - Auto-login user (store tokens + user)
   - Redirect to `/dashboard` (User role by default)
8. All code TDD-first: failing tests → implementation

---

## 🔄 Implementation Flow

### Step 1: RegisterPage Component
**File:** `FE/src/pages/auth/RegisterPage.jsx`

**Structure:**
```javascript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegister } from '../../hooks/useRegister';
import { validateRegisterForm } from '../../utils/validation';

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useRegister();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    // Client-side validation
    const errors = validateRegisterForm(email, password, confirmPassword);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setLoading(true);
    try {
      await register(email, password, confirmPassword);
      // Auto-redirect on success
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'EMAIL_EXISTS') {
        setError('Email is already registered. Try logging in.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create FitGainer Account</h1>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {fieldErrors.email && <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>}
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {fieldErrors.password && <p className="text-red-600 text-sm mt-1">{fieldErrors.password}</p>}
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {fieldErrors.confirmPassword && <p className="text-red-600 text-sm mt-1">{fieldErrors.confirmPassword}</p>}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded disabled:bg-gray-400"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        
        <p className="mt-4 text-center text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
}
```

### Step 2: Enhanced Validation Utils
**File:** `FE/src/utils/validation.js` (Update from TASK-012)

Add register validation:
```javascript
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // Must have: min 8 chars, uppercase, lowercase, number, special char
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
};

export const validateRegisterForm = (email, password, confirmPassword) => {
  const errors = {};
  
  // Email validation
  if (!email) errors.email = 'Email is required';
  else if (!validateEmail(email)) errors.email = 'Invalid email format';
  
  // Password validation
  if (!password) errors.password = 'Password is required';
  else if (!validatePassword(password)) {
    errors.password = 'Password must have min 8 chars, uppercase, lowercase, number, special char';
  }
  
  // Confirm password validation
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
  
  return errors;
};
```

### Step 3: useRegister Hook (from TASK-011)
Ensure `FE/src/hooks/useRegister.js` includes:
```javascript
import { useAuthStore } from '../stores/auth.store';
import { register as registerService } from '../services/auth.service';

export function useRegister() {
  const { setTokens, setUser, setLoading, setError } = useAuthStore();
  
  return async (email, password, confirmPassword) => {
    setLoading(true);
    try {
      const result = await registerService(email, password, confirmPassword);
      // Backend returns user info, not tokens (need to auto-login)
      // Caller should handle auto-login or separate login call
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

### Step 4: Update RegisterPage for Auto-Login
After registration succeeds, trigger auto-login:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setFieldErrors({});
  
  const errors = validateRegisterForm(email, password, confirmPassword);
  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors);
    return;
  }
  
  setLoading(true);
  try {
    // 1. Register user
    await register(email, password, confirmPassword);
    
    // 2. Auto-login (call login with same credentials)
    const loginResult = await login(email, password);
    
    // 3. Redirect
    navigate('/dashboard');
  } catch (err) {
    if (err.response?.status === 409) {
      setError('Email is already registered. Try logging in.');
    } else {
      setError(err.message || 'Registration failed. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};
```

### Step 5: Password Strength Feedback
Add real-time password strength indicator:
```javascript
const getPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;
  return strength;
};

// In JSX:
{password && (
  <div className="mt-2">
    <div className="text-sm text-gray-600">Password strength: {getPasswordStrength(password)}/5</div>
    <div className="w-full bg-gray-300 rounded h-2 mt-1">
      <div
        className="bg-green-500 h-2 rounded"
        style={{ width: `${(getPasswordStrength(password) / 5) * 100}%` }}
      />
    </div>
  </div>
)}
```

---

## ✅ Acceptance Criteria

- [ ] RegisterPage component created with email, password, confirm password inputs
- [ ] Form submission calls `useRegister()` hook
- [ ] Client-side validation:
  - Email format validated
  - Password strength enforced (8 chars, upper, lower, number, special)
  - Confirm password matches password
- [ ] Loading state:
  - Button disabled while loading
  - Text changes to "Creating account..."
- [ ] Error handling:
  - 409 (email exists) → "Email already registered"
  - Validation errors → field-specific error messages
  - 500 (server error) → generic error message
- [ ] On success:
  - User auto-logged in (tokens stored)
  - Redirect to `/dashboard`
- [ ] Password strength indicator displayed (real-time feedback)
- [ ] No TypeScript — plain JavaScript
- [ ] Styled with TailwindCSS
- [ ] 100% unit test coverage (component logic)
- [ ] 100% integration test coverage (registration + auto-login)

---

## 🧪 Testing Strategy (TDD)

### Unit Tests: RegisterPage Component
**File:** `FE/src/pages/auth/__tests__/RegisterPage.test.jsx`

Test suite:
- Renders form with email, password, confirm password inputs
- Inputs accept user input correctly
- Form submission prevents default
- Form submission calls register() hook
- Password strength indicator updates in real-time
- Loading state disables button
- Error messages display when registration fails
- Success triggers auto-login and redirects to `/dashboard`

### Unit Tests: Password Validation
**File:** `FE/src/utils/__tests__/validation.test.js` (extend from TASK-012)

Test suite:
- `validatePassword()` returns true for strong passwords
- `validatePassword()` returns false for weak passwords
- `validatePassword()` checks all 5 criteria (length, upper, lower, number, special)
- `validateRegisterForm()` validates all 3 fields
- `validateRegisterForm()` checks password match
- Error messages are specific and helpful

### Integration Tests: Registration Flow
**File:** `FE/src/pages/auth/__tests__/RegisterPage.integration.test.jsx`

Use MSW to mock both `/api/auth/register` and `/api/auth/login`:
- User enters email, password, confirm password
- User submits form
- Registration succeeds (201 Created)
- Auto-login succeeds (tokens returned)
- Auth store updated with tokens + user
- User redirected to `/dashboard`

Error scenarios:
- Email already exists (409) → error message displayed
- Weak password (400) → backend validation error
- Passwords don't match (local validation) → field error shown
- Server error (500) → generic error message

### Password Strength Tests
- Password "weak" → strength 1/5
- Password "Medium1!" → strength 4/5
- Password "StrongP@ssw0rd!" → strength 5/5

---

## 📁 Files to Create/Update

```
FE/
  src/
    pages/
      auth/
        RegisterPage.jsx                    # NEW
        __tests__/
          RegisterPage.test.jsx             # NEW
          RegisterPage.integration.test.jsx # NEW
    utils/
      validation.js                         # UPDATED (add register validation)
      __tests__/
        validation.test.js                  # UPDATED (add password validation tests)
    hooks/
      useRegister.js                        # VERIFY from TASK-011
    services/
      auth.service.js                       # VERIFY (register method exists)
```

---

## 📊 Test Coverage Goals

- **Total tests:** 40+
- **Coverage:** ≥80% for RegisterPage component
- **Password validation:** 100% coverage

---

## 🎯 Success Criteria (QA)

1. `npm test` — All tests passing, ≥80% coverage
2. `npm run lint` — Zero warnings
3. Manual testing:
   - [x] Valid registration data → account created, auto-login, redirect works
   - [x] Duplicate email → error message shown
   - [x] Weak password → validation error shown
   - [x] Mismatched passwords → specific error shown
   - [x] Password strength indicator works
   - [x] Loading state works (button disabled, text changes)

---

## 📌 Notes

- Password strength check is client-side; backend also validates (defense in depth)
- Auto-login after registration improves UX (seamless onboarding)
- Password strength indicator provides real-time feedback
- Email validation is basic (backend uses RFC 5322)
- Error messages are user-friendly and actionable

---

## 📝 Definition of Done

- [ ] RegisterPage.jsx created with full form + validation
- [ ] Password strength validation implemented
- [ ] Password strength indicator displayed
- [ ] useRegister() hook integrated
- [ ] Auto-login after registration working
- [ ] Error handling covers all scenarios (409, validation, 500)
- [ ] All 40+ tests passing, ≥80% coverage
- [ ] Code reviewed by `code-reviewer` agent
- [ ] Docs updated by `doc-updater` agent
- [ ] Commit created via `git-commit-and-push`
- [ ] Task marked complete
