# Auth Schema Specification

## 📦 Data Models

---

## Model: User

**Collection:** `users`

**Primary Purpose:** Store user credentials, profile, and role information

**Fields:**

```javascript
{
  _id: ObjectId,                          // MongoDB auto-generated ID
  
  // Identity
  email: String (required, unique),       // Email address (lowercase, trimmed)
                                          // Validation: RFC 5322 format
  
  passwordHash: String (required),        // Bcrypt hash of password
                                          // Rounds: BCRYPT_ROUNDS env (default 10)
  
  // Profile
  role: String (enum, required),          // "User" or "Admin"
                                          // Default: "User"
  
  // Timestamps
  createdAt: Date (default: now),         // Account creation timestamp
  updatedAt: Date (default: now),         // Last profile update
  
  // Session / Activity
  lastLoginAt: Date (optional),           // Last successful login timestamp
  isActive: Boolean (default: true),      // Account status (soft delete support)
}
```

**Indexes:**
```javascript
// Unique email index
db.users.createIndex({ email: 1 }, { unique: true })

// Query for login (email lookup)
db.users.createIndex({ email: 1, isActive: 1 })

// Activity tracking
db.users.createIndex({ lastLoginAt: -1 })
```

**Example Document:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "alice@example.com",
  "passwordHash": "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS...",
  "role": "User",
  "createdAt": ISODate("2026-05-01T10:00:00Z"),
  "updatedAt": ISODate("2026-05-07T15:30:00Z"),
  "lastLoginAt": ISODate("2026-05-07T15:30:00Z"),
  "isActive": true
}
```

---

## Model: RefreshTokenBlacklist (Optional)

**Collection:** `refresh_token_blacklist`

**Primary Purpose:** Track invalidated refresh tokens (for logout functionality)

**Note:** Can be replaced by tracking active sessions instead.

**Fields:**

```javascript
{
  _id: ObjectId,
  
  userId: ObjectId (required),            // Reference to User
  token: String (required),               // Hashed refresh token
  
  blacklistedAt: Date (default: now),     // When token was invalidated
  expiresAt: Date (required),             // Auto-delete after token expiry
                                          // TTL index: expiresAt
}
```

**Indexes:**
```javascript
// TTL index: auto-delete expired entries
db.refresh_token_blacklist.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Query by userId
db.refresh_token_blacklist.createIndex({ userId: 1 })
```

**Alternative: Active Session Tracking**

Instead of blacklist, track active sessions:

```javascript
{
  _id: ObjectId,
  
  userId: ObjectId (required),
  email: String (required),
  role: String (required),
  
  refreshToken: String (required),        // Hashed refresh token
  accessToken: String (required),         // Hashed access token
  
  userAgent: String (optional),           // Browser/client info
  ipAddress: String (optional),           // Client IP
  
  issuedAt: Date (default: now),
  expiresAt: Date (required),             // Auto-delete after refresh token expiry
  
  // TTL index: auto-delete after expiry
}
```

---

## Field Validation Rules

### Email
- **Type:** String
- **Required:** Yes
- **Unique:** Yes (case-insensitive)
- **Format:** Must match RFC 5322 regex
- **Normalization:** Lowercase, trim whitespace
- **Example:** `alice@example.com`

### PasswordHash
- **Type:** String
- **Required:** Yes
- **Algorithm:** bcrypt
- **Rounds:** Configurable via `BCRYPT_ROUNDS` (default: 10)
- **Length:** ~60 characters (bcrypt output)
- **Never store plain text**

### Role
- **Type:** String (Enum)
- **Required:** Yes
- **Valid Values:** `"User"`, `"Admin"`
- **Default:** `"User"`
- **Cannot be null**

### Timestamps
- **Type:** Date (ISO 8601)
- **Required:** Yes (auto-generated)
- **Format:** UTC timezone
- **Example:** `2026-05-07T15:30:00Z`

---

## JWT Token Schema

### Access Token Payload
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "alice@example.com",
  "role": "User",
  "iat": 1715116600,
  "exp": 1715117500
}
```

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Signing Key:** `JWT_SECRET` environment variable

**TTL:** 15 minutes (900 seconds) — configurable via `JWT_EXPIRES_IN`

### Refresh Token Payload
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "alice@example.com",
  "type": "refresh",
  "iat": 1715116600,
  "exp": 1715721400
}
```

**Header:** Same as access token

**Signing Key:** `JWT_SECRET` environment variable

**TTL:** 7 days (604800 seconds) — configurable via `JWT_REFRESH_EXPIRES_IN`

---

## Database Configuration

**URI Format:**
```
mongodb://[username]:[password]@[host]:[port]/[database]
```

**FitGainer Auth Service:**
```
mongodb://localhost:27017/fitgainer-auth
```

**Connection Pool:**
- Min: 5
- Max: 20
- Timeout: 5000ms

---

## Data Integrity Constraints

| Constraint | Rule | Enforcement |
|-----------|------|-------------|
| Email Uniqueness | No two users with same email | Unique index + application validation |
| Role Validity | Only "User" or "Admin" | Mongoose enum validation |
| Password Hash | Must be bcrypt format | Validation at save-time |
| Active Status | Boolean or null | Default true, supports soft delete |
| Email Format | RFC 5322 compliant | Regex validation in User model |

---

## Migration Notes

- Initial schema: Create `users` collection with email + role indexes
- Future: Add `emailVerified`, `phoneNumber`, `avatar` fields if needed
- Token blacklist is optional; can be deferred to session service

---

## 📊 Spec Version

- **Version:** 1.0
- **Last Updated:** 2026-05-07
