# Auth Feature Specification

## 📌 Overview

The Authentication & Authorization feature provides secure user identity management and role-based access control for the FitGainer application. Users can register, log in, log out, and refresh their session tokens. The system enforces role-based access (User / Admin) to protect resources.

---

## 🎯 Core Responsibilities

1. **User Registration** — Create new user accounts with email and password
2. **User Login** — Authenticate users and issue JWT tokens
3. **Session Refresh** — Extend user session without re-authenticating
4. **User Logout** — Invalidate user sessions
5. **Role-Based Access Control** — Enforce User vs Admin permissions
6. **Token Validation** — Verify and decode JWT tokens in requests

---

## 📋 Related User Stories

| ID | Story | Status |
|----|-------|--------|
| US-001 | As a user/admin, I want to log in to the system | In Scope |
| US-002 | When I log in as User, I should be redirected to workout plan page | In Scope |
| US-003 | When I log in as Admin, I should be redirected to admin page | In Scope |
| US-004 | As a user/admin, I want to log out from the system | In Scope |
| US-005 | User registration and account creation | In Scope |
| US-006 | Token refresh mechanism for session management | In Scope |

---

## 🔄 Service Interactions

- **auth-service** (Port 3001) — Core authentication logic, JWT issuance/validation
- **Nginx Gateway** — Route auth endpoints, enforce CORS
- **MongoDB** — Store user credentials, roles, and session metadata

---

## 🛡️ Key Features

### Feature 1: User Registration
- Accept email, password, confirm password
- Validate email format (RFC 5322)
- Hash password using bcrypt (rounds: configurable)
- Store user with default role: "User"
- Return success with user ID

### Feature 2: User Login
- Accept email and password
- Verify credentials against stored hash
- Issue JWT access token (TTL: 15m)
- Issue JWT refresh token (TTL: 7d)
- Return tokens + user role
- Log login event for audit

### Feature 3: Token Refresh
- Accept valid refresh token
- Verify signature and expiry
- Issue new access token
- Return new access token + refresh token

### Feature 4: User Logout
- Invalidate refresh token (optional: blacklist or track)
- Client clears local tokens
- Clear user session

### Feature 5: Role-Based Access Control
- User role: "User" — access user features (workout, progress)
- Admin role: "Admin" — access admin features (user management, exercise library)
- Middleware enforces role checks on protected routes

---

## 🔐 Security Requirements

- **Password Storage:** bcrypt with 10+ rounds (configurable via `BCRYPT_ROUNDS`)
- **JWT Signing:** Use `JWT_SECRET` (min 32 chars in production)
- **Token Expiry:** Access=15m, Refresh=7d
- **HTTPS Only:** All auth endpoints must use HTTPS (enforced at Nginx)
- **CORS:** Configured per environment
- **Rate Limiting:** Prevent brute-force login attempts (optional, recommended)
- **No sensitive data in JWT payload:** Only userId, role, email (hashed if needed)

---

## 📊 Status

- **Spec Version:** 1.0
- **Created:** 2026-05-07
- **Owner:** Engineering Team
- **Priority:** P0 (Core feature)
