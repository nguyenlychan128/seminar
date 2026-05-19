# Project Structure

## Overview

```
project-root/
├── .github/
│   └── workflows/                  # CI/CD pipelines
│       ├── ci.yml
│       ├── cd.yml
│       └── e2e.yml
│
├── business/                        # Business context (READ-ONLY)
│   ├── context.md                   # System overview in Vietnamese
│   └── user_stories/
│       └── user_stories.md          # Raw user stories, source of truth
│
├── spec/                            # AI-generated specifications
│   ├── features/                    # Feature specs
│   │   ├── auth/
│   │   │   ├── feature.spec.md
│   │   │   ├── api.spec.md
│   │   │   ├── schema.spec.md
│   │   │   └── rules.spec.md
│   │   ├── user-profile/            # Body data, BMI, classification
│   │   │   ├── feature.spec.md
│   │   │   ├── api.spec.md
│   │   │   ├── schema.spec.md
│   │   │   └── rules.spec.md
│   │   ├── workout-plan/            # Plan generation, exercises, templates
│   │   │   ├── feature.spec.md
│   │   │   ├── api.spec.md
│   │   │   ├── schema.spec.md
│   │   │   └── rules.spec.md
│   │   ├── workout-execution/       # Today's workout, logging sets
│   │   │   ├── feature.spec.md
│   │   │   ├── api.spec.md
│   │   │   ├── schema.spec.md
│   │   │   └── rules.spec.md
│   │   ├── progress-tracking/       # Weight charts, strength charts
│   │   │   ├── feature.spec.md
│   │   │   ├── api.spec.md
│   │   │   ├── schema.spec.md
│   │   │   └── rules.spec.md
│   │   └── administration/          # Admin CRUD for exercises, users, plans
│   │       ├── feature.spec.md
│   │       ├── api.spec.md
│   │       ├── schema.spec.md
│   │       └── rules.spec.md
│   ├── flows/                       # Cross-service flows
│   │   ├── onboarding-flow.md       # User registration → profile → first plan
│   │   └── workout-execution-flow.md
│   └── mapping/
│       └── story-to-spec.md         # Story → Feature mapping (100% coverage)
│
├── tasks/                           # Generated implementation tasks
│   ├── auth/
│   │   ├── TASK-001-implement-auth-service-scaffolding.md
│   │   ├── TASK-002-implement-user-model-and-database.md
│   │   ├── TASK-003-implement-registration-endpoint.md
│   │   └── TASK-004-implement-login-endpoint.md
│   ├── user-profile/
│   │   ├── TASK-010-create-body-profile.md
│   │   ├── TASK-011-calculate-bmi.md
│   │   └── TASK-012-classify-body-type.md
│   ├── workout-plan/
│   │   ├── TASK-020-create-exercise.md
│   │   ├── TASK-021-generate-personalized-plan.md
│   │   ├── TASK-022-view-daily-workout.md
│   │   └── TASK-023-manage-plan-templates.md
│   ├── workout-execution/
│   │   ├── TASK-030-log-set-result.md
│   │   └── TASK-031-complete-daily-workout.md
│   ├── progress-tracking/
│   │   ├── TASK-040-log-body-weight.md
│   │   ├── TASK-041-weight-chart-data.md
│   │   └── TASK-042-strength-chart-data.md
│   └── administration/
│       ├── TASK-080-admin-manage-exercises.md
│       ├── TASK-081-admin-manage-users.md
│       └── TASK-082-admin-manage-plan-templates.md
│
├── BE/                              # Backend microservices
│   ├── auth-service/                # Authentication Service
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── index.js
│   │   │   ├── controllers/
│   │   │   │   └── auth.controller.js
│   │   │   ├── services/
│   │   │   │   ├── auth.service.js
│   │   │   │   └── token.service.js
│   │   │   ├── repositories/
│   │   │   │   └── user.repository.js
│   │   │   ├── models/
│   │   │   │   └── user.model.js
│   │   │   ├── events/
│   │   │   │   └── auth.events.js
│   │   │   └── index.js
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── user-service/                # User Management Service (Body Profile)
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── index.js
│   │   │   ├── controllers/
│   │   │   │   └── user.controller.js
│   │   │   ├── services/
│   │   │   │   ├── user.service.js
│   │   │   │   └── bmi.service.js   # BMI calc + body classification
│   │   │   ├── repositories/
│   │   │   │   └── user.repository.js
│   │   │   ├── models/
│   │   │   │   └── user.model.js
│   │   │   ├── events/
│   │   │   │   └── user.events.js
│   │   │   └── index.js
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── workout-service/             # Workout & Exercise Service
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── index.js
│   │   │   ├── controllers/
│   │   │   │   ├── exercise.controller.js
│   │   │   │   ├── plan.controller.js
│   │   │   │   └── replacement.controller.js
│   │   │   ├── services/
│   │   │   │   ├── exercise.service.js
│   │   │   │   ├── plan.service.js         # Plan generation logic
│   │   │   │   ├── adaptive.service.js     # Detect no-progress, suggest adjust
│   │   │   │   └── replacement.service.js  # Swap by muscle group
│   │   │   ├── repositories/
│   │   │   │   ├── exercise.repository.js
│   │   │   │   └── plan.repository.js
│   │   │   ├── models/
│   │   │   │   ├── exercise.model.js
│   │   │   │   ├── plan.model.js
│   │   │   │   └── plan-day.model.js
│   │   │   ├── events/
│   │   │   │   └── workout.events.js
│   │   │   └── index.js
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── progress-service/            # Progress Tracking Service
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── index.js
│   │   │   ├── controllers/
│   │   │   │   ├── weight-log.controller.js
│   │   │   │   └── execution-log.controller.js
│   │   │   ├── services/
│   │   │   │   ├── weight-log.service.js
│   │   │   │   ├── execution-log.service.js
│   │   │   │   └── chart.service.js        # Aggregate data for charts
│   │   │   ├── repositories/
│   │   │   │   ├── weight-log.repository.js
│   │   │   │   └── execution-log.repository.js
│   │   │   ├── models/
│   │   │   │   ├── weight-log.model.js
│   │   │   │   └── execution-log.model.js
│   │   │   ├── events/
│   │   │   │   └── progress.events.js
│   │   │   └── index.js
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   └── shared/                      # Shared utilities & constants
│       ├── constants/
│       │   └── index.js
│       ├── utils/
│       │   ├── logger.js             # Winston factory
│       │   ├── validator.js
│       │   └── bmi.js                # Shared BMI formula
│       └── events/
│           └── event-types.js        # RabbitMQ event constants
│
├── FE/                              # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button/
│   │   │   │   ├── Input/
│   │   │   │   ├── Modal/
│   │   │   │   └── Layout/
│   │   │   ├── auth/
│   │   │   ├── workout/              # Exercise & plan components
│   │   │   │   ├── ExerciseCard/
│   │   │   │   ├── PlanCalendar/
│   │   │   │   └── SetLogger/
│   │   │   └── progress/             # Weight & strength chart components
│   │   │       ├── WeightChart/
│   │   │       └── StrengthChart/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   ├── user/
│   │   │   │   └── ProfilePage.jsx   # Body data, BMI display
│   │   │   ├── workout/              # Fitness domain pages
│   │   │   │   ├── WorkoutPlanPage.jsx
│   │   │   │   ├── TodayWorkoutPage.jsx
│   │   │   │   └── ExerciseDetailPage.jsx
│   │   │   ├── progress/             # Fitness domain pages
│   │   │   │   ├── WeightProgressPage.jsx
│   │   │   │   └── StrengthProgressPage.jsx
│   │   │   └── admin/                # Admin dashboard
│   │   │   │   ├── AdminDashboardPage.jsx
│   │   │   │   ├── ManageExercisesPage.jsx
│   │   │   │   ├── ManageUsersPage.jsx
│   │   │   │   └── ManagePlansPage.jsx
│   │   │   └── HomePage.jsx
│   │   ├── services/                # API clients
│   │   │   ├── api-client.js         # Axios instance, base URL from VITE_API_BASE_URL
│   │   │   ├── auth.service.js
│   │   │   ├── user.service.js
│   │   │   ├── workout.service.js    # Fitness-specific API calls
│   │   │   └── progress.service.js   # Fitness-specific API calls
│   │   ├── stores/                  # Zustand state management
│   │   │   ├── auth.store.js
│   │   │   ├── user.store.js
│   │   │   ├── workout.store.js
│   │   │   └── progress.store.js
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   │   └── assets/
│   │       └── images/
│   ├── tests/
│   │   ├── unit/
│   │   │   └── components/
│   │   └── integration/
│   │       └── pages/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── infra/                           # Infrastructure
│   ├── nginx/                       # API Gateway (Reverse Proxy)
│   │   ├── nginx.conf
│   │   └── conf.d/
│   │       └── fitness.conf         # Upstream blocks + location routing per service
│   │
│   ├── k8s/                         # Kubernetes manifests
│   │   ├── base/
│   │   │   ├── namespace.yaml
│   │   │   ├── configmap.yaml
│   │   │   └── secrets.yaml
│   │   ├── services/
│   │   │   ├── auth-service/
│   │   │   │   ├── deployment.yaml
│   │   │   │   └── service.yaml
│   │   │   ├── user-service/
│   │   │   ├── workout-service/
│   │   │   └── progress-service/
│   │   ├── ingress/
│   │   │   └── ingress.yaml
│   │   └── overlays/
│   │       ├── dev/
│   │       └── prod/
│   │
│   ├── monitoring/                  # Observability (out of seminar scope for now)
│   │   ├── prometheus/
│   │   │   ├── prometheus.yml
│   │   │   └── rules/
│   │   │       └── alerts.yml
│   │   ├── grafana/
│   │   │   └── dashboards/
│   │   │       ├── services.json
│   │   │       └── fitness-business.json
│   │   └── loki/
│   │       └── loki.yml
│   │
│   └── terraform/                   # OUT OF SCOPE for seminar
│
├── docs/                            # Documentation
│   ├── architecture/
│   │   ├── overview.md
│   │   ├── project-structure.md     # This file
│   │   ├── microservices-diagram.md
│   │   └── data-flow.md
│   ├── api/
│   │   ├── auth-service.md
│   │   ├── user-service.md
│   │   ├── workout-service.md
│   │   └── progress-service.md
│   ├── deployment/
│   │   ├── local-setup.md
│   │   └── production.md
│   └── adr/                         # Architecture Decision Records
│       ├── ADR-001-microservices-architecture.md
│       ├── ADR-002-event-driven-communication.md
│       ├── ADR-003-spec-driven-development.md
│       └── ADR-004-plain-js-not-typescript.md
│
├── scripts/                         # Utility scripts
│   ├── generate-spec.sh
│   ├── generate-tasks.sh
│   ├── validate-spec-coverage.sh
│   └── bootstrap.sh
│
├── tests/                           # End-to-end tests
│   └── e2e/
│       ├── auth/
│       │   ├── login.spec.js
│       │   └── registration.spec.js
│       ├── workout/
│       │   ├── view-plan.spec.js
│       │   └── log-set.spec.js
│       ├── progress/
│       │   └── weight-log.spec.js
│       ├── user/
│       │   └── profile.spec.js
│       ├── chatbot/
│       │   └── chat-query.spec.js
│       ├── fixtures/
│       │   └── test-data.json
│       └── helpers/
│           └── auth.helper.js
│
├── CLAUDE.md                        # AI project rules (≤ 180 lines)
├── .gitignore
└── docker-compose.yml               # Local dev environment
```

---

## Directory Purposes

### Core Directories

| Directory | Purpose |
|-----------|---------|
| `business/` | Business context & raw user stories (READ-ONLY) |
| `spec/` | AI-generated specifications from user stories |
| `tasks/` | Generated implementation tasks |
| `BE/` | Backend microservices (6 services + shared) |
| `FE/` | Frontend application (React + Vite) |
| `infra/` | Nginx gateway, Kubernetes, monitoring, Terraform |
| `docs/` | Documentation |
| `tests/e2e/` | End-to-end tests |

### Spec-Driven Flow

```
business/user_stories/user_stories.md
    ↓ (normalize & group by fitness domain)
spec/features/<fitness-domain>/{feature,api,schema,rules}.spec.md
    ↓ (extract requirements)
tasks/<fitness-domain>/TASK-XXX-<verb>-<slug>.md
    ↓ (implement with TDD)
BE/<service>/src/ + FE/src/
    ↓ (test & verify)
tests/e2e/
```

### Backend Microservices Architecture

FitGainer has **4 independent, containerized services**:

| Service | Port | Responsibility |
|---------|------|---|
| **auth-service** | 3001 | JWT login/logout/refresh, User/Admin roles |
| **user-service** | 3002 | Body profile (height, weight, age, sex), BMI calc, body classification |
| **workout-service** | 3003 | Exercise library, workout plan generation (personalized, day-by-day) |
| **progress-service** | 3004 | Weight logs, workout execution logs, chart data aggregation for trends |

**API Gateway:** Nginx at `infra/nginx/` — routes all sync requests, enforces auth, rate limiting.

**Communication:**
- **Sync:** REST calls through Nginx gateway
- **Async:** Event-driven via RabbitMQ exchange `fitgainer.events`

### Frontend Structure

React + Vite SPA with Zustand state management:
- **Pages:** Align with fitness domains (user-profile, workout-plan, workout-execution, progress-tracking, admin)
- **Components:** Reusable UI for common patterns, fitness-specific domain components
- **Services:** API client wrappers (Axios)
- **Stores:** Global state per domain

### Testing Strategy

- **Unit tests** — `BE/<service>/tests/unit/` — pure logic, no I/O
- **Integration tests** — `BE/<service>/tests/integration/` — MongoMemoryServer, no live DB
- **E2E tests** — `tests/e2e/` — full HTTP via Supertest against running containers
- **Coverage:** ≥ 80% for services with business logic (workout-service, progress-service)

---

## Key Constraints

1. ✅ `business/` is **READ-ONLY** — AI never modifies
2. ✅ Plain JavaScript only — no TypeScript, no NestJS
3. ✅ Every user story MUST map to `spec/features/<fitness-domain>/`
4. ✅ `spec/mapping/story-to-spec.md` tracks 100% coverage
5. ✅ Each feature spec = 4 files (feature, api, schema, rules)
6. ✅ No code-level API Gateway — Nginx at `infra/nginx/` handles all routing
7. ✅ Each service has `Dockerfile`, `package.json`, `.env.example`
8. ✅ TDD is mandatory — write failing test first
9. ✅ Quality gates (lint + test + docker build) must pass before commit
10. ✅ `terraform/` is **out of scope** for the seminar — do not implement

---

## AI Dev Workflow

```
IDEA → PRODUCT → SPEC → DESIGN → TASK → TDD → REVIEW → QUALITY GATE → COMMIT → UPDATE STATE → REPEAT
```

1. **IDEA** — Business need identified in `business/`
2. **PRODUCT** — Map to user story in `business/user_stories/user_stories.md`
3. **SPEC** — Generate 4-file feature spec in `spec/features/<domain>/`
4. **DESIGN** — Update `docs/architecture/` if structural decisions change; log ADR
5. **TASK** — Generate atomic task in `tasks/<domain>/TASK-XXX-<slug>.md`
6. **TDD** — Write failing test, implement until it passes
7. **REVIEW** — Self-review: every changed line traces to the task
8. **QUALITY GATE** — Run `npm run lint`, `npm test`, `docker build` (all pass required)
9. **COMMIT** — Conventional commit message after gates pass
10. **UPDATE STATE** — Mark task done; update `spec/mapping/story-to-spec.md`

---

## Getting Started

1. **Understand the business:**
   ```bash
   cat business/context.md          # Overview
   cat business/user_stories/user_stories.md     # Requirements
   ```

2. **Generate specifications** from user stories (next phase)

3. **Validate spec coverage** — ensure 100% story-to-spec mapping

4. **Generate tasks** from specs

5. **Develop:** Pick a task, follow TDD, implement until all tests pass

6. **Run locally:**
   ```bash
   cp BE/*-service/.env.example BE/*-service/.env
   cp FE/.env.example FE/.env
   docker-compose up
   ```

7. **Ship:** PR → review → quality gates → merge → deploy
