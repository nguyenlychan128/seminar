# CLAUDE.md

## Project Identity

**FitGainer** — A fitness web app for underweight users (BMI < 18.5) focused on weight gain and muscle building.

Architecture: Microservices | Runtime: Node.js + Express (plain JS, CommonJS) | DB: MongoDB + Mongoose | Auth: JWT | Async: RabbitMQ | Gateway: Nginx | Frontend: React + Vite | TailwindCSS + shadcn/ui | Zustand | Axios

---

## Business Domain — READ THIS FIRST

`business/` is READ-ONLY. Never modify.

- `business/context.md` — system overview in Vietnamese
- `business/user_stories/user_stories.md` — raw user stories, source of truth

---

## Microservice Architecture

| Service | Responsibility | Port |
|---|---|---|
| `auth-service` | JWT login/logout/refresh, role: User / Admin | 3001 |
| `user-service` | Body profile (height, weight, age, sex), BMI calc, body classification | 3002 |
| `workout-service` | Exercise library, workout plan templates, personalized plans | 3003 |
| `progress-service` | Weight logs, workout execution logs, chart data | 3004 |

**API Gateway:** Nginx at `infra/nginx/`. All sync calls route through Nginx; async events via RabbitMQ.

---

## AI Dev Workflow (Unified Spec → Tasks → Code)

```
IDEA → PRODUCT → SPEC → TASK (BE+FE) → TDD → CODE → REVIEW → GATE → COMMIT
```

**Commands & Agents:**
1. `/generate-spec` — Unified feature spec (BE API + FE UI) from business/
2. `/spec-to-task` — Generate **BOTH** `TASK-XXX-be-*` AND `TASK-XXX-fe-*` tasks
3. `tdd-guide` agent → Test cases before implementation
4. `/task-to-code` → Code implementation
5. `code-reviewer` agent → Code review
6. `doc-updater` agent → Update docs/CODEMAPS
7. `git-commit-and-push` → Conventional commits

**Key Rule:** `/spec-to-task` must generate BOTH backend and frontend tasks. If only backend tasks exist, the spec is incomplete.

---

## Folder Conventions

**Spec (Unified — covers BE API + FE UI):**
```
spec/features/<domain>/
  ├── feature.spec.md      # Overview, user stories, BE+FE responsibilities
  ├── api.spec.md          # BE endpoints + FE integration points
  ├── schema.spec.md       # BE models + FE state/component structure
  └── rules.spec.md        # Business rules + UI rules
```

**Tasks (Split by tier):**
```
tasks/<domain>/
  ├── TASK-NNN-be-<slug>.md    # Backend task
  └── TASK-NNN-fe-<slug>.md    # Frontend task
```

**Frontend Structure:**
```
FE/src/
  ├── components/      # Reusable UI (ui/, shared/)
  ├── pages/          # Page components (auth/, profile/, workout/, etc.)
  ├── hooks/          # Custom React hooks
  ├── stores/         # Zustand stores (auth, user, workout, etc.)
  ├── services/       # API client (api.js, auth.service, user.service, etc.)
  ├── utils/          # Utility functions
  ├── styles/         # TailwindCSS global styles
  └── tests/          # Component & integration tests
```

---

## Testing Rules

**Backend:** TDD mandatory. Jest + Supertest + MongoMemoryServer. Coverage ≥80% for business logic. No external API calls (mock all).

**Frontend:** TDD mandatory. Vitest/Jest + React Testing Library + MSW (Mock Service Worker for API mocking). Coverage ≥80% for feature components. Tests must not depend on live backend.

---

## .env Conventions

**Backend service `.env`:**
```bash
NODE_ENV=development
PORT=300X
MONGO_URI=mongodb://localhost:27017/fitgainer-<service>
JWT_SECRET=<32+ chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RABBITMQ_URL=amqp://localhost:5672
LOG_LEVEL=debug
```

**Frontend `.env`:**
```bash
VITE_ENV=development
VITE_API_BASE_URL=/api
VITE_REACT_QUERY_DEVTOOLS=true
```

---

## Quality Gates

All gates must pass before commit:

```bash
npm run lint          # ESLint — zero warnings
npm test              # Jest/Vitest — all green
docker build .        # Dockerfile builds successfully
```

---

## Behavioral Guidelines

**1. Think Before Coding:** Surface assumptions & tradeoffs. If unclear, ask. Prefer simpler.

**2. Simplicity First:** Minimum code. No speculative features. Plain JavaScript (no TS/NestJS). No abstractions unless 3+ uses.

**3. Surgical Changes:** Touch only what's needed. Match existing style. Every line traces to the task.

**4. Goal-Driven:** Multi-step tasks get a plan first: `1. [Step] → verify: [check]`

---

## Key Constraints

- `business/` is READ-ONLY
- Backend: Plain JavaScript, CommonJS (`require`), no TypeScript
- Frontend: React + ES6+ JS, no TypeScript. State: Zustand. HTTP: Axios. CSS: **TailwindCSS only** — KHÔNG viết CSS thuần, KHÔNG tạo file `.css` riêng cho component. Design system: xem `FE/DESIGN.md` (dark mode, emerald + amber palette).
- No code-level API Gateway (Nginx handles routing)
- **Every feature spec generates BOTH BE + FE tasks** via `/spec-to-task`. Missing FE tasks = incomplete spec.
- All services: `Dockerfile`, `.env.example`, conforming tests
- `terraform/` is out of scope — do not implement
