# Auth Business Rules & Validation

## 🔐 Authentication Rules

### Rule 1: User Registration Validation

**When:** User submits registration form

**Conditions:**
- Email format must be valid (RFC 5322)
- Email must be unique in the system
- Password must be strong

**Action:**
- Create new user with role = "User"
- Hash password with bcrypt
- Return user ID and success message

**Error Handling:**
- If email invalid → Return 400 with message: "Invalid email format"
- If email exists → Return 409 with message: "Email already registered"
- If password weak → Return 400 with message: "Password does not meet requirements"

### Rule 2: Password Strength Requirements

**Minimum Length:** 8 characters

**Character Requirements:**
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*-_+=)

**Examples:**
- ✅ Valid: `SecurePass123!`
- ❌ Invalid: `password123` (no uppercase, no special char)
- ❌ Invalid: `Pass!` (less than 8 chars)

### Rule 3: User Login Authentication

**When:** User submits login credentials

**Conditions:**
- Email exists in database
- Email is active (`isActive: true`)
- Password matches stored hash

**Action:**
- Update `lastLoginAt` to current timestamp
- Issue JWT access token (TTL: 15m)
- Issue JWT refresh token (TTL: 7d)
- Return tokens + user info (userId, email, role)

**Error Handling:**
- If email not found → Return 401: "Invalid email or password"
- If account inactive → Return 401: "Account is disabled"
- If password mismatch → Return 401: "Invalid email or password"

**Security:** Use constant-time comparison for password verification (prevent timing attacks)

### Rule 4: Token Validation

**When:** Protected route is accessed with Authorization header

**Conditions:**
- Authorization header exists and format: `Bearer <token>`
- Token signature is valid (signed with correct JWT_SECRET)
- Token is not expired

**Action:**
- Decode token and extract userId, email, role
- Inject into `req.user` object
- Allow request to proceed

**Error Handling:**
- If header missing → Return 401: "Missing authorization token"
- If format invalid → Return 401: "Invalid authorization header format"
- If signature invalid → Return 401: "Invalid token signature"
- If token expired → Return 401: "Token expired. Please refresh."

### Rule 5: Token Refresh Flow (TASK-005: Complete)

**When:** Frontend calls `/api/auth/refresh` with refresh token

**Conditions:**
- Refresh token is provided in request body
- Refresh token signature is valid
- Refresh token is not expired
- User exists in database (full validation, not just JWT claims)
- User account is active (isActive === true)
- Refresh token is not blacklisted (if using blacklist strategy)

**Action:**
- Verify refresh token JWT signature and expiration
- Look up user by userId from token payload in database
- Check user.isActive flag
- Read current user.role from database (ensures role changes are reflected)
- Issue new access token (TTL: 15m, with fresh claims from DB)
- Issue new refresh token (TTL: 7d)
- If using refresh token rotation: add old refresh token to blacklist
- Return new tokens

**Error Handling:**
- If refresh token missing → Return 400: "Missing refresh token"
- If refresh token invalid → Return 401: "Invalid refresh token"
- If refresh token expired → Return 401: "Refresh token expired. Please log in again."
- If user not found in database → Return 401: "User not found"
- If user account disabled → Return 401: "Account is disabled"
- If token signature invalid → Return 403: "Invalid token signature"
- If refresh token blacklisted → Return 401: "Refresh token revoked"

**Implementation Details (TASK-005):**
- Database lookup is mandatory (not just JWT verification)
- User validation flow: token verify → DB lookup → status check → role fetch from DB
- Prevents stale token issues (if user role changed or account disabled)
- Audit logging: tracks refresh events with userId and timestamp

### Rule 6: User Logout (TASK-007: Complete)

**When:** User clicks logout or session expires

**Conditions:**
- User has valid access token in Authorization header
- MVP: No server-side token blacklist (tokens valid until JWT expiry)

**Action:**
- Validate access token via authenticate middleware
- Log logout event with userId, email, timestamp, IP, User-Agent
- Client clears stored tokens (handled by frontend)
- Return 200 success response (idempotent)

**Error Handling:**
- If token invalid or missing → Return 401: "Missing authorization token" (via authenticate middleware)
- If token expired → Return 401: "Token expired. Please refresh." (via authenticate middleware)
- Still return 200 on success even if called multiple times (idempotent)

---

## 👥 Role-Based Access Control (RBAC)

### Role: User

**Permissions:**
- View own profile (GET `/api/user/profile`)
- Update own body info (PUT `/api/user/profile`)
- View workout plan (GET `/api/workout/plan`)
- Execute workout (POST `/api/workout/execute`)
- Log progress (POST `/api/progress/log`)
- View progress charts (GET `/api/progress/charts`)
- Chat with chatbot (POST `/api/chatbot/ask`)

**Restrictions:**
- Cannot access `/api/admin/*` routes
- Cannot view other users' data
- Cannot modify system exercises

### Role: Admin

**Permissions:**
- All User permissions
- Manage exercises (CRUD: `/api/admin/exercises/*`)
- Manage users (CRUD: `/api/admin/users/*`)
- Manage workout templates (CRUD: `/api/admin/templates/*`)
- View system analytics
- View audit logs

**Restrictions:**
- Cannot modify business rules without code deployment

### Enforcement Strategy

```javascript
// Middleware: Check role
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

// Usage
app.get("/api/admin/users", requireRole(["Admin"]), getUsers);
app.get("/api/user/profile", requireRole(["User", "Admin"]), getProfile);
```

---

## 🔒 Security Rules

### Rule 7: Password Storage

**Never store plain-text passwords**

- Use bcrypt for hashing
- Hash rounds: `BCRYPT_ROUNDS` env (default: 10)
- Store only the hash in `passwordHash` field

**Example:**
```javascript
const bcrypt = require('bcrypt');
const plainPassword = "SecurePass123!";
const saltRounds = process.env.BCRYPT_ROUNDS || 10;
const hash = await bcrypt.hash(plainPassword, saltRounds);
// Store hash in DB
```

### Rule 8: JWT Secret Management

**Requirements:**
- `JWT_SECRET` must be:
  - At least 32 characters long
  - Stored in environment variables (never in code)
  - Changed when rotated
  - Different across environments

**Rotation Strategy:**
- Old tokens remain valid until expiry
- New tokens signed with new secret
- Gradual rollout over 24 hours

### Rule 9: HTTPS Enforcement

**All auth endpoints must use HTTPS** (enforced at Nginx level)

- Redirect HTTP → HTTPS
- Set `Secure` flag on cookies
- Prevent token transmission over unencrypted channels

### Rule 10: Token Claims Minimalism

**Access Token should contain only:**
- `userId` (MongoDB ObjectId)
- `email` (for logging/debugging)
- `role` (for authorization)
- `iat` (issued at)
- `exp` (expiration)

**Do not include:**
- User's full name, phone, address
- Permissions list (derive from role)
- Sensitive system info

### Rule 11: CORS & Origin Validation

**Allowed origins (configurable per environment):**

**Development:**
```
http://localhost:3000
http://localhost:5173
```

**Production:**
```
https://fitgainer.example.com
```

**Policy:** Enforce at Nginx level before requests reach auth-service

### Rule 12: Rate Limiting ✅ IMPLEMENTED

**Endpoints to protect:**
- POST `/api/auth/login` — 5 attempts per 15 minutes per IP
- POST `/api/auth/register` — 3 accounts per 24 hours per IP
- POST `/api/auth/refresh` — No limit (users refresh frequently)

**Implementation:** In-memory rate limiter with window expiry logic (TASK-009 ✅)

**Implementation Details (TASK-009: 2026-05-15):**
- Middleware: src/middleware/rateLimit.js with createRateLimiter factory
- Storage: In-memory hash map { ip:path: { count, resetTime } }
- Window tracking: Request count + expiry timestamp per IP+endpoint
- Configuration: Environment variables for flexible limits
  - RATE_LIMIT_LOGIN_WINDOW=900 (seconds)
  - RATE_LIMIT_LOGIN_MAX_ATTEMPTS=5
  - RATE_LIMIT_REGISTER_WINDOW=86400 (seconds)
  - RATE_LIMIT_REGISTER_MAX_ACCOUNTS=3
  - RATE_LIMIT_ENABLED=true
- Response on limit exceeded: 429 with retryAfter header and generic message
- Security: IP-based isolation, no rate limit on refresh, prevents brute-force attacks
- Testing: 27 unit + 27 integration tests, 100% coverage for rate limiting module
- Future enhancement: Redis-based rate limiter for distributed instances

---

## 📋 Validation Rules Summary

| Field | Validation | Example |
|-------|-----------|---------|
| email | RFC 5322 format, unique | `user@example.com` |
| password | Min 8 chars, 1 upper, 1 lower, 1 digit, 1 special | `SecurePass123!` |
| role | Enum: "User" or "Admin" | `"User"` |
| token | HS256 signature, not expired | JWT string |

---

## 🚀 Integration Rules

### Rule 13: Cross-Service Communication

**Auth-service → Other Services:**
- When issuing token, include `userId` in JWT
- Other services validate token signature using shared `JWT_SECRET`
- No separate auth call to auth-service needed (stateless)

**Example: User-service calls**
```javascript
// user-service middleware
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
```

### Rule 14: Audit Logging (TASK-007: Complete)

**Log events:**
- Registration: new user account created (TASK-003) ✅
- Login: successful authentication (userId, email, timestamp, IP, User-Agent) (TASK-004) ✅
- Login failed: invalid credentials (email, reason) (TASK-004) ✅
- Logout: token invalidation (userId, email, timestamp, IP, User-Agent) (TASK-007) ✅
- Token refresh: new token issued (userId, email, timestamp) (TASK-005) ✅
- Role change: if admin promotes user to admin (future)

**Format:** Structured JSON with timestamp using Winston logger
**Implementation:** All events logged to `logs/app.log` and console in development mode

---

## 📊 Spec Version

- **Version:** 1.2
- **Last Updated:** 2026-05-15
- **Status:** Rules 1-6, 12, 14 implemented (Rate Limiting complete via TASK-009, 2026-05-15)
