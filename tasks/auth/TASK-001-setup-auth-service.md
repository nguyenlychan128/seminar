# TASK-001: Setup Auth Service Scaffolding

## 🎯 Objective

Create the basic auth-service project structure with Express, MongoDB, JWT, and bcrypt. Set up environment configuration, project layout, and testing infrastructure (Jest + Supertest + MongoMemoryServer).

---

## 📋 Acceptance Criteria

- [ ] auth-service directory created at `BE/auth-service/` with standard project layout
- [ ] `package.json` created with all dependencies (express, mongoose, jsonwebtoken, bcrypt, dotenv, winston, jest, supertest, mongodb-memory-server)
- [ ] `.env.example` file with all required environment variables (PORT=3001, MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN, BCRYPT_ROUNDS, LOG_LEVEL)
- [ ] `Dockerfile` created and builds successfully
- [ ] `.gitignore` configured (node_modules, .env, dist, coverage, logs)
- [ ] Directory structure created:
  - `src/` — Application code
  - `src/models/` — Mongoose schemas
  - `src/routes/` — Express route handlers
  - `src/middleware/` — Auth, validation, error handling
  - `src/services/` — Business logic
  - `src/utils/` — Helpers (jwt, bcrypt, validation)
  - `tests/unit/` — Unit tests
  - `tests/integration/` — Integration tests
  - `logs/` — Log output (gitignored)
- [ ] `src/server.js` created as entry point
- [ ] `src/app.js` created to configure Express app
- [ ] Jest configuration in `jest.config.js` with coverage threshold ≥ 80%
- [ ] Winston logger configured in `src/utils/logger.js`
- [ ] GitHub Actions or CI script references Jest + Docker build

---

## 🔗 Related Spec Files

- `spec/features/auth/feature.spec.md` — Feature overview
- `spec/features/auth/schema.spec.md` — User model structure
- `spec/features/auth/rules.spec.md` — Business rules

---

## 📝 Implementation Notes

1. **Tech Stack:**
   - Runtime: Node.js v18+ (or latest LTS)
   - Package Manager: npm
   - Framework: Express (plain, no NestJS)
   - ORM: Mongoose (MongoDB)
   - Auth: jsonwebtoken (JWT), bcrypt
   - Testing: Jest + Supertest + MongoMemoryServer
   - Logging: Winston

2. **Environment Variables:**
   ```bash
   NODE_ENV=development
   PORT=3001
   MONGO_URI=mongodb://localhost:27017/fitgainer-auth
   JWT_SECRET=your-secret-key-min-32-chars
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   BCRYPT_ROUNDS=10
   LOG_LEVEL=debug
   OTEL_SERVICE_NAME=auth-service
   OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
   ```

3. **Project Structure:**
   ```
   BE/auth-service/
   ├── src/
   │   ├── server.js              # Entry point
   │   ├── app.js                 # Express app config
   │   ├── models/
   │   │   └── User.js            # Mongoose User schema
   │   ├── routes/
   │   │   └── auth.routes.js     # Auth endpoints (placeholder)
   │   ├── middleware/
   │   │   ├── errorHandler.js    # Error handling
   │   │   └── validators.js      # Request validation
   │   ├── services/
   │   │   └── authService.js     # Auth business logic (placeholder)
   │   └── utils/
   │       ├── logger.js          # Winston logger
   │       ├── jwt.js             # JWT utilities (placeholder)
   │       └── validators.js      # Email, password validation
   ├── tests/
   │   ├── unit/
   │   │   └── .gitkeep
   │   └── integration/
   │       └── .gitkeep
   ├── .env.example
   ├── .gitignore
   ├── Dockerfile
   ├── jest.config.js
   ├── package.json
   └── README.md
   ```

4. **Testing Setup:**
   - Jest: Unit tests in `tests/unit/`, integration in `tests/integration/`
   - MongoMemoryServer: Auto-start for integration tests, no external DB needed
   - Supertest: HTTP assertions for endpoint testing
   - Coverage threshold: 80% minimum

5. **Docker:**
   - Multi-stage build (optional, for production)
   - Expose port 3001
   - Health check endpoint: `GET /health` (optional, for Kubernetes)

---

## 🚀 Subtasks

1. **Create project structure** — mkdir, touch files, organize folders
2. **Initialize package.json** — `npm init -y` + manually add scripts
3. **Install dependencies** — `npm install` all required packages
4. **Create .env.example** — Template with all env vars
5. **Configure Jest** — jest.config.js with MongoDB Memory Server
6. **Create Dockerfile** — Multi-stage build, lean image
7. **Create .gitignore** — Standard Node.js + logs
8. **Setup Winston logger** — src/utils/logger.js for structured logging
9. **Create Express app** — src/app.js (basic routes, error handler)
10. **Create entry point** — src/server.js to start server
11. **Add npm scripts** — start, dev, test, test:watch, lint (if eslint added)
12. **Verify build** — `npm install` and `npm test` pass locally

---

## ✅ Definition of Done

- Service scaffolding complete and functional
- All npm dependencies installed without errors
- `npm test` runs successfully (even if 0 tests exist)
- `docker build .` succeeds without errors
- `.env.example` covers all variables used in code
- Directory structure matches spec above
- No hardcoded secrets in code or Dockerfile
- README.md documents setup and running instructions

---

## 🔄 Next Steps

After this task:
- **TASK-002:** Create User model and database connection
- **TASK-003:** Implement registration endpoint with validation

---

## 📊 Task Metadata

- **Priority:** P0 (Foundation)
- **Effort:** 2-3 hours
- **Owner:** Backend Team
- **Created:** 2026-05-07
