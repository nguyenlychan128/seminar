# FitGainer — Fitness Web App for Weight Gain

**A microservices platform helping underweight users (BMI < 18.5) gain weight and build muscle through personalized fitness coaching.**

---

## 🎯 Project Status

**Phase 1: Auth Foundation** ✅ 100% COMPLETE (Backend + Frontend)

- Backend: JWT authentication with role-based access (TASK-001 to TASK-010, 448 tests); User Service API (TASK-015 to TASK-017, 182 tests)
- Frontend: Zustand auth store, token refresh interceptors, custom hooks (TASK-011, 75+ tests); User Profile store, service, hooks (TASK-018, 66 tests)
- Frontend Pages: LoginPage component (TASK-012, 74/75 tests), RegisterPage component (TASK-013, 150+ tests)
- Protected Routes & Session Persistence: ProtectedRoute, RoleRoute components with proper loading states (TASK-014)
- Design System: Comprehensive CSS design system with dark mode, emerald/amber palette, responsive design (TASK-014)
- Modern UI Redesign: LoginPage.css, RegisterPage.css, Navbar.css with animations, decorative elements, mobile-first (TASK-014)
- 946+ tests passing (BE: 448 auth + 182 user-service = 630 tests, FE: 250+ auth + 66 user-profile = 316+ tests)
- Full auth stack: login, register, logout, refresh, token persistence, rate limiting, audit logging
- Frontend features: Password strength (5 levels), auto-login, role-based redirects, session persistence, protected routes
- Design System: Emerald #10b981 primary, Amber #f59e0b accent, Dark slate #0f172a background, responsive breakpoints
- Production-ready Docker setup with integration testing
- All quality gates passing (build, tests, lint)

**Phase 2: User Profile Management** ✅ 100% COMPLETE (Backend + Full Frontend)

- **TASK-015:** User Service Scaffolding (Express app, logger, database, 14 tests)
- **TASK-016:** UserProfile Model & BMI (Mongoose schema, 100 tests, 100% coverage)
- **TASK-017:** ProfileController & Routes (CRUD API endpoints, 68 tests, 95.5% coverage)
- **TASK-018:** User profile data layer (Zustand store, Axios service, custom hook; 66 tests; silent 404 handling; cross-store integration with auth)
- **TASK-019:** Profile setup UI (ProfileSetupPage, ProfileForm with validation, BmiResultCard; 96 tests; TailwindCSS-only styling; success flow with 1500ms redirect)
- **TASK-020:** Profile edit page (ProfilePage View & Edit; 31 tests; BMI live update on save; toast auto-dismiss; ProtectedRoute; Navbar "Profile" link for User role)
- 1,498+ tests passing (BE: 863 tests = 448 auth + 182 user-service + 227 workout-service; FE: 635 tests = 250+ auth + 193 user-profile + 72 workout-data-layer)
- Complete user profile flow: register → /profile/setup → fill form → /dashboard → /profile (view/edit) → BMI updates in real-time on save
- All UI components use TailwindCSS utility classes (no .css files); dark theme with emerald + amber accent; all text in English
- Production-ready form validation (on-blur + submit-time); toast notifications; loading/disabled states; accessibility (aria-\*)
- Vite dev proxy rewrites `/api/users` prefix before forwarding to user-service; Nginx handles same rewrite in production

**Phase 3: Workout Core** ✅ 100% COMPLETE

- **TASK-021:** Workout Service Scaffolding (Express app, logger, database, Axios userServiceClient, 57 tests, 98% coverage) ✅ Complete
- **TASK-022:** Exercise Model & Seed Data (Mongoose schema with 36 exercises, 6 muscle groups, 3 difficulties, idempotent upsert, 42 integration tests, 98.3% coverage) ✅ Complete
- **TASK-023:** WorkoutPlan Model & Plan Generator (Mongoose schema with nested week/day/exercise structures, planGenerator service with progressive overload & PPL split, 47 tests, 96.58% coverage) ✅ Complete
- **TASK-024:** Exercise Library API (5 REST endpoints: GET list with filters, GET detail, POST create, PUT update, DELETE soft-delete; JWT authentication, RBAC enforcement, 51 integration tests, 80%+ coverage) ✅ Complete
- **TASK-025:** Workout Plan API (4 REST endpoints: POST /plans/generate, GET /plans/my, GET /plans/my/week/:weekNumber, GET /plans/my/today; user-service integration for profile validation, BR-01 & BR-02 enforcement, 30 integration tests, 85%+ coverage) ✅ Complete
- **TASK-026:** FE Workout Data Layer (Zustand store, Axios service with error mapping, custom hook with computed properties, cross-store logout integration, 72 tests, 100% code path coverage) ✅ Complete
- **TASK-027:** FE Workout Plan UI (WorkoutPlanPage with summary + week calendar, WorkoutDayPage with exercise details, 4 reusable components: PlanSummaryCard, WeekCalendar, DayCard, ExerciseCard; TailwindCSS-only dark mode styling; 80 tests; integrated with App.jsx and Navbar.jsx) ✅ Complete
- **TASK-028:** BE Workout Execution API (POST /api/workouts/sessions with WorkoutSession model, SetResultSchema, ExerciseSessionSchema, workoutSessionService with multi-level validation, pre-save hooks for date/set validation, denormalization, DuplicateSessionError handling, 159 comprehensive tests, 97%+ coverage) ✅ Complete
- **TASK-029:** FE Workout Execution Form (WorkoutExecutionForm component, ExerciseCard execution mode, workoutSession.service for FE, GET /api/workouts/sessions endpoint for fetching saved sessions, read-only view for completed sessions, real-time validation, session summary with mood/duration/notes, auto-dismiss toast 3s, date guard for today-only logging) ✅ Complete
- Axios client with error handling for user-service profile lookups
- Production-ready Docker setup with healthcheck
- Exercise library: 36 exercises (chest, back, shoulders, arms, legs, core), beginner/intermediate/advanced levels, indexed by name/muscleGroup/equipment/difficulty
- Workout plan generation: 4-week plans with Push/Pull/Legs split, progressive overload (sets/reps scaling), gender-aware equipment selection
- Exercise API: CRUD endpoints with Admin write/User read, soft-delete with BR-08 enforcement
- Workout Plan API: Personalized plan generation with user-service integration, active plan retrieval, weekly view, today's workout with UTC date comparison
- FE Workout Data Layer: MSW mocking, silent 404 handling (no plan = valid state), computed hasActivePlan/currentWeekNumber
- FE Workout Plan UI: WorkoutPlanPage (summary + week calendar), WorkoutDayPage (daily exercise details), 4 components (PlanSummaryCard, WeekCalendar, DayCard, ExerciseCard), TailwindCSS-only styling, dark mode with emerald/amber colors, 80 tests
- 379 total tests passing (TASK-021: 57 + TASK-022: 42 + TASK-023: 47 + TASK-024: 51 + TASK-025: 30 + TASK-026 FE: 72 + TASK-027 FE: 80)

**Phase 4: Progress & Admin** ✅ Phase 4a Complete (TASK-030-BE ✅ + TASK-030-FE ✅) + Phase 4b Auth-Admin Complete (TASK-031-BE-Auth-Admin ✅)

- **TASK-030-BE:** ✅ Weight Log API Complete (Port 3004, POST/GET /progress/weight endpoints, WeightLog model with trend calculation, weightLogService, 89 tests, 87.5% coverage)
- **TASK-030-FE:** ✅ Progress Dashboard UI Complete (ProgressDashboard page, WeightInputForm, WeightChart, WeightStatistics components, Zustand store, Axios service, useProgress hook, 71+ tests, 100% coverage)
  - WeightLog model: userId, weight (30-200kg), date (UTC-safe), trend (current - previous day), notes (optional, 200 chars), unique compound index on (userId, date), sort index on (userId, date DESC)
  - POST /progress/weight: Create weight log with validation, prevent duplicate entries same day, trend auto-calculation via pre-save hook
  - GET /progress/weight: Fetch history with optional startDate, endDate, limit (max 365), returns data + count + date range
  - Validation middleware: weight range (30-200kg), date must not be future, optional notes
  - Error handling: 400 validation errors, 409 duplicate entries, 401 authentication, comprehensive test coverage (42 model tests + 47 API tests)

**Current:** Phase 2 Complete (TASK-020) + Phase 3 Complete (TASK-021-029) + Phase 4a Complete (TASK-030-BE ✅ + TASK-030-FE ✅) + Phase 4b Complete (TASK-031-BE-Auth-Admin ✅ + TASK-031-BE-Workout-Admin ✅ + TASK-031-FE-Admin-Dashboard ✅) | 2,331+ tests passing (478 BE auth with admin + 182 user-service + 290 workout-service with admin + 89 progress-BE + 71 progress-FE + 60+ admin-FE tests) | Admin Backend APIs + Admin Dashboard Frontend Complete

---

## 🏗️ Architecture

**Microservices** | **Node.js + Express** | **MongoDB** | **RabbitMQ** | **Docker**

```
┌─────────────────────────────────────────────────────────────┐
│                     FitGainer Platform                      │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│  Backend Services        │  Infrastructure                  │
│  ==================      │  ==============                  │
│                          │                                  │
│  1. Auth Service (3001)  │  Nginx Gateway                   │
│  2. User Service (3002)  │  MongoDB + RabbitMQ              │
│  3. Workout Service      │  Kubernetes Ready                │
│  4. Progress Service     │  OpenTelemetry Observability     │
│                          │  Frontend                        │
│                          │  =========                       │
│                          │  React + Vite + TailwindCSS      │
└──────────────────────────┴──────────────────────────────────┘
```

## 📋 Services Overview

| Service                  | Port | Status                                                                  | Responsibility                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------ | ---- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **auth-service**         | 3001 | ✅ Complete (TASK-001 to TASK-010, TASK-031-BE-Auth-Admin)              | JWT login/logout/refresh, role-based access, audit logging, admin user management                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Frontend (React)**     | 5173 | ✅ Complete (TASK-011-014 + TASK-018-020 + TASK-026-027 + TASK-029-030) | Zustand stores (auth, user, workout, progress), hooks, pages, protected routes, design system, profile setup & edit UI, workout data layer & UI, progress tracking UI                                                                                                                                                                                                                                                                                                                                     |
| **user-service**         | 3002 | ✅ Complete (TASK-015/16/17/18/19/20)                                   | Body profile, BMI calculation, classification, API endpoints, Zustand store, hooks, service layer, UI components                                                                                                                                                                                                                                                                                                                                                                                          |
| **workout-service**      | 3003 | ✅ Phase 3+4b Complete (TASK-021-029 + TASK-031-BE-Workout-Admin)       | Exercise library (36 exercises seeded), Exercise API (5 endpoints, RBAC, soft-delete), personalized plans with WorkoutPlan model & plan generator, progressive overload, Workout Plan API (4 endpoints), user-service integration, FE data layer + UI (pages, components), Workout Execution API & FE form with session management & real-time validation, Admin Exercise Management (4 endpoints: GET list with pagination/search/filter, POST create, PATCH update, DELETE soft-delete), 63 admin tests |
| **progress-service**     | 3004 | ✅ Phase 4a Complete (TASK-030-BE + TASK-030-FE)                        | Weight logs (POST/GET /progress/weight), trend calculation (89 BE tests); Progress Dashboard, WeightInputForm, WeightChart, WeightStatistics components with Zustand store & Axios service (71+ FE tests, 100% coverage)                                                                                                                                                                                                                                                                                  |

**API Gateway:** Nginx (routes all requests, enforces CORS, rate limiting)

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- Docker & Docker Compose
- MongoDB (or use Docker Compose)

### 1. Clone & Install

```bash
git clone <repo-url>
cd SGU_Seminar_ChuyenDe
cd BE/auth-service
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Run Service

```bash
# Development (with watch mode)
npm run dev

# Or with Docker
docker-compose up -d
```

### 4. Test

```bash
# Run all tests with coverage
npm test

# Watch mode
npm run test:watch
```

### 5. Verify

```bash
curl http://localhost:3001/health
# Response: { "status": "ok", "timestamp": "...", "version": "1.0.0" }
```

---

## 📚 Documentation

**Start here based on your role:**

### For Developers

1. **[Setup Guide](docs/SETUP.md)** — Installation, environment, local development
2. **[Project Structure](docs/architecture/project-structure.md)** — Directory layout & service boundaries
3. **[Codemaps Index](docs/CODEMAPS/INDEX.md)** — Quick navigation to code structure
4. **[Backend Auth Codemap](docs/CODEMAPS/auth-service.md)** — Module dependencies, file structure
5. **[Frontend Auth Codemap](docs/CODEMAPS/auth-frontend.md)** — Zustand store, hooks, interceptors
6. **[Backend User Service Codemap](docs/CODEMAPS/user-service.md)** — Module structure, scaffold ready
7. **[Backend Workout Service Codemap](docs/CODEMAPS/workout-service.md)** — Phase 3a-3e complete (scaffold, Exercise model, WorkoutPlan model, Exercise API, Workout Plan API)
8. **[Frontend Readme](FE/README.md)**

### For Architects

1. **[Project Structure](docs/architecture/project-structure.md)** — Overall design
2. **[Auth Service Architecture](docs/architecture/auth-service.md)** — Security, design decisions
3. **[CLAUDE.md](CLAUDE.md)** — Project rules & constraints
4. **[Architecture Decision Records](docs/adr/)** — Design rationale

### For Product Managers

1. **[Business Context](business/context.md)** — System overview (Vietnamese)
2. **[User Stories](business/user_stories/user_stories.md)** — Raw requirements
3. **[Story-to-Spec Mapping](spec/mapping/story-to-spec.md)** — Implementation progress

### For QA/Testers

1. **[Setup Guide — Testing Section](docs/SETUP.md#-testing)**
2. **[Auth Service README](BE/auth-service/README.md#-testing)**
3. **[Codemaps — Testing Strategy](docs/CODEMAPS/auth-service.md#-testing-map)**

---

## 🔍 Feature Specifications

All features are specified in `spec/features/` using a 4-file structure:

- `feature.spec.md` — Overview & user stories
- `api.spec.md` — REST endpoints
- `schema.spec.md` — Data models
- `rules.spec.md` — Business logic & validation

**Completed Specs:**

- ✅ [Auth Feature Specification](spec/features/auth/feature.spec.md)
- ✅ [User Profile Specification](spec/features/user-profile/feature.spec.md)
- ✅ [Workout Plan & Execution Specification](spec/features/workout-plan/feature.spec.md)
- ✅ [Workout Execution Specification](spec/features/workout-execution/feature.spec.md)
- ✅ [Progress Tracking Specification](spec/features/progress-tracking/feature.spec.md)
- ✅ [Administration Specification](spec/features/administration/feature.spec.md)

---

## 🧪 Testing

FitGainer follows **Test-Driven Development (TDD)** strictly:

1. **Write failing test first**
2. **Implement until test passes**
3. **Run quality gates** (lint + test + docker build)
4. **Commit with TDD trace**

**Current Coverage:**

- Auth Service: 448 tests (Phase 1a-1j backend)
- User Service: 182 tests (Phase 2a-2c backend)
- Workout Service: 227 tests (Phase 3a-3e backend) + 159 tests (Phase 3h backend execution) + 72 tests (Phase 3f frontend data layer) + 80 tests (Phase 3g frontend UI)
- Frontend Auth: 250+ tests (Phase 1k-1n)
- Frontend User Profile: 193 tests (Phase 2d-2f, data layer + UI)
- Frontend Workout Plan: 152 tests (Phase 3f-3g, data layer + UI pages & components)
- **Overall:** 1,737+ tests passing, 97%+ backend workout-service coverage + 100% frontend code path coverage
- Overall target: ≥80% for business-logic services

**Run Tests:**

```bash
npm test                  # All tests with coverage
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:watch       # Watch mode
```

**Current Test Status:**

- Auth Service: 478 tests (448 core auth + 30 admin user management) - 98.45% coverage
- User Service: 182 tests
- Workout Service: 290 tests (227 base + 159 execution + 63 admin) - 97%+ coverage
- Progress Service: 89 tests
- Frontend: 595+ tests
- **Total:** 2,241+ passing

---

## 🛠️ Development Workflow

### Project Layout

```
SGU_Seminar_ChuyenDe/
├── business/              # Business requirements (READ-ONLY)
├── spec/                  # AI-generated feature specs
│   └── features/
│       ├── auth/          # ✅ Phase 1 Complete (4 spec files)
│       └── user-profile/  # ✅ Phase 2 Spec Ready (4 spec files, TASK-015 scaffold)
├── tasks/                 # Implementation tasks (TASK-001 to TASK-015)
├── BE/                    # Backend microservices
│   ├── auth-service/      # ✅ Phase 1 (TASK-001 to TASK-010, 448 tests)
│   ├── user-service/      # ✅ Phase 2 Complete (TASK-015 to TASK-020)
│   ├── workout-service/   # ✅ Phase 3-4b Complete (TASK-021-029 + admin)
│   ├── progress-service/  # ✅ Phase 4a Complete (TASK-030)
│   └── shared/            # Shared utilities
├── FE/                    # Frontend (React + Vite) ✅ Phase 1 (TASK-011 to TASK-014) + Phase 2 (TASK-018, 316+ tests)
│   ├── src/pages/auth/LoginPage.jsx     # ✅ TASK-012
│   ├── src/pages/auth/RegisterPage.jsx  # ✅ TASK-013
│   ├── src/components/ProtectedRoute.jsx # ✅ TASK-014
│   ├── src/stores/user.store.js         # ✅ TASK-018 (Zustand store for user profile)
│   ├── src/services/user.service.js     # ✅ TASK-018 (Axios service with error mapping)
│   ├── src/hooks/useUserProfile.js      # ✅ TASK-018 (Auto-fetch, computed values)
│   ├── src/styles/design-system.css     # ✅ TASK-014
│   └── [other pages]/     # 🔄 Pending
├── infra/                 # Infrastructure (Nginx gateway, k8s, monitoring)
│   └── nginx/             # ✅ API Gateway (nginx.conf + gateway.conf routing)
├── docs/                  # Documentation & Codemaps
│   ├── CODEMAPS/
│   │   ├── auth-service.md      # ✅ Phase 1a-1j
│   │   ├── auth-frontend.md     # ✅ Phase 1k-1n
│   │   ├── user-service.md      # ✅ Phase 2a scaffold (NEW)
│   │   └── INDEX.md             # ✅ Updated with Phase 2a
│   └── architecture/
├── tests/                 # E2E tests
├── CLAUDE.md              # Project rules
└── docker-compose.yml     # Local dev environment
```

### Development Steps

1. **Read spec** — `spec/features/<domain>/<feature>.spec.md`
2. **Create task** — `tasks/<domain>/TASK-XXX-<verb>-<slug>.md`
3. **Write test first** — In `tests/unit/` or `tests/integration/`
4. **Implement code** — In `BE/<service>/src/`
5. **Pass all gates** — `npm test`, `npm run lint`, `docker build`
6. **Self-review** — Every line traces to task
7. **Commit** — Conventional message + co-author
8. **Update docs** — Mark spec as complete in `spec/mapping/story-to-spec.md`

---

## 🔐 Security

- **Password Security:** bcrypt (configurable rounds)
- **JWT Tokens:** Signed with `JWT_SECRET` (min 32 chars production)
- **Access Control:** Role-based (User / Admin)
- **Transport:** HTTPS enforced (Nginx SSL)
- **Secrets:** Never committed, only `.env.example` in git
- **Database:** Mongoose models with validation
- **Logging:** Structured JSON, gated by `LOG_LEVEL`

See [Auth Service Architecture — Security](docs/architecture/auth-service.md#-security-implementation) for details.

---

## 🚢 Deployment

### Local Development

```bash
docker-compose up -d
# Services start automatically with MongoDB, RabbitMQ
```

### Docker

```bash
cd BE/auth-service
docker build -t fitgainer-auth:latest .
docker run -p 3001:3001 -e NODE_ENV=production fitgainer-auth:latest
```

### Kubernetes

```bash
# Manifests in infra/k8s/
kubectl apply -f infra/k8s/base/
kubectl apply -f infra/k8s/services/auth-service/
```

See [Setup Guide — Kubernetes](docs/SETUP.md#-kubernetes-production-like) for full instructions.

---

## 📖 Key Project Rules

See [CLAUDE.md](CLAUDE.md) for complete rules. Key points:

✅ **MUSTS:**

- Plain JavaScript only (no TypeScript, no NestJS)
- CommonJS (`require`/`module.exports`)
- TDD mandatory (test first)
- All quality gates must pass before commit
- Every user story maps to a feature spec
- `business/` is READ-ONLY

❌ **DO NOTs:**

- No TypeScript
- No advanced abstractions unless used 3+ times
- No features beyond the current task
- No commits without passing tests
- No modifying business domain

---

## 🎯 Implementation Phases

### ✅ Phase 1: Auth Foundation (100% COMPLETE)

- **Backend (TASK-001 to TASK-010):** JWT authentication, role-based access, audit logging, rate limiting (448 tests)
- **Frontend (TASK-011 to TASK-014):** Zustand store, token refresh, custom hooks, LoginPage, RegisterPage, protected routes, design system (250+ tests)
- **Session Persistence:** Token localStorage storage, restoration on page reload, automatic user data recovery
- **Design System:** Complete CSS system with colors, typography, spacing, animations, responsive design
- **Modern UI:** Dark mode pages (LoginPage, RegisterPage, Navbar) with animations and mobile optimization
- 700+ tests passing (BE: 448, FE: 250+)
- Service scaffolding, Docker setup, integration testing
- Codemaps: Backend + Frontend, complete documentation

### ✅ Phase 2: User Profile (100% COMPLETE)

- **Backend Scaffold:** ✅ TASK-015 Complete (Express app, logger, database, Dockerfile)
- **Specification:** ✅ Complete (4 spec files in `spec/features/user-profile/`)
- **Documentation:** ✅ Complete (README.md + Codemap v1.2)
- **UserProfile Model + BMI Utils:** ✅ TASK-016 Complete (114 tests, 100% coverage on business logic)
- **User Profile API Endpoints:** ✅ TASK-017 Complete (GET/POST/PUT /profile, GET /profile/bmi, 182 tests, 95.5% coverage)
- **Frontend Data Layer:** ✅ TASK-018 Complete (Zustand store, Axios service, custom hook, 65 tests, MSW mocking, Nginx gateway integration)
- Depends on: Phase 1 (Auth) ✅
- **Total Tests:** 1,193+ (BE 630 + FE 563+) | **Total Tasks:** 20/20 Complete

### ✅ Phase 3: Workout Core (100% COMPLETE)

- **TASK-021:** ✅ Workout Service Scaffolding (Express app, logger, database, Axios userServiceClient, 57 tests, 98% coverage)
- **TASK-022:** ✅ Exercise Model & Seed Data (36 exercises with 6 muscle groups, 42 tests, 98.3% coverage)
- **TASK-023:** ✅ WorkoutPlan Model & Generator (personalized plan generation, progressive overload, 47 tests, 96.58% coverage)
- **TASK-024:** ✅ Exercise Library API (5 endpoints: GET list+filters, GET detail, POST create, PUT update, DELETE soft-delete with BR-08, 51 tests, 80%+ coverage)
- **TASK-025:** ✅ Workout Plan API (POST generate with user-service integration, GET /my, GET /my/week/:weekNumber with UTC date comparison, GET /my/today, 30 tests, 85%+ coverage)
- **TASK-026:** ✅ Frontend Data Layer (Zustand store, Axios service, custom hooks, 72 tests)
- **TASK-027:** ✅ Frontend Workout Plan UI (pages and components for displaying plans, 80 tests)
- **TASK-028:** ✅ Workout Execution API Backend (WorkoutSession model, 159 tests, 97%+ coverage)
- **TASK-029:** ✅ Workout Execution Form Frontend (real-time validation, session management, read-only view)
- Depends on: Phase 2 (User Profile) ✅
- **Total Tests:** 386 (57+42+47+51+30+159) | **Coverage:** 97%+ on service layer

### ✅ Phase 4: Progress & Admin (100% COMPLETE)

- **Phase 4a:** Weight & strength tracking (TASK-030-BE + TASK-030-FE) ✅ Complete
- **Phase 4b-Auth-Admin:** Admin user management (TASK-031-BE-Auth-Admin) ✅ Complete
- **Phase 4b-Workout-Admin:** Admin exercise management (TASK-031-BE-Workout-Admin) ✅ Complete
- **Phase 4b-FE-Admin:** FE admin dashboard (TASK-031-FE-Admin-Dashboard) ✅ Complete
- Depends on: Phase 3 (Workout) ✅


---

## 🤝 Contributing

### Before You Code

1. Read [CLAUDE.md](CLAUDE.md) — Project rules
2. Read relevant spec in `spec/features/<domain>/`
3. Check [setup guide](docs/SETUP.md) — Local environment

### During Development

1. Write test first (TDD)
2. Implement until test passes
3. Keep changes surgical (only what's needed)
4. Run quality gates before committing
5. Update documentation after feature is complete

### After Implementation

1. Self-review diff — every line traces to spec
2. Run `npm test && npm run lint && docker build`
3. Update `spec/mapping/story-to-spec.md` — mark feature as complete
4. Commit with conventional message + co-author attribution
5. Verify docs are up to date

---

## 📞 Need Help?

### Common Questions

**How do I start?**
→ Read [Setup Guide](docs/SETUP.md)

**Where's the auth service code?**
→ `BE/auth-service/src/` — Start with [Codemap](docs/CODEMAPS/auth-service.md)

**What feature should I implement next?**
→ Check [Story-to-Spec Mapping](spec/mapping/story-to-spec.md)

**How do tests work?**
→ [Testing Section](docs/SETUP.md#-testing) + [Codemap Testing](docs/CODEMAPS/auth-service.md#-testing-map)

**Is there an example implementation?**
→ `BE/auth-service/src/utils/validators.js` + `tests/unit/validators.test.js`

**How do I run everything locally?**
→ [Setup Guide — Docker Compose](docs/SETUP.md#-option-b-docker-compose-full-stack)

### Get Unstuck

1. Search the [Codemaps Index](docs/CODEMAPS/INDEX.md)
2. Check the feature spec in `spec/features/`
3. Review similar code in the same service
4. Look at test examples to understand patterns
5. Read architecture docs for design decisions

---

## 📊 Project Metadata

- **Project Name:** FitGainer
- **Type:** Microservices Platform
- **Domain:** Fitness & Wellness
- **Target Users:** Underweight individuals (BMI < 18.5)
- **Tech Stack:** Node.js, Express, MongoDB, RabbitMQ, React + Vite, Zustand, TailwindCSS, Docker, Kubernetes

**Repository Statistics:**

- **Status:** Phase 1-4 Complete (Auth, User Profile, Workout Core, Progress & Admin all finished)
- **Last Updated:** 2026-05-19
- **Microservices:** 4 active services (auth-service, user-service, workout-service, progress-service)
- **Frontend:** React + Vite with complete auth infrastructure (TASK-011 to TASK-014) + full user profile (TASK-018 to TASK-020) + workout UI (TASK-026-029) + progress tracking UI (TASK-030-FE)
- **Test Coverage:** 2,241+ tests (BE: 1,089 auth/user/workout/progress, FE: 1,152+ auth/user/workout/progress)
- **Infrastructure:** Nginx API Gateway with routing to all 4 services; Vite dev proxy integration
- **Documentation:** ✅ Comprehensive (Setup, Architecture, Codemaps, Guides, Service API docs, README for each service)

---

## 📄 License

MIT

---

## 🙌 Support

For detailed information on specific topics:

| Topic                  | Document                                                        |
| ---------------------- | --------------------------------------------------------------- |
| Getting Started        | [Setup Guide](docs/SETUP.md)                                    |
| Project Structure      | [Architecture Overview](docs/architecture/project-structure.md) |
| Auth Service Details   | [Codemap](docs/CODEMAPS/auth-service.md)                        |
| Feature Specifications | [Story-to-Spec Mapping](spec/mapping/story-to-spec.md)          |
| Project Rules          | [CLAUDE.md](CLAUDE.md)                                          |
| Business Requirements  | [User Stories](business/user_stories/user_stories.md)           |

---

**Happy coding! Follow TDD, keep it simple, and always check the spec first.** 🚀
