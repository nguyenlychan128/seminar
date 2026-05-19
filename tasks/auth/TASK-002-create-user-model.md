# TASK-002: Create User Model & Database Connection

## 🎯 Objective

Implement Mongoose User schema with validation, database connection logic, and integration tests for the User model.

---

## 📋 Acceptance Criteria

- [ ] `src/models/User.js` created with Mongoose schema matching spec
- [ ] User schema fields: email, passwordHash, role, createdAt, updatedAt, lastLoginAt, isActive
- [ ] Email validation: RFC 5322 format, lowercase, unique index
- [ ] Role enum validation: "User" or "Admin", default "User"
- [ ] MongoDB indexes created:
  - Unique on email
  - Composite on (email, isActive)
  - Descending on lastLoginAt
- [ ] `src/config/database.js` created with MongoDB connection logic
- [ ] Connection pool configured: min 5, max 20, timeout 5000ms
- [ ] Environment variable: MONGO_URI reads from `.env`
- [ ] Integration tests in `tests/integration/models.test.js`:
  - User model instantiation
  - Email validation (valid/invalid formats)
  - Email uniqueness enforcement
  - Role enum validation
  - Timestamps auto-generation
  - isActive default to true
- [ ] Tests use MongoMemoryServer (no external DB)
- [ ] Test coverage ≥ 80% for User model
- [ ] Error messages are clear and user-friendly

---

## 🔗 Related Spec Files

- `spec/features/auth/schema.spec.md` — User model & field definitions
- `spec/features/auth/rules.spec.md` — Rule 7 (password storage), field validation

---

## 📝 Implementation Notes

1. **User Schema Structure:**
   ```javascript
   {
     email: {
       type: String,
       required: true,
       unique: true,
       lowercase: true,
       trim: true,
       match: [RFC5322_REGEX, "Invalid email format"]
     },
     passwordHash: {
       type: String,
       required: true,
       minlength: 60  // bcrypt output length
     },
     role: {
       type: String,
       enum: ["User", "Admin"],
       default: "User",
       required: true
     },
     createdAt: {
       type: Date,
       default: Date.now
     },
     updatedAt: {
       type: Date,
       default: Date.now
     },
     lastLoginAt: {
       type: Date,
       default: null
     },
     isActive: {
       type: Boolean,
       default: true
     }
   }
   ```

2. **Indexes:**
   ```javascript
   // Unique email
   userSchema.index({ email: 1 }, { unique: true });
   
   // Login query optimization
   userSchema.index({ email: 1, isActive: 1 });
   
   // Activity tracking
   userSchema.index({ lastLoginAt: -1 });
   ```

3. **Validation:**
   - Email: Must match RFC 5322 regex, lowercase before save
   - Role: Enum ["User", "Admin"] only
   - PasswordHash: No validation (bcrypt hash format varies)
   - IsActive: Boolean only

4. **Database Connection:**
   - Connection string from MONGO_URI env var
   - Pool: min 5, max 20
   - Timeout: 5000ms
   - Graceful shutdown: close connection on process exit
   - Retry logic: optional (Mongoose auto-retries by default)

5. **Error Handling:**
   - Email already exists → E11000 duplicate key error → Translate to meaningful message
   - Invalid email format → Mongoose validation error → Clear message
   - Connection failure → Log and throw with context

---

## 🚀 Subtasks

1. **Create RFC 5322 email regex** — src/utils/validators.js
2. **Create User schema** — src/models/User.js with all fields & indexes
3. **Create database config** — src/config/database.js with connection logic
4. **Create connection handler** — src/server.js connects to DB on startup
5. **Write integration tests** — tests/integration/models.test.js with MongoMemoryServer
6. **Test email validation** — Valid, invalid, unique, case-insensitive tests
7. **Test role validation** — Enum enforcement, default value
8. **Test timestamps** — Auto-generation, updatedAt on modification
9. **Test isActive** — Default true, soft delete support
10. **Verify indexes** — Test that indexes are created correctly

---

## ✅ Definition of Done

- User model code complete and matches spec
- Database connection logic implemented and tested
- MongoMemoryServer integration tests pass (no external DB required)
- Test coverage ≥ 80%
- No plaintext passwords in schema (passwordHash only)
- All email validation rules enforced
- Role enum enforced (no free-text roles)
- Error messages are clear
- `.env` variables properly loaded

---

## 🔄 Next Steps

After this task:
- **TASK-003:** Implement password hashing utilities (bcrypt)
- **TASK-004:** Implement registration endpoint

---

## 📊 Task Metadata

- **Priority:** P0 (Foundation)
- **Effort:** 2-3 hours
- **Owner:** Backend Team
- **Depends On:** TASK-001
- **Created:** 2026-05-07
