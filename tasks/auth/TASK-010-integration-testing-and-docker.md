# TASK-010: Complete Integration Testing & Docker Build

## 🎯 Objective

Complete comprehensive integration testing of all auth endpoints and verify Docker build works correctly.

---

## 📋 Acceptance Criteria

- [ ] All auth endpoints tested end-to-end:
  - `POST /api/auth/register` — Full flow (valid, invalid, duplicate)
  - `POST /api/auth/login` — Full flow (success, invalid, inactive)
  - `POST /api/auth/refresh` — Full flow (success, expired, invalid)
  - `POST /api/auth/logout` — Full flow (with/without token)
  - `GET /api/auth/me` — Full flow (authenticated, unauthenticated)
- [ ] Integration test file: `tests/integration/auth.e2e.test.js`
- [ ] Test scenarios:
  - User registration → login → get me → refresh → logout
  - Invalid credentials → proper error messages
  - Token expiry → refresh flow → new tokens valid
  - Unauthenticated requests → 401
  - Missing fields → 400
- [ ] MongoMemoryServer used (no external DB)
- [ ] All tests use Supertest for HTTP assertions
- [ ] Test coverage ≥ 80% across all auth services
- [ ] `npm test` runs all tests and reports coverage
- [ ] `npm run test:integration` runs integration tests only
- [ ] `npm run test:unit` runs unit tests only
- [ ] Docker build:
  - `docker build .` succeeds
  - Docker image includes all dependencies
  - No secrets in Dockerfile (uses .env)
  - Exposes port 3001
  - Health check endpoint optional
- [ ] `.env.example` complete and accurate
- [ ] README.md with:
  - Setup instructions (npm install)
  - Running locally (npm run dev)
  - Running tests (npm test)
  - Building Docker (docker build)
  - Environment variables (reference to .env.example)
- [ ] `npm run lint` optional (if ESLint configured)
- [ ] CI/CD ready (GitHub Actions or similar)
- [ ] Code matches auth spec exactly
- [ ] No hardcoded secrets or sensitive data

---

## 🔗 Related Spec Files

- All auth feature specs: feature.spec.md, api.spec.md, schema.spec.md, rules.spec.md
- CLAUDE.md — Testing rules, quality gates, project setup

---

## 📝 Implementation Notes

1. **Integration Test Structure:**
   ```javascript
   // tests/integration/auth.e2e.test.js
   describe('Auth Service E2E', () => {
     let app;
     
     beforeAll(async () => {
       // Start MongoMemoryServer
       // Connect to memory DB
       // Start Express app
     });
     
     afterAll(async () => {
       // Close DB connection
       // Stop MongoMemoryServer
     });
     
     beforeEach(async () => {
       // Clear database
     });
     
     test('User flow: register → login → me → refresh → logout', async () => {
       // 1. Register
       const registerRes = await request(app)
         .post('/api/auth/register')
         .send({ email: 'test@example.com', password: 'Pass123!', confirmPassword: 'Pass123!' });
       expect(registerRes.status).toBe(201);
       
       // 2. Login
       const loginRes = await request(app)
         .post('/api/auth/login')
         .send({ email: 'test@example.com', password: 'Pass123!' });
       expect(loginRes.status).toBe(200);
       const { accessToken, refreshToken } = loginRes.body.data;
       
       // 3. Get me
       const meRes = await request(app)
         .get('/api/auth/me')
         .set('Authorization', `Bearer ${accessToken}`);
       expect(meRes.status).toBe(200);
       expect(meRes.body.data.email).toBe('test@example.com');
       
       // 4. Refresh
       const refreshRes = await request(app)
         .post('/api/auth/refresh')
         .send({ refreshToken });
       expect(refreshRes.status).toBe(200);
       
       // 5. Logout
       const logoutRes = await request(app)
         .post('/api/auth/logout')
         .set('Authorization', `Bearer ${accessToken}`);
       expect(logoutRes.status).toBe(200);
     });
   });
   ```

2. **npm Scripts (package.json):**
   ```json
   {
     "scripts": {
       "start": "node src/server.js",
       "dev": "NODE_ENV=development node src/server.js",
       "test": "jest --coverage --detectOpenHandles",
       "test:unit": "jest tests/unit --coverage",
       "test:integration": "jest tests/integration --detectOpenHandles",
       "test:watch": "jest --watch",
       "lint": "eslint src --max-warnings 0"
     }
   }
   ```

3. **Dockerfile:**
   ```dockerfile
   # Multi-stage build
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   FROM node:18-alpine
   WORKDIR /app
   COPY --from=builder /app/node_modules ./node_modules
   COPY src ./src
   COPY package.json .
   
   EXPOSE 3001
   HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
     CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
   
   CMD ["node", "src/server.js"]
   ```

4. **Test Coverage Threshold (jest.config.js):**
   ```javascript
   module.exports = {
     testEnvironment: 'node',
     coveragePathIgnorePatterns: ['/node_modules/'],
     collectCoverageFrom: ['src/**/*.js'],
     coverageThreshold: {
       global: {
         branches: 80,
         functions: 80,
         lines: 80,
         statements: 80
       }
     }
   };
   ```

5. **Health Check Endpoint (optional):**
   ```javascript
   // src/server.js
   app.get('/health', (req, res) => {
     res.json({ status: 'ok', timestamp: new Date().toISOString() });
   });
   ```

6. **README.md Sections:**
   - Setup: `npm install`
   - Development: `npm run dev`
   - Testing: `npm test`
   - Docker: `docker build -t fitgainer-auth . && docker run -p 3001:3001 fitgainer-auth`
   - Environment: Link to `.env.example`
   - API: Reference to `spec/features/auth/api.spec.md`

---

## 🚀 Subtasks

1. **Create comprehensive E2E test** — tests/integration/auth.e2e.test.js
2. **Test happy path** — Register → Login → Get Me → Refresh → Logout
3. **Test error cases** — All endpoints with invalid input
4. **Test authentication** — Protected routes with/without tokens
5. **Configure npm scripts** — start, dev, test, test:unit, test:integration, lint
6. **Configure Jest** — Coverage threshold, reporters, testEnvironment
7. **Create Dockerfile** — Multi-stage, minimal, secure
8. **Add health check** — GET /health endpoint (optional)
9. **Verify Docker build** — `docker build .` succeeds
10. **Create comprehensive README** — Setup, running, testing, Docker
11. **Verify test coverage** — ≥ 80% globally
12. **Run full quality gate** — npm test && docker build

---

## ✅ Definition of Done

- All auth endpoints thoroughly tested
- End-to-end flow verified (register → login → me → refresh → logout)
- Test coverage ≥ 80%
- Docker builds successfully
- No secrets in code or Dockerfile
- README.md comprehensive
- npm scripts all working
- `npm test` passes all tests
- `docker build .` succeeds
- Code matches auth spec exactly
- Quality gates pass: lint + test + build

---

## 🔄 Next Steps

After this task:
- **Commit:** Create PR with all auth-service implementation
- **Phase 2:** User profile service (`spec/features/user-profile/`)
- **Phase 3:** Workout plan service

---

## 📊 Task Metadata

- **Priority:** P0 (MVP Completion)
- **Effort:** 3-4 hours
- **Owner:** Backend Team
- **Depends On:** All previous auth tasks (TASK-001 through TASK-009)
- **Created:** 2026-05-07

---

## Quality Gate Checklist

Before marking complete:

- [ ] All unit tests passing (`npm run test:unit`)
- [ ] All integration tests passing (`npm run test:integration`)
- [ ] Test coverage ≥ 80% (`npm test -- --coverage`)
- [ ] Docker builds (`docker build .`)
- [ ] No console errors or warnings
- [ ] No hardcoded secrets
- [ ] `.env.example` complete
- [ ] README.md covers all setup steps
- [ ] Code style consistent (CommonJS, no TypeScript)
- [ ] Matches auth spec exactly

---

## Final Verification

```bash
# 1. Install dependencies
npm install

# 2. Run all tests with coverage
npm test

# 3. Build Docker image
docker build -t fitgainer-auth:test .

# 4. If all pass → Ready for PR
```
