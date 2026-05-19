# Codemaps & Documentation Index

**FitGainer Microservices Platform** | **Last Updated:** 2026-05-19

---

## 📚 What Are Codemaps?

Codemaps are structural guides to understanding how code is organized, where modules live, their dependencies, and data flows. They're designed for **developer onboarding** and **quick navigation**.

This index helps you find the right reference for your task.

---

## 🗺️ Codemaps by Service

### Auth Service — Backend (Port 3001) — ✅ Phase 1a-1j Complete + Phase 4b Auth-Admin Complete (TASK-031-BE-Auth-Admin)

| Document | Purpose | Status |
|----------|---------|--------|
| **[auth-service.md](./auth-service.md)** | BE Code structure, modules, dependencies, testing, admin user management | ✅ Complete (v2.6 with TASK-031-BE-Auth-Admin: admin routes, service, controller, validation middleware) |
| `spec/features/auth/feature.spec.md` | Feature overview & user stories | ✅ Complete |
| `spec/features/auth/api.spec.md` | REST endpoint specifications | ✅ Complete (v1.5 with user info endpoint) |
| `spec/features/auth/schema.spec.md` | Data models (User, Token) | ✅ Complete |
| `spec/features/auth/rules.spec.md` | Business rules & validation | ✅ Complete (v1.1 with logout) |
| `BE/auth-service/README.md` | Service setup & getting started | ✅ Complete (v1.5 with TASK-010) |
| `docs/architecture/auth-service.md` | Architecture decisions & flows | ✅ Complete (v1.8 with integration testing & Docker) |

### Auth — Frontend (React) — ✅ Phase 1k-1n Complete (TASK-011, TASK-012, TASK-013, TASK-014)

| Document | Purpose | Status |
|----------|---------|--------|
| **[auth-frontend.md](./auth-frontend.md)** | FE Code structure, store, hooks, components, design system, testing | ✅ Complete (v1.4 with TASK-014: protected routes, session persistence, design system, 250+ tests; TASK-018 integration) |
| `FE/README.md` | Frontend setup, quick start, auth flow guide, design system | ✅ Complete (v1.3 with protected routes and design system) |
| `FE/DESIGN.md` | Complete design system specification | ✅ Complete (v1.0 with 350+ lines of design tokens and guidelines) |
| `tasks/auth/TASK-011-fe-auth-setup.md` | Frontend auth infrastructure (Zustand store, hooks, services) | ✅ Complete (Phase 1k) |
| `tasks/auth/TASK-012-fe-auth-login.md` | LoginPage component with validation & error handling | ✅ Complete (Phase 1l, 74/75 tests passing) |
| `tasks/auth/TASK-013-fe-auth-register.md` | RegisterPage component with password strength & auto-login | ✅ Complete (Phase 1m, 150+ tests passing) |
| `tasks/auth/TASK-014-fe-auth-protected-routes-and-logout.md` | Protected routes, session persistence, design system, UI redesign | ✅ Complete (Phase 1n, 100+ tests updated) |

### User Service — Backend & Frontend (Port 3002 / 5173) — ✅ Phase 2a-2f Complete (TASK-015 ✅ TASK-016 ✅ TASK-017 ✅ TASK-018 ✅ TASK-019 ✅ TASK-020 ✅)

| Document | Purpose | Status |
|----------|---------|--------|
| **[user-service.md](./user-service.md)** | BE Code structure, modules, dependencies, testing | ✅ Phase 2c (v1.2 Scaffold ✅ + Model ✅ + CRUD API ✅) |
| **[user-profile-frontend.md](./user-profile-frontend.md)** | FE Data layer + UI Components — store, service, hook, pages, components | ✅ Complete (TASK-018 data layer + TASK-019 setup UI + TASK-020 view/edit page; 193 tests; TailwindCSS-only styling) |
| `spec/features/user-profile/feature.spec.md` | Feature overview & user stories | ✅ Complete |
| `spec/features/user-profile/api.spec.md` | REST endpoint specifications | ✅ Complete |
| `spec/features/user-profile/schema.spec.md` | Data models (UserProfile) | ✅ Complete |
| `spec/features/user-profile/rules.spec.md` | Business rules & validation | ✅ Complete |
| `BE/user-service/README.md` | Service setup & getting started | ✅ Complete (v1.1 with TASK-017 full API docs) |
| `docs/architecture/user-service.md` | Architecture decisions & flows | 🔄 Pending |
| `FE/README.md` | Frontend setup, quick start, design system, profile setup flow | ✅ Complete (v1.3 with TASK-019 UI guide) |
| `FE/DESIGN.md` | Frontend design system (colors, typography, spacing, dark mode) | ✅ Complete (v1.0) |

### Workout Service — Backend & Frontend (Port 3003 / 5173) — ✅ Phase 3a-3i + 4b Complete (TASK-021 ✅ TASK-022 ✅ TASK-023 ✅ TASK-024 ✅ TASK-025 ✅ TASK-028 ✅ TASK-026 ✅ TASK-027 ✅ TASK-029 ✅ TASK-031-BE-Workout-Admin ✅)

| Document | Purpose | Status |
|----------|---------|--------|
| **[workout-service.md](./workout-service.md)** | BE Code structure, modules, dependencies, testing, admin exercise API | ✅ Phase 3a-3h + Phase 4b (v2.0 Scaffold ✅ TASK-021 + Exercise Model ✅ TASK-022 + WorkoutPlan Model ✅ TASK-023 + Exercise API ✅ TASK-024 + Workout Plan API ✅ TASK-025 + Workout Execution API ✅ TASK-028 + Admin Exercise API ✅ TASK-031-BE-Workout-Admin, 449 tests total, 97%+ coverage) |
| **[workout-frontend.md](./workout-frontend.md)** | FE Data layer + UI pages & components — service, store, hook, pages, components, execution form, testing | ✅ Complete (TASK-026 data layer: 72 tests; TASK-027 UI: 80 tests; TASK-029 execution form: WorkoutExecutionForm, workoutSession.service, ExerciseCard dual-mode, real-time validation, session management, read-only view, toast) |
| `spec/features/workout-plan/feature.spec.md` | Feature overview & user stories | ✅ Complete |
| `spec/features/workout-plan/api.spec.md` | REST endpoint specifications | ✅ Complete |
| `spec/features/workout-plan/schema.spec.md` | Data models (Exercise, WorkoutPlan) & FE Component Structure | ✅ Complete |
| `spec/features/workout-plan/rules.spec.md` | Business rules & UI rules (UR-01 through UR-06) | ✅ Complete |
| `spec/features/workout-execution/feature.spec.md` | Feature overview & user stories (WE-01 through WE-05) | ✅ Complete |
| `spec/features/workout-execution/api.spec.md` | REST endpoint specifications (POST /api/workouts/sessions) | ✅ Complete |
| `spec/features/workout-execution/schema.spec.md` | Data models (WorkoutSession, SetResult, ExerciseSession) | ✅ Complete |
| `spec/features/workout-execution/rules.spec.md` | Business rules & validation (BR-01 through BR-07, SR-01 through SR-03) | ✅ Complete |
| `BE/workout-service/README.md` | Service setup & getting started | ✅ Complete (v1.3 with TASK-021 + TASK-022 + TASK-023 + TASK-024 + TASK-025) |
| `FE/README.md` | Frontend setup, design system, workout plan UI guide | ✅ Updated with TASK-027 workout plan UI (pages + components) |
| `docs/architecture/workout-service.md` | Architecture decisions & flows | 🔄 Pending |

### Progress Service — Backend & Frontend (Port 3004 / 5173) — ✅ Phase 4a Complete (TASK-030-BE ✅ TASK-030-FE ✅)

| Document | Purpose | Status |
|----------|---------|--------|
| **[progress-service.md](./progress-service.md)** | BE Code structure, modules, dependencies, testing | ✅ Phase 4a BE Complete (v1.0 Weight Log API: POST/GET /progress/weight, 89 tests, 87.5% coverage) |
| **[progress-frontend.md](./progress-frontend.md)** | FE Code structure — service, store, hook, components, pages, testing | ✅ Phase 4a FE Complete (v1.0 ProgressDashboard page, WeightInputForm, WeightChart, WeightStatistics, 71+ tests, 100% coverage) |

### Administration — Auth Service Backend (Port 3001) — ✅ Phase 4b Auth-Admin Complete (TASK-031-BE-Auth-Admin)

| Document | Purpose | Status |
|----------|---------|--------|
| Auth Service Codemap (auth-service.md) | BE Code structure with admin user management module | ✅ Updated (v2.6) with TASK-031-BE-Auth-Admin: admin routes, service, controller, validation |

### Administration — Workout Service Backend (Port 3003) — ✅ Phase 4b Workout-Admin Complete (TASK-031-BE-Workout-Admin)

| Document | Purpose | Status |
|----------|---------|--------|
| **[workout-service.md](./workout-service.md)** | BE Code structure with admin exercise management module | ✅ Updated (v2.0) with TASK-031-BE-Workout-Admin: admin routes, service, controller, validation, 63 tests |
| `spec/features/administration/api.spec.md` | REST endpoint specifications (GET/POST/PATCH/DELETE /api/admin/exercises) | ✅ Complete |
| `BE/workout-service/README.md` | Service setup & admin exercise API documentation | ✅ Updated with TASK-031-BE-Workout-Admin |

### Administration — Frontend (React) — ✅ Phase 4b FE Complete (TASK-031-FE-Admin-Dashboard)

| Document | Purpose | Status |
|----------|---------|--------|
| **[admin-dashboard.md](./admin-dashboard.md)** | FE Code structure — service, store, layout, pages, components, modals, testing | ✅ Complete (v1.0 Admin Dashboard UI: user management + exercise management, 60+ tests, TailwindCSS dark mode) |
| `spec/features/administration/` | Feature spec files (feature, api, schema, rules) | ✅ Complete |
| `FE/README.md` | Frontend setup & admin dashboard feature guide | ✅ Updated with TASK-031-FE |

---

## 📖 Documentation by Purpose

### For New Developers

1. **Start here:** `docs/SETUP.md`
   - Prerequisites, installation, quick start
   - Local development options
   - Troubleshooting

2. **Understand the system:** `docs/architecture/project-structure.md`
   - Full directory structure
   - Service responsibilities
   - Microservices overview

3. **Learn the auth service:** `docs/CODEMAPS/auth-service.md`
   - Module structure
   - Dependencies & imports
   - Data flows
   - Testing strategy

### For Understanding Architecture

1. **Overall design:** `docs/architecture/project-structure.md`
   - Monorepo structure
   - Service boundaries
   - Technology choices

2. **Auth service:** `docs/architecture/auth-service.md`
   - Security implementation
   - Request/response flows
   - Deployment options

3. **Business requirements:** `business/context.md` (READ-ONLY)
   - System overview in Vietnamese
   - Domain model

### For Implementing Features

1. **User story mapping:** `spec/mapping/story-to-spec.md`
   - Links stories to specs
   - Implementation phases
   - Dependencies between features

2. **Feature specifications:** `spec/features/<domain>/`
   - `feature.spec.md` — Feature overview
   - `api.spec.md` — API endpoints
   - `schema.spec.md` — Data models
   - `rules.spec.md` — Business logic

3. **Implementation tasks:** `tasks/<domain>/TASK-XXX-<slug>.md`
   - Atomic, testable units of work
   - Acceptance criteria
   - Links to specs

### For Testing

1. **Test strategy:** `docs/CODEMAPS/auth-service.md#-testing-strategy`
   - Unit, integration, E2E breakdown
   - Coverage requirements
   - Test file locations

2. **Service README:** `BE/auth-service/README.md`
   - Running tests locally
   - Coverage reports
   - Common test patterns

### For DevOps & Deployment

1. **Setup guide:** `docs/SETUP.md#-kubernetes-production-like`
   - Local setup
   - Docker Compose
   - Kubernetes deployment

2. **Project structure:** `docs/architecture/project-structure.md`
   - Dockerfile locations
   - Kubernetes manifests
   - Environment variables

---

## 🔍 Quick Navigation

### Find Information About...

**JWT tokens**
→ `spec/features/auth/feature.spec.md` (Security section)
→ `docs/architecture/auth-service.md` (JWT Token Security)

**User registration flow**
→ `spec/features/auth/api.spec.md` (Register endpoint)
→ `docs/architecture/auth-service.md` (Registration Flow)
→ `docs/CODEMAPS/auth-service.md` (Registration Sequence)

**Running tests**
→ `docs/SETUP.md#-testing`
→ `BE/auth-service/README.md#-testing`

**Database schema**
→ `spec/features/auth/schema.spec.md`
→ `docs/CODEMAPS/auth-service.md#-module-structure` (User Model)

**API endpoints**
→ `spec/features/auth/api.spec.md`
→ `docs/SETUP.md#-api-endpoints` (Phase 1)

**Environment variables**
→ `.env.example` (in each service)
→ `CLAUDE.md#-env-conventions`
→ `docs/SETUP.md#-3-setup-environment-variables`

**Project structure**
→ `docs/architecture/project-structure.md`
→ `docs/CODEMAPS/auth-service.md` (Service-specific)

**Security best practices**
→ `docs/architecture/auth-service.md#-security-implementation`
→ `CLAUDE.md#-testing-rules` (Quality gates)
→ `docs/SETUP.md#-security-checklist`

**Microservices architecture**
→ `CLAUDE.md#-microservice-architecture`
→ `docs/architecture/project-structure.md#-backend-microservices-architecture`

**Implementation workflow**
→ `CLAUDE.md#-ai-dev-workflow`
→ `spec/mapping/story-to-spec.md#-implementation-phases`

---

## 📊 Documentation Map by Type

### Codemaps (Code Structure Guides)
```
docs/CODEMAPS/
├── INDEX.md                      # This file (v1.26 — Phase 1a-1n + 2a-2f + 3a-3i + 4a + 4b COMPLETE)
├── auth-service.md               # ✅ Phase 1a-1j (Backend code structure with admin user API)
├── auth-frontend.md              # ✅ Phase 1k-1n (Frontend code structure with design system, protected routes, session persistence)
├── user-service.md               # ✅ Phase 2a-2c (Backend scaffold + model + CRUD API, 182 tests)
├── user-profile-frontend.md      # ✅ Phase 2d-2f (FE data layer: store, service, hook + UI components, 193 tests)
├── workout-service.md            # ✅ Phase 3a-3i (Scaffold + Exercise Model + WorkoutPlan Model + Exercise API + Workout Plan API + Workout Execution API BE + Admin Exercise API, 449 tests)
├── workout-frontend.md           # ✅ Phase 3f-3i (Data layer: 72 tests; UI pages/components: 80 tests; Execution form: real-time validation, session management, read-only view)
├── progress-service.md           # ✅ Phase 4a BE (Weight Log API, 89 tests)
├── progress-frontend.md          # ✅ Phase 4a FE (ProgressDashboard page, WeightInputForm, WeightChart, WeightStatistics, 71+ tests)
└── admin-dashboard.md            # ✅ Phase 4b FE (Admin Dashboard UI: user management, exercise management, 60+ tests)
```

### Specifications (Generated from Business)
```
spec/features/
├── auth/                    # ✅ Complete (Phase 1)
│   ├── feature.spec.md
│   ├── api.spec.md
│   ├── schema.spec.md
│   └── rules.spec.md
├── user-profile/            # ✅ Complete (Phase 2)
├── workout-plan/            # ✅ Complete (Phase 3)
├── workout-execution/       # ✅ Complete (Phase 3)
├── progress-tracking/       # ✅ Complete (Phase 4)
├── administration/          # ✅ Complete (Phase 4)
└── mapping/
    └── story-to-spec.md     # Maps user stories to specs
```

### Architecture & Design
```
docs/architecture/
├── project-structure.md     # Full directory structure
├── auth-service.md          # ✅ Phase 1 (Auth service design)
├── user-service.md          # 🔄 Pending
├── workout-service.md       # 🔄 Pending
├── progress-service.md      # 🔄 Pending
└── adr/                     # Architecture Decision Records
    ├── ADR-001-microservices.md
    ├── ADR-002-event-driven.md
    ├── ADR-003-spec-driven.md
    └── ADR-004-plain-js.md
```


### Implementation Tasks
```
tasks/
├── auth/
│   ├── TASK-001-setup-auth-scaffolding.md        # ✅ Complete (Phase 1a)
│   ├── TASK-002-user-model.md                    # ✅ Complete (Phase 1b)
│   ├── TASK-003-register.md                      # ✅ Complete (Phase 1c)
│   ├── TASK-004-login.md                         # ✅ Complete (Phase 1d)
│   ├── TASK-005-refresh.md                       # ✅ Complete (Phase 1e)
│   ├── TASK-006-jwt-middleware.md                # ✅ Complete (Phase 1f)
│   ├── TASK-007-logout.md                        # ✅ Complete (Phase 1g)
│   ├── TASK-008-implement-me-endpoint.md         # ✅ Complete (Phase 1h)
│   ├── TASK-009-add-rate-limiting.md             # ✅ Complete (Phase 1i)
│   ├── TASK-010-integration-testing-docker.md    # ✅ Complete (Phase 1j)
│   ├── TASK-011-fe-auth-setup.md                 # ✅ Complete (Phase 1k)
│   ├── TASK-012-fe-auth-login.md                 # ✅ Complete (Phase 1l)
│   └── TASK-013-fe-auth-register.md              # ✅ Complete (Phase 1m)
├── user-profile/            # ✅ Complete
├── workout-plan/            # ✅ Complete
├── workout-execution/       # ✅ Complete
├── progress-tracking/       # ✅ Complete
└── administration/          # ✅ Complete
```

### Service Documentation
```
BE/auth-service/
├── README.md                # Service getting started
├── ARCHITECTURE.md          # [Planned: detailed design doc]
├── SETUP_COMPLETE.md        # [Completion status]
├── CODE_REVIEW_FIXES.md     # [Code review resolution log]
└── src/                     # Code (see codemap for structure)
```

---

## 🔄 Documentation Workflow

### When to Update Documentation

**ALWAYS update when:**
- New feature spec is created
- Implementation task is completed
- Service architecture changes
- Database schema changes
- New API endpoint added
- Significant refactoring occurs

**OPTIONAL to update:**
- Small bug fixes
- Comment improvements
- Non-functional refactoring

### How Documents Relate

```
User Story (business/user_stories/)
    ↓ Normalized & grouped
Feature Spec (spec/features/<domain>/)
    ↓ Analyzed for structure
Codemap (docs/CODEMAPS/<service>.md)
    ↓ Shows directory layout
Architecture Design (docs/architecture/<service>.md)
    ↓ Explains decisions
Service README (BE/<service>/README.md)
    ↓ Quick start guide
Implementation Task (tasks/<domain>/TASK-XXX.md)
    ↓ Atom of work
Code (BE/<service>/src/)
    ↓ Actual implementation
Tests (BE/<service>/tests/)
    ↓ Verification
Deployment (infra/k8s/, docker-compose.yml)
    ↓ Running the code
```

---

## 📋 Document Version & Status

| Document | Version | Last Updated | Status | Owner |
|----------|---------|--------------|--------|-------|
| **CODEMAPS/INDEX.md** | 1.26 | 2026-05-19 | ✅ Complete (Phase 1a-1n BE + FE auth, Phase 2a-2f user-service backend + frontend, Phase 3a-3i workout-service, Phase 4a Progress BE + FE, Phase 4b Auth-Admin + Workout-Admin + FE Admin Dashboard with TASK-031-BE-Auth-Admin + TASK-031-BE-Workout-Admin + TASK-031-FE-Admin-Dashboard) | Eng Team |
| **CODEMAPS/auth-service.md** | 2.6 | 2026-05-19 | ✅ Complete (Phase 1a-1j BE with integration testing & Docker + Phase 4b Auth-Admin with admin routes/service/controller/validation, 478 total tests, 98.45% coverage) | Eng Team |
| **CODEMAPS/auth-frontend.md** | 1.4 | 2026-05-17 | ✅ Complete (Phase 1k-1n FE with Zustand, hooks, pages, protected routes, design system, 250+ tests) | Eng Team |
| **CODEMAPS/user-service.md** | 1.2 | 2026-05-17 | ✅ Complete (Phase 2a-2c scaffold + model + CRUD API, 182 tests) | Eng Team |
| **CODEMAPS/user-profile-frontend.md** | 1.1 | 2026-05-17 | ✅ Complete (Phase 2d-2f FE data layer + setup UI + view/edit page, 193 tests, TailwindCSS-only) | Eng Team |
| **CODEMAPS/workout-service.md** | 2.0 | 2026-05-19 | ✅ Phase 3a-3h + 4b Complete (v2.0 scaffold ✅ TASK-021 + Exercise Model ✅ TASK-022 + WorkoutPlan Model & Generator ✅ TASK-023 + Exercise API ✅ TASK-024 + Workout Plan API ✅ TASK-025 + Workout Execution API ✅ TASK-028 + Admin Exercise API ✅ TASK-031-BE-Workout-Admin, 449 tests, 97%+ coverage) | Eng Team |
| **CODEMAPS/workout-frontend.md** | 1.3 | 2026-05-18 | ✅ Complete (Phase 3f-3i — TASK-026 FE data layer: 72 tests + TASK-027 FE UI: WorkoutPlanPage, WorkoutDayPage, 4 components, 80 tests + TASK-029 FE execution form: WorkoutExecutionForm, workoutSession.service, real-time validation, session management, read-only view, toast auto-dismiss) | Eng Team |
| **CODEMAPS/progress-service.md** | 1.0 | 2026-05-18 | ✅ Phase 4a BE Complete (Weight Log API: POST/GET /progress/weight, WeightLog model with trend calculation, 89 tests, 87.5% coverage) | Eng Team |
| **CODEMAPS/progress-frontend.md** | 1.0 | 2026-05-19 | ✅ Phase 4a FE Complete (ProgressDashboard page, WeightInputForm, WeightChart, WeightStatistics components, weightLog.service, progressStore, useProgress hook, 71+ tests, 100% coverage) | Eng Team |
| **CODEMAPS/admin-dashboard.md** | 1.0 | 2026-05-19 | ✅ Phase 4b FE Complete (Admin Dashboard UI: user management + exercise management, admin.service, adminStore, AdminLayout, 2 pages, 3 modals, 60+ tests, TailwindCSS dark mode) | Eng Team |
| **GUIDES/frontend-auth-setup.md** | 1.0 | 2026-05-16 | ✅ Complete (Step-by-step auth implementation guide) | Eng Team |
| **architecture/auth-service.md** | 1.8 | 2026-05-15 | ✅ Complete (BE with integration testing & Docker verification) | Eng Team |
| **architecture/project-structure.md** | 1.1 | 2026-05-15 | ✅ Complete | Eng Team |
| **SETUP.md** | 1.0 | 2026-05-11 | ✅ Complete | Eng Team |
| **spec/mapping/story-to-spec.md** | 3.18 | 2026-05-19 | ✅ Complete (100% Phase 1-4, Phase 4b Admin Complete with TASK-031-BE-Auth-Admin + TASK-031-BE-Workout-Admin + TASK-031-FE-Admin-Dashboard, 36/27 tasks complete, 2,331+ tests) | Eng Team |
| BE/auth-service/README.md | 1.5 | 2026-05-15 | ✅ Complete (448 tests with TASK-010) | Eng Team |
| BE/user-service/README.md | 1.1 | 2026-05-17 | ✅ Complete (TASK-015 scaffold + TASK-016 model + TASK-017 API documentation, 182 tests) | Eng Team |
| FE/README.md | 1.5 | 2026-05-17 | ✅ Complete (TASK-014: protected routes, design system, 250+ tests; TASK-018-020: user profile data layer + UI, 193 tests) | Eng Team |
| FE/DESIGN.md | 1.0 | 2026-05-16 | ✅ Complete (Comprehensive design system specification, 350+ lines) | Eng Team |

---

## 🎯 Phase Progression

### Phase 1: Auth Foundation ✅ 100% COMPLETE (Phase 1a-1n)
- Specification: `spec/features/auth/` (4 files) ✅
- Backend Implementation: `BE/auth-service/` ✅
- Frontend Implementation: `FE/src/` (stores, hooks, services, pages, components, design system) ✅
- Design System: `FE/DESIGN.md` + `FE/src/styles/design-system.css` ✅
- Backend Codemap: `docs/CODEMAPS/auth-service.md` ✅
- Frontend Codemap: `docs/CODEMAPS/auth-frontend.md` ✅
- Architecture: `docs/architecture/auth-service.md` ✅
- Guides: `docs/GUIDES/frontend-auth-setup.md` ✅
- **Phase 1a:** TASK-001 (Scaffolding) ✅
- **Phase 1b:** TASK-002 (User Model) ✅
- **Phase 1c:** TASK-003 (Registration) ✅
- **Phase 1d:** TASK-004 (Login) ✅
- **Phase 1e:** TASK-005 (Token Refresh) ✅
- **Phase 1f:** TASK-006 (JWT Middleware & RBAC) ✅
- **Phase 1g:** TASK-007 (Logout with Audit Logging) ✅
- **Phase 1h:** TASK-008 (User Info Endpoint) ✅
- **Phase 1i:** TASK-009 (Rate Limiting) ✅
- **Phase 1j:** TASK-010 (Integration Testing & Docker Build) ✅
- **Phase 1k:** TASK-011 (Frontend Auth Infrastructure: Zustand store, hooks, services) ✅
- **Phase 1l:** TASK-012 (LoginPage component with validation & error handling) ✅
- **Phase 1m:** TASK-013 (RegisterPage component with password strength & auto-login) ✅
- **Phase 1n:** TASK-014 (Protected Routes, Session Persistence, Design System, UI Redesign) ✅
- **Status:** 700+ tests passing (BE 448 + FE 250+), Complete auth stack with JWT, RBAC, audit logging, rate limiting, Zustand store, token refresh interceptors, session persistence, protected/role-based routes, LoginPage & RegisterPage components with form validation, password strength indicator, auto-login flow, modern dark-mode design system with emerald/amber palette, comprehensive CSS with animations and responsive design, comprehensive testing with Docker verification

### Phase 2: User Profile ✅ 100% COMPLETE (TASK-015 ✅ TASK-016 ✅ TASK-017 ✅ TASK-018 ✅ TASK-019 ✅ TASK-020 ✅)
- Specification: `spec/features/user-profile/` ✅ (4 spec files complete)
- Implementation: `BE/user-service/` (Scaffold ✅ TASK-015, Model ✅ TASK-016, CRUD API ✅ TASK-017)
- Frontend Implementation: `FE/src/` (Data layer ✅ TASK-018, Setup UI ✅ TASK-019, View/Edit Page ✅ TASK-020)
- Codemap: `docs/CODEMAPS/user-service.md` ✅ (v1.2 complete with TASK-017)
- Frontend Codemap: `docs/CODEMAPS/user-profile-frontend.md` ✅ (v1.1 complete with TASK-018-020)
- Service README: `BE/user-service/README.md` ✅ (v1.1 complete with full API documentation)
- Frontend README: `FE/README.md` ✅ (v1.4 updated with TASK-018 user profile data layer, TASK-019-020 UI)
- Dependencies: Phase 1 (Auth) ✅
- **TASK-015:** ✅ Scaffold complete (Express app, logger, database, Dockerfile, jest config, 14 tests)
- **TASK-016:** ✅ UserProfile Model & BMI complete (2 utils functions, Mongoose schema with hooks, 100 tests, 100% coverage)
- **TASK-017:** ✅ ProfileController & Routes complete (4 endpoints, middleware, service layer, 68 tests, 166 total)
- **TASK-018:** ✅ Frontend Data Layer complete (Zustand store, Axios service, custom hook, MSW mocking, 66 tests, Nginx gateway integration)
- **TASK-019:** ✅ Profile Setup UI complete (ProfileSetupPage, ProfileForm, BmiResultCard, 96 tests, TailwindCSS-only styling)
- **TASK-020:** ✅ Profile View/Edit Page complete (ProfilePage with update flow, success toast, 31 tests, routes + Navbar integration)
- **Status:** 977+ tests passing (BE 630 + FE 347), All backend & frontend endpoints implemented, Complete UI flow (setup → view/edit), Cross-store integration (auth→user), TailwindCSS-only styling, Production-ready

### Phase 3: Workout Core ✅ 100% COMPLETE (Backend Complete + Frontend Data Layer + Frontend UI + Frontend Execution)
- Specifications: `spec/features/workout-plan/`, `spec/features/workout-execution/` (both ✅ complete)
- Backend Implementation: `BE/workout-service/` (Scaffold ✅ TASK-021, Exercise Model ✅ TASK-022, WorkoutPlan Model ✅ TASK-023, Exercise API ✅ TASK-024, Workout Plan API ✅ TASK-025, Workout Execution API ✅ TASK-028)
- Frontend Implementation: `FE/src/` (Data layer ✅ TASK-026: service, store, hook, 72 tests; UI ✅ TASK-027: pages + components, 80 tests; Execution form ✅ TASK-029: WorkoutExecutionForm, session management, read-only view)
- Dependencies: Phase 2 (User Profile) ✅
- **TASK-021:** ✅ Scaffold complete (Express app, logger, database, Axios userServiceClient, 57 tests, 98% coverage)
- **TASK-022:** ✅ Exercise model + seed data (36 exercises, 6 muscle groups, 3 difficulties, 42 tests, 98.3% coverage)
- **TASK-023:** ✅ WorkoutPlan model + generator (4-week plans, PPL split, progressive overload, gender-aware equipment selection, 47 tests, 96.58% coverage)
- **TASK-024:** ✅ Exercise Library API (5 endpoints: GET list/detail, POST create, PUT update, DELETE soft-delete with BR-08, 51 tests, 80%+ coverage)
- **TASK-025:** ✅ Workout Plan API (4 endpoints: POST /plans/generate, GET /plans/my, GET /plans/my/week/:weekNumber, GET /plans/my/today with user-service integration and UTC date comparison, 30 tests, 85%+ coverage)
- **TASK-028:** ✅ Workout Execution API (POST /api/workouts/sessions, WorkoutSession model with SetResultSchema + ExerciseSessionSchema, workoutSessionService with multi-level validation, pre-save hooks, denormalization, 159 tests, 97%+ coverage)
- **TASK-026:** ✅ FE Workout Data Layer (Zustand store, Axios service with error mapping, custom hook, 72 tests, MSW mocking, silent 404 handling, cross-store logout integration)
- **TASK-027:** ✅ FE Workout Plan UI (WorkoutPlanPage with summary + week calendar, WorkoutDayPage with exercise details, 4 components: PlanSummaryCard, WeekCalendar, DayCard, ExerciseCard; TailwindCSS-only dark mode; 80 tests, 100% coverage)
- **TASK-029:** ✅ FE Workout Execution Form (WorkoutExecutionForm component with real-time validation [reps 0-100, weight 0-500], ExerciseCard execution mode, status toggle [completed/skipped], session summary [duration, mood, notes], auto-dismiss success toast 3s, workoutSession.service FE, GET /api/workouts/sessions for fetching saved sessions, read-only display for completed sessions, date guard for today-only logging)
- **Backend Total Tests:** 386 (57+42+47+51+30+159) | **Coverage:** 97%+ on service layer
- **Frontend Total Tests:** 152+ (72 data layer + 80 UI pages/components + TASK-029 execution tests) | **Coverage:** 100% of code paths

### Phase 4: Progress & Admin ✅ Phase 4a COMPLETE (BE + FE) + Phase 4b Auth-Admin COMPLETE (TASK-031-BE-Auth-Admin)
- Specifications: `spec/features/progress-tracking/` ✅, `spec/features/administration/` ✅
- **Phase 4a BE:** ✅ Weight Log API (TASK-030-BE) complete with POST/GET /progress/weight, trend calculation, 89 tests, 87.5% coverage
- **Phase 4a FE:** ✅ Progress Dashboard (TASK-030-FE) complete with ProgressDashboard page, WeightInputForm, WeightChart, WeightStatistics components, 71+ tests, 100% coverage
  - Data Layer: weightLog.service.js (createWeightLog, getWeightHistory), progressStore.js (5 computed getters + 3 actions), useProgress hook (error swallowing, computed values)
  - UI Components: ProgressDashboard (main page), WeightInputForm (form with validation), WeightChart (SVG line chart), WeightStatistics (4 stat cards)
  - Testing: 71 total tests (19 service + 37 store + 15 hook), 100% code coverage
- **Phase 4b Auth-Admin:** ✅ Admin User Management (TASK-031-BE-Auth-Admin) complete with GET /api/admin/users (list, paginate, filter by email/status) + PATCH /api/admin/users/:userId (deactivate/soft delete)
  - Service: adminService.js (getUserList with pagination & filtering, deactivateUser with idempotency)
  - Controller: adminController.js (getUserList handler, deactivateUser handler with CastError validation)
  - Middleware: adminValidation.js (validateUserDeactivate: require action field = 'deactivate')
  - Routes: admin.routes.js (GET/PATCH endpoints with authenticate + requireRole middleware)
  - Model: User.js updated with isDeleted field, deletedAt field, index on isDeleted, pre-save hook for deletedAt auto-set
  - Testing: 30 integration tests covering happy path, pagination, filtering, deactivation, idempotency, auth/authz, error cases
- **Phase 4b Workout-Admin:** ✅ Admin Exercise Management (TASK-031-BE-Workout-Admin) complete with GET /api/admin/exercises (list with pagination/search/filter), POST /api/admin/exercises (create), PATCH /api/admin/exercises/:exerciseId (update), DELETE /api/admin/exercises/:exerciseId (soft delete)
  - Model: Exercise.js enhanced with isDeleted, deletedAt, description, sets, reps, restTime fields, pre-save hook for deletedAt auto-set
  - Service: adminService.js (getExerciseList with pagination & search & muscleGroup filter, createExercise with name uniqueness, updateExercise with partial updates, deleteExercise with soft delete idempotency)
  - Controller: adminController.js (4 handlers with proper error mapping)
  - Middleware: adminValidation.js (validateExerciseCreate, validateExerciseUpdate with ReDoS prevention)
  - Routes: admin.routes.js (4 endpoints with authenticate + authorize(['Admin']) middleware)
  - Testing: 63 comprehensive integration tests covering CRUD operations, pagination, filtering, search, validation, auth/authz, soft-delete integrity
- **Phase 4b FE Admin Dashboard:** ✅ Admin UI (TASK-031-FE-Admin-Dashboard) complete with admin.service.js (6 API methods), adminStore.js (Zustand state + 9 actions), AdminLayout + AdminSidebar, UsersPage + ExercisesPage, 3 modals (DeactivateUserModal, ExerciseFormModal, DeleteExerciseModal), 60+ tests, TailwindCSS dark mode styling
- Dependencies: Phase 3 (Workout) ✅

---

## 💡 Tips for Using These Documents

### For Quick Answers
- Use the "Quick Navigation" section above
- Search within specific documents using Ctrl+F
- Check the table of contents at the top of each document

### For Deep Understanding
- Start with `docs/architecture/project-structure.md`
- Read relevant feature specs in `spec/features/`
- Study the service codemap in `docs/CODEMAPS/`
- Review the architecture in `docs/architecture/`
- Examine actual code in `BE/<service>/src/`

### For Implementation
1. Read the feature spec (`spec/features/<domain>/feature.spec.md`)
2. Check the task description (`tasks/<domain>/TASK-XXX.md`)
3. Review the codemap (`docs/CODEMAPS/<service>.md`)
4. Look at existing code patterns in similar services
5. Write failing tests first (TDD)
6. Implement until tests pass
7. Update codemap & architecture docs after completion

### For Onboarding New Developers
1. Have them read: `docs/SETUP.md`
2. Then read: `docs/architecture/project-structure.md`
3. Then read: Service-specific `README.md`
4. Then explore code via codemap in `docs/CODEMAPS/`
5. Finally, assign a task and guide through TDD workflow

---

## 🔗 Cross-References

### Documentation Interdependencies

```
CLAUDE.md
├─→ spec/mapping/story-to-spec.md
│   ├─→ spec/features/<domain>/{feature,api,schema,rules}.spec.md
│   ├─→ docs/CODEMAPS/<service>.md
│   └─→ docs/architecture/<service>.md
│
├─→ docs/architecture/project-structure.md
│   ├─→ docs/architecture/<service>.md
│   ├─→ BE/<service>/README.md
│   └─→ docs/CODEMAPS/<service>.md
│
├─→ docs/SETUP.md
│   ├─→ docs/architecture/project-structure.md
│   ├─→ BE/<service>/README.md
│   └─→ CLAUDE.md
│
└─→ docs/CODEMAPS/<service>.md
    ├─→ spec/features/<domain>/
    ├─→ docs/architecture/<service>.md
    └─→ BE/<service>/src/
```

---

## 📞 When You're Stuck

1. **Can't find something?** Use Ctrl+F to search this index
2. **Don't understand the architecture?** Read `docs/architecture/project-structure.md`
3. **Stuck on implementation?** Check the feature spec first, then the codemap
4. **Tests failing?** Review test examples in the service codemap
5. **Need to add a feature?** Follow the task instructions in `spec/mapping/story-to-spec.md`

---

## 📝 Document Metadata

- **Version:** 1.26
- **Created:** 2026-05-11
- **Last Updated:** 2026-05-19
- **Status:** Complete (Phase 1a-1n: 14/14 auth tasks ✅, 700+ tests ✅; Phase 2a-2f: 6/6 user profile tasks ✅, 347+ tests ✅; Phase 3a-3i: 9/9 workout tasks ✅, 386 BE + 152+ FE = 538+ tests ✅; Phase 4a: TASK-030-BE ✅ + TASK-030-FE ✅, 89 BE + 71+ FE = 160+ tests ✅; Phase 4b: TASK-031-BE-Auth-Admin ✅ + TASK-031-BE-Workout-Admin ✅ + TASK-031-FE-Admin-Dashboard ✅, 30 + 63 + 60 = 153 tests ✅; Total: 36/32 tasks ✅, 2,331+ tests ✅)
- **Owner:** Engineering Team
- **Review Cycle:** Update after each phase completion
- **Phase 1 Complete:** 14/14 auth tasks ✅, 700+ tests passing (BE 448 + FE 250+) ✅, design system implemented ✅, production-ready ✅
- **Phase 2 Complete:** 6/6 user profile tasks ✅, TASK-015 ✅ (scaffold), TASK-016 ✅ (UserProfile model + BMI), TASK-017 ✅ (CRUD API), TASK-018 ✅ (FE data layer), TASK-019 ✅ (Profile setup UI), TASK-020 ✅ (Profile view/edit page), 347+ tests passing (BE 182 + FE 165) ✅, Complete profile workflow ✅, Cross-store integration ✅, TailwindCSS-only ✅, Production-ready ✅
- **Phase 3a-3i Complete:** TASK-021 ✅ (Scaffold: Express, logger, database, Axios userServiceClient, 57 tests), TASK-022 ✅ (Exercise Model: 36 exercises, 42 tests), TASK-023 ✅ (WorkoutPlan Model & Generator: 4-week plans, PPL split, progressive overload, 47 tests), TASK-024 ✅ (Exercise API: CRUD endpoints, RBAC, soft-delete, 51 tests), TASK-025 ✅ (Workout Plan API: 4 endpoints, user-service integration, BR-01/BR-02 enforcement, UTC date comparison, 30 tests), TASK-026 ✅ (FE Workout Data Layer: service, store, hook, 72 tests, silent 404, cross-store integration), TASK-027 ✅ (FE Workout Plan UI: WorkoutPlanPage, WorkoutDayPage, 4 components, 80 tests, TailwindCSS-only dark mode), TASK-028 ✅ (BE Workout Execution API: POST /workouts/sessions, WorkoutSession model, 159 tests), TASK-029 ✅ (FE Workout Execution Form: real-time validation, session management, read-only view, toast auto-dismiss), Total 386 BE + 152+ FE = 538+ tests, 97%+ service layer coverage + 100% FE code path coverage
- **Phase 4a BE Complete:** TASK-030-BE ✅ (Weight Log API: POST/GET /progress/weight, WeightLog model with trend calculation, weightLogService, 89 tests, 87.5% coverage, compound unique index on (userId, date), trend auto-calculation via pre-save hook, date validation (UTC-safe, no future), weight validation (30-200kg), notes validation (optional, 200 chars), comprehensive test coverage)
- **Phase 4b BE Complete:** TASK-031-BE-Auth-Admin ✅ (30 tests) + TASK-031-BE-Workout-Admin ✅ (63 tests) = 93 admin BE tests total
