# Workout Service Codemap v2.0

**Service:** `BE/workout-service` | **Port:** 3003 | **Last Updated:** 2026-05-19 | **Status:** Phase 3a-3h + 4b Backend ✅ (Scaffold + Exercise Model + WorkoutPlan Model + Exercise API + Workout Plan API + Workout Execution API + Admin Exercise API) | **Frontend:** Phase 3f-3i FE ✅ (TASK-026 Data Layer + TASK-027 Workout Plan UI + TASK-029 Execution Form) | **Tests:** 449 total (57+42+47+51+30+159+63)

---

## 📌 Overview

Codemap for the FitGainer Workout Service. This document provides a structural overview of the codebase, module dependencies, and data flows for quick developer onboarding.

The workout-service manages exercise libraries, workout plan templates, personalized workout plan generation with progressive overload adaptation, and workout execution logging with comprehensive session tracking and validation.

---

## 🗂️ Directory Structure

```
BE/workout-service/
├── src/
│   ├── server.js                      # Entry point: HTTP server setup + database connection
│   ├── app.js                         # Express app: middleware setup, routing (TASK-021)
│   ├── config/
│   │   ├── database.js                # MongoDB connection with pool config (TASK-021)
│   │   └── userServiceClient.js       # Axios client for user-service (TASK-021) ✅
│   ├── routes/
│   │   ├── exercise.routes.js         # Exercise routes (TASK-024) ✅
│   │   ├── plan.routes.js             # Workout plan routes (TASK-025) ✅
│   │   ├── workoutSessionRoutes.js    # Workout session routes (TASK-028) ✅
│   │   └── admin.routes.js            # Admin exercise routes (TASK-031-BE-Workout-Admin) ✅
│   ├── utils/
│   │   └── logger.js                  # Winston logging factory (TASK-021)
│   ├── models/                        # Mongoose schemas
│   │   ├── Exercise.js                # Exercise schema (TASK-022) ✅
│   │   ├── WorkoutPlan.js             # WorkoutPlan schema (TASK-023) ✅
│   │   └── WorkoutSession.js          # WorkoutSession with nested SetResult + ExerciseSession (TASK-028) ✅
│   ├── controllers/                   # Route handlers
│   │   ├── exercise.controller.js     # 5 handlers: list, detail, create, update, delete (TASK-024) ✅
│   │   ├── plan.controller.js         # 4 handlers: getMyPlan, generatePlan, getWeek, getTodayWorkout (TASK-025) ✅
│   │   ├── workoutSessionController.js # 1 handler: createSession (POST /sessions) (TASK-028) ✅
│   │   └── adminController.js         # 4 handlers: getExerciseList, createExercise, updateExercise, deleteExercise (TASK-031-BE-Workout-Admin) ✅
│   ├── middleware/                    # Custom middleware
│   │   ├── authenticate.js            # JWT verification (TASK-024, TASK-028) ✅
│   │   ├── authorize.js               # RBAC middleware (TASK-024) ✅
│   │   └── adminValidation.js         # Admin exercise validation (TASK-031-BE-Workout-Admin) ✅
│   ├── validators/                    # Input validation middleware
│   │   └── exercise.validator.js      # Exercise POST/PUT validation (TASK-024) ✅
│   ├── errors/                        # Custom error classes
│   │   ├── ValidationError.js         # Input validation errors (TASK-028) ✅
│   │   ├── DuplicateSessionError.js   # Duplicate session constraint (TASK-028) ✅
│   │   └── DatabaseError.js           # Database operation errors (TASK-028) ✅
│   └── services/                      # Business logic
│       ├── planGenerator.js           # Plan generation service (TASK-023) ✅
│       ├── planService.js             # Workout plan service layer (TASK-025) ✅
│       ├── exercise.service.js        # Exercise service layer (TASK-024)
│       ├── workoutSessionService.js   # Session validation, denormalization, duplicate check (TASK-028) ✅
│       └── adminService.js            # Admin exercise management (TASK-031-BE-Workout-Admin) ✅
├── tests/
│   ├── unit/
│   │   ├── logger.test.js             # Logger tests (TASK-021) ✅ 16 tests
│   │   ├── database.test.js           # Database connection tests (TASK-021) ✅ 13 tests
│   │   └── userServiceClient.test.js  # User service client tests (TASK-021) ✅ 12 tests
│   └── integration/
│       ├── app.test.js                # Express app integration tests (TASK-021) ✅ 14 tests
│       ├── exercise.model.test.js     # Exercise model tests (TASK-022) ✅ 42 tests
│       ├── workoutplan.model.test.js  # WorkoutPlan model tests (TASK-023) ✅ 47 tests
│       ├── exercise.api.test.js       # Exercise API integration tests (TASK-024) ✅ 51 tests
│       ├── plan.api.test.js           # Workout Plan API integration tests (TASK-025) ✅ 30 tests
│       ├── workoutSession.api.test.js # Workout Session API integration tests (TASK-028) ✅ 159 tests
│       └── admin-exercises.test.js    # Admin Exercise API integration tests (TASK-031-BE-Workout-Admin) ✅ 63 tests
├── logs/                              # [Runtime logs — .gitignored]
│   ├── app.log
│   └── error.log
├── Dockerfile                         # Production container (TASK-021)
├── jest.config.js                     # Test configuration (80% coverage)
├── package.json                       # Dependencies & scripts
├── .env.example                       # Environment template
├── .gitignore                         # Excludes .env, logs, node_modules
└── README.md                          # Service documentation
```

---

## 🔌 Module Dependencies

### Implemented Modules (TASK-021 ✅)

#### `src/server.js`
**Responsibility:** HTTP server lifecycle management
- Entry point for the service
- Creates Express app via `require('./app')`
- Initializes MongoDB connection via `connectDatabase()`
- Starts HTTP server on `PORT` (3003)
- Handles graceful shutdown (SIGTERM/SIGINT)
- Logs startup/shutdown/errors via logger
- Monitors unhandled rejections and exceptions

**Dependencies:**
- `./app.js` — Express app
- `./config/database.js` — Database connection functions
- `./utils/logger.js` — Winston logger
- `dotenv` — Environment variables

**Exports:** None (side effects only, called directly via `node src/server.js`)

**Testing:** Integration tests via app.test.js

#### `src/app.js`
**Responsibility:** Express application configuration
- Middleware setup:
  - CORS configuration (allows specified origins)
  - Body parser (JSON, URL-encoded)
  - Request logging via Winston
  - Error handling middleware
- Route registration:
  - Health check endpoint (GET /health)
  - Exercise routes (GET, POST, PUT, DELETE /exercises)
  - Plan routes (GET, POST /plans)
- Global error handler
- JSON parse error handler
- 404 handler

**Dependencies:**
- `express` — HTTP framework
- `cors` — Cross-origin resource sharing
- `./utils/logger.js` — Winston logger
- `./routes/exercise.routes.js` — Exercise route module
- `./routes/plan.routes.js` — Plan route module

**Exports:**
- `module.exports = app` — Express app instance

**Testing:** Integration tests in app.test.js (14 tests)

#### `src/config/database.js`
**Responsibility:** MongoDB connection management
- Connection string from `MONGO_URI` environment variable
- Fallback to `fitgainer-workout` if not specified
- Connection pool configuration:
  - Min connections: 5
  - Max connections: 20
  - Socket timeout: 5000ms
  - Server selection timeout: 5000ms
  - Connect timeout: 5000ms
- Graceful connection cleanup on shutdown
- Error handling with structured logging

**Dependencies:**
- `mongoose` — MongoDB ODM
- `./logger.js` — Winston logger

**Exports:**
- `connectDatabase()` — Async function to establish connection
- `disconnectDatabase()` — Async function to close connection

**Testing:** Unit tests in database.test.js (13 tests)

#### `src/config/userServiceClient.js` (TASK-021 ✅)
**Responsibility:** Axios HTTP client for user-service communication
- Singleton Axios instance with 5000ms timeout
- Error handling: maps 404 responses to user-friendly error
- Automatic response data transformation
- Structured logging before throwing errors
- JWT token passing via Authorization header

**Features:**
- `getUserProfile(token)` → Promise<User profile data>
  - Throws "User profile not found" on 404 (with warn log)
  - Throws generic error on 5xx or network issues
  - Returns plain object (not Axios response wrapper)
- Timeout: 5000ms for all requests
- Retry logic: None (MVP version)

**Dependencies:**
- `axios` — HTTP client
- `./logger.js` — Winston logger

**Exports:**
- `module.exports = { getUserProfile }` — Async method

**Usage:**
```javascript
const client = require('./config/userServiceClient');
const profile = await client.getUserProfile(authToken);
```

**Testing:** Unit tests in userServiceClient.test.js (12 tests)

#### `src/utils/logger.js`
**Responsibility:** Centralized Winston logging factory
- JSON formatted logs in production
- Colorized console output in development
- Separate output files:
  - `logs/app.log` — All logs
  - `logs/error.log` — Error logs only
- Configurable log level via `LOG_LEVEL` environment variable
- Structured logging with metadata
- Default metadata: `service = 'workout-service'`

**Dependencies:**
- `winston` — Logging library
- `fs` — File system (for log directory)

**Exports:**
- `module.exports = logger` — Winston logger instance

**Usage:**
```javascript
const logger = require('./utils/logger');
logger.info('Workout plan created', { userId, planId });
logger.error('BMI calculation failed', { error: e.message });
```

**Testing:** Unit tests in logger.test.js (16 tests), 100% coverage

#### `src/routes/exercise.routes.js`
**Responsibility:** Express router for exercise endpoints
- Placeholder stub routes (no implementation yet)
- Will handle: GET /exercises, POST /exercises, PUT /exercises/:id, DELETE /exercises/:id
- Will require JWT authentication middleware (TASK-024)

**Dependencies:**
- `express` — Express framework (Router)
- [Controllers - to be implemented in TASK-024]

**Exports:**
- `module.exports = router` — Express Router instance

**Testing:** To be implemented in TASK-024

#### `src/routes/plan.routes.js`
**Responsibility:** Express router for workout plan endpoints
- Placeholder stub routes (no implementation yet)
- Will handle: GET /plans, POST /plans/generate, GET /plans/my/week/:weekNumber, GET /plans/today
- Will require JWT authentication middleware (TASK-025)

**Dependencies:**
- `express` — Express framework (Router)
- [Controllers - to be implemented in TASK-025]

**Exports:**
- `module.exports = router` — Express Router instance

**Testing:** To be implemented in TASK-025

#### `src/services/planGenerator.js` (TASK-023 ✅)

**Responsibility:** Personalized workout plan generation logic

**Exports:**
- `generatePlan(userProfile, exercises)` → Plan object with nested week/day/exercise structure
  - Input validation: exercises must have sufficient exercises per muscle group (enforced at API layer)
  - Progressive overload: 4 weeks with scaling sets/reps based on user BMI severity
  - PPL split: Push (chest/shoulders/arms), Pull (back/arms), Legs (legs/core)
  - Equipment selection: Gender-aware (males prefer barbells, females prefer bodyweight/dumbbells)
  - Rest schedule: 3 training days + 4 rest days per week

**Key Functions:**
- `selectExercises(exercises, muscleGroups, count, gender)` — Filters and sorts exercises by muscle group and equipment priority
- `buildDaysForWeek(weekNumber, exercises, startDate, gender, isSevereBMI)` — Generates 7-day structure with exercise assignments
- `getEquipmentPriority(gender)` — Returns equipment priority list (gender-specific)

**Progressive Overload Levels:**
- Standard BMI (≥16): Week 1-4 with increasing volume (3→4 sets, 10→8-12 reps)
- Severe BMI (<16): Conservative progression (2→3 sets, fixed 10-15 reps)

**Usage:**
```javascript
const { generatePlan } = require('./services/planGenerator');
const plan = generatePlan(userProfile, exercises);
// Result: {
//   userId, name, startDate, endDate, durationWeeks, daysPerWeek, status,
//   weeks: [{ weekNumber, days: [{ dayNumber, dayLabel, scheduledDate, isRestDay, exercises }] }],
//   generatedFrom: { weight, height, bmi, gender }
// }
```

**Testing:** Integration tests in workoutplan.model.test.js (47 tests, 100% coverage)

#### `src/models/Exercise.js` (TASK-022 ✅)
**Responsibility:** Mongoose schema for exercise library
- Field definitions:
  - `name` (String): Required, unique, trimmed, 2-100 chars
  - `muscleGroup` (String): Required, enum ['chest', 'back', 'shoulders', 'arms', 'legs', 'core']
  - `secondaryMuscles` ([String]): Array of secondary muscle groups, default []
  - `equipment` (String): Required, enum ['barbell', 'dumbbell', 'bodyweight', 'cable', 'machine']
  - `difficulty` (String): Required, enum ['beginner', 'intermediate', 'advanced']
  - `instructions` (String): Required, 10-2000 chars
  - `tips` ([String]): Array of tips, each ≤200 chars, default []
  - `imageUrl` (String): Optional image URL, default null
  - `isActive` (Boolean): Soft delete flag, required, default true
- Timestamps: `createdAt`, `updatedAt` (auto-generated)
- Indexes:
  - name (unique)
  - muscleGroup (for filtering by muscle group)
  - equipment (for filtering by equipment type)
  - difficulty (for filtering by difficulty level)

**Validation:**
- Name: Enforces uniqueness at database level
- Difficulty: Restricts to predefined difficulty levels (beginner/intermediate/advanced)
- Instructions: Enforces minimum length (10 chars) for meaningful descriptions
- Tips: Each tip limited to 200 characters via custom validator

**Dependencies:**
- `mongoose` — ODM

**Exports:**
- `module.exports = mongoose.model('Exercise', exerciseSchema)`

**Usage:**
```javascript
const Exercise = require('../models/Exercise');

// Create an exercise
const exercise = new Exercise({
  name: 'Bench Press',
  muscleGroup: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  equipment: 'barbell',
  difficulty: 'beginner',
  instructions: 'Lie flat on a bench, grip the barbell slightly wider than shoulder-width...'
});
await exercise.save();

// Find exercises by muscle group
const chestExercises = await Exercise.find({ muscleGroup: 'chest', isActive: true });

// Find by difficulty
const beginnerExercises = await Exercise.find({ difficulty: 'beginner' });
```

**Testing:** Integration tests in exercise.model.test.js (42 tests, 100% coverage)

---

### Seed Data (TASK-022 ✅)

**Location:** `src/scripts/seedExercises.js`

**Features:**
- Idempotent seeding via `findOneAndUpdate()` with upsert
- 36 exercises across 6 muscle groups
- Mix of difficulty levels: beginner/intermediate/advanced
- Categorized by muscle group:
  - Chest: 5 exercises (Bench Press, Dumbbell Flyes, Push-Up, Incline Dumbbell Press, Cable Crossover)
  - Back: 6 exercises (Deadlift, Pull-Up, Barbell Row, Lat Pulldown, T-Bar Row, Seal Rows)
  - Shoulders: 6 exercises (Military Press, Lateral Raises, Shrugs, Dumbbell Press, Machine Shoulder Press, Cable Lateral Raise)
  - Arms: 5 exercises (Barbell Curls, Skull Crushers, Dumbbell Curls, Tricep Dips, Preacher Curls)
  - Legs: 4 exercises (Squats, Leg Press, Lunges, Leg Curls)
  - Core: 4 exercises (Planks, Ab Wheel Rollouts, Hanging Leg Raises, Russian Twists)

**Usage:**
```bash
# Run seed script
node src/scripts/seedExercises.js

# Output: "✓ Seeded 36 exercises successfully"
```

**Key Design:**
- Upsert by name ensures re-running script doesn't create duplicates
- Each exercise has instructions, tips, and muscle group classification
- Beginner exercises focus on form and basic technique
- Intermediate exercises introduce isolation and compound variations
- Advanced exercises include complex movements and tempo variations

---

## 📊 Data Flow (Current - TASK-021 ✅)

```
User Request (Frontend/Client)
    ↓
Express Middleware (CORS, bodyParser, logging) [TASK-021]
    ↓
Health Check Endpoint (GET /health) [TASK-021]
    ↓
Route matching (Exercise or Plan routes) [Stub routes, TASK-024/025]
    ↓
[Future] Authenticate Middleware (JWT verification) [TASK-024/025]
    ↓
[Future] Route Handler (ExerciseController or PlanController) [TASK-024/025]
    ↓
[Future] Service Layer (ExerciseService or PlanService) [TASK-024/025]
    ↓
[Future] Mongoose Model (Exercise or WorkoutPlan schema) [TASK-022/023]
    ↓
[Future] User Service Integration (Axios client) [TASK-024/025]
    ↓
MongoDB Database (fitgainer-workout collection)
    ↓
Response (200/201/404/400 with data or error)
```

---

## 🔒 Authentication & Authorization (TASK-024 ✅)

**Implemented:**

All protected routes require authentication via `authenticate` middleware:

**File:** `src/middleware/authenticate.js` (TASK-024) ✅
- Extracts `Authorization: Bearer <token>` header
- Verifies JWT signature with `JWT_SECRET` (HS256 algorithm only)
- Attaches `req.user = { userId, email, role }` to request
- Returns 401 for missing/invalid tokens

**File:** `src/middleware/authorize.js` (to be imported from auth-service)
- Enforces role-based access control via `requireRole(allowedRoles)` middleware
- Checks `req.user.role` against allowed roles
- Returns 403 for insufficient permissions

**Usage in Routes (TASK-024 ✅):**

```javascript
// routes/exercise.routes.js
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

// User can read
router.get('/', authenticate, controller.getExercises);
router.get('/:exerciseId', authenticate, controller.getExerciseById);

// Admin can write
router.post('/', authenticate, requireRole(['Admin']), controller.createExercise);
router.put('/:exerciseId', authenticate, requireRole(['Admin']), controller.updateExercise);
router.delete('/:exerciseId', authenticate, requireRole(['Admin']), controller.deleteExercise);
```

---

## 📡 Exercise Library API (TASK-024 ✅)

**File:** `src/controllers/exercise.controller.js` (TASK-024) ✅

**5 Endpoints implemented:**

### GET /exercises (User + Admin can read)
- Query parameters: `muscleGroup`, `equipment`, `difficulty` (all optional)
- Filters by `isActive: true` only (soft-delete support)
- Response: `{ exercises: [...], total: N }`
- Status: 200 on success

### GET /exercises/:exerciseId (User + Admin can read)
- Retrieves single exercise with full details (including tips)
- Filters by `isActive: true`
- Response: Exercise object with all fields
- Status: 200 on success, 404 if not found

### POST /exercises (Admin only)
- Creates new exercise
- Validation via `validateCreateExercise` middleware:
  - `name` (required, 2-100 chars, unique)
  - `muscleGroup` (required, enum validation)
  - `equipment` (required, enum validation)
  - `difficulty` (required, enum validation)
  - `instructions` (required, 10-2000 chars)
  - `tips` (optional, array, each ≤200 chars)
  - `secondaryMuscles` (optional, array)
  - `imageUrl` (optional)
- Response: 201 with created exercise
- Error: 400 (validation), 409 (duplicate name via E11000 index)

### PUT /exercises/:exerciseId (Admin only)
- Partial update of exercise
- Validation via `validateUpdateExercise` middleware (all fields optional if present)
- Only `isActive: true` exercises can be updated
- Response: 200 with updated exercise
- Error: 404 (not found), 400 (validation)

### DELETE /exercises/:exerciseId (Admin only) — Soft Delete with BR-08
- Implements Business Rule BR-08: Cannot delete exercise if used in active plan
- Checks `WorkoutPlan` collection for active plans using this exercise
- If in use: Returns 409 "Exercise is being used in an active workout plan"
- If not in use: Sets `isActive: false` (soft delete, no DB removal)
- Response: 200 `{ success: true, message: "Exercise deleted" }`
- Error: 404 (not found), 409 (in-use constraint violation)

**File:** `src/validators/exercise.validator.js` (TASK-024) ✅
- `validateCreateExercise` — Validates required fields + constraints for POST
- `validateUpdateExercise` — Validates optional fields + constraints for PUT
- Both return 400 with errors array on validation failure

**File:** `src/routes/exercise.routes.js` (TASK-024) ✅
- Routes all 5 endpoints with proper middleware chain
- Middleware order: authenticate → [requireRole] → [validate] → controller

**Test Coverage (TASK-024):** 51 integration tests
- GET endpoints: list with/without filters, detail, not-found cases
- POST: admin create, user denied, validation errors, duplicate name
- PUT: partial update, not-found, validation errors
- DELETE: soft-delete, BR-08 constraint, in-use detection, not-found
- Auth: 401 (missing token), 403 (insufficient role)

---

## 🗄️ Database Schema

### Exercise Collection (TASK-022 ✅)

**Fields:**
- `_id` — MongoDB ObjectId
- `name` — String | Required, unique, trimmed, 2-100 chars
- `muscleGroup` — String | Required, enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core']
- `secondaryMuscles` — [String] | Array of secondary muscle groups, default []
- `equipment` — String | Required, enum: ['barbell', 'dumbbell', 'bodyweight', 'cable', 'machine']
- `difficulty` — String | Required, enum: ['beginner', 'intermediate', 'advanced']
- `instructions` — String | Required, 10-2000 chars
- `tips` — [String] | Tips array, each ≤200 chars, default []
- `imageUrl` — String | Optional, default null
- `isActive` — Boolean | Soft delete flag, required, default true
- `createdAt`, `updatedAt` — Timestamps

**Indexes (TASK-022 ✅):**
- name (unique)
- muscleGroup (for filtering)
- equipment (for filtering)
- difficulty (for filtering)

### WorkoutPlan Collection (TASK-023 ✅ Complete)

**Fields (implemented):**
- `_id` — MongoDB ObjectId
- `userId` — String | Required
- `name` — String | Required (e.g., "Beginner Weight Gain Plan")
- `startDate` — Date | Required | Start of training plan
- `endDate` — Date | Required | End of training plan
- `durationWeeks` — Number | Required, default 4 | Total weeks of plan
- `daysPerWeek` — Number | Required, default 3 | Training days per week
- `status` — String | Required, enum: ['active', 'completed', 'cancelled'], default 'active'
- `weeks` — [Object] | Required | Array of week objects (minimum 1)
  - `weekNumber` — Number | Required, min 1
  - `days` — [Object] | Required | Array of 7-day schedule
    - `dayNumber` — Number | Required, 1-7
    - `dayLabel` — String | Required (e.g., "Ngày A — Push")
    - `scheduledDate` — Date | Required
    - `isRestDay` — Boolean | Required, default false
    - `exercises` — [Object] | Array of exercises for the day
      - `exerciseId` — ObjectId | Required | Reference to Exercise model
      - `name` — String | Required | Exercise name (denormalized)
      - `muscleGroup` — String | Required | Primary muscle group
      - `sets` — Number | Required, 1-10
      - `reps` — String | Required (e.g., "10" or "8-12")
      - `restSeconds` — Number | Required, 30-300
      - `order` — Number | Required, min 1 | Exercise order in day
- `generatedFrom` — Object | Metadata about plan generation
  - `weight` — Number | User weight at generation
  - `height` — Number | User height at generation
  - `bmi` — Number | User BMI at generation
  - `gender` — String | User gender at generation
- `createdAt`, `updatedAt` — Timestamps (auto)

**Indexes (implemented):**
1. `{ userId: 1 }` — Find user's plans
2. `{ userId: 1, status: 1 }` — Find user's active plans

---

## 🔄 Module Dependencies Graph

### Current (TASK-021 ✅)

```
server.js
├→ app.js (middleware, routes)
│  ├→ cors, express
│  ├→ utils/logger.js (request logging)
│  ├→ routes/exercise.routes.js [stub]
│  └→ routes/plan.routes.js [stub]
├→ config/database.js (MongoDB connection)
│  ├→ mongoose (ODM)
│  └→ utils/logger.js (connection logging)
└→ utils/logger.js (startup/shutdown logging)

config/userServiceClient.js
├→ axios (HTTP client)
├→ utils/logger.js (error logging)
└→ [Will be used in TASK-024/025 for user profile integration]

utils/logger.js
├→ winston (logging framework)
└→ fs (file system for log directory)

routes/exercise.routes.js [Stub]
└→ express.Router()

routes/plan.routes.js [Stub]
└→ express.Router()
```

### Future Dependencies (TASK-022+ Pending)

```
server.js
├→ app.js
│  ├→ routes/exercise.routes.js ✅
│  │  ├→ middleware/authenticate.js [JWT verification]
│  │  ├→ middleware/authorize.js [RBAC]
│  │  └→ controllers/exercise.controller.js
│  │     └→ services/exercise.service.js
│  │        └→ models/Exercise.js [Mongoose schema]
│  └→ routes/plan.routes.js ✅
│     ├→ middleware/authenticate.js
│     ├→ controllers/plan.controller.js
│     │  ├→ services/plan.service.js
│     │  ├→ models/WorkoutPlan.js [Mongoose schema]
│     │  └→ services/planGenerator.service.js
│     │     ├→ config/userServiceClient.js [Get user profile]
│     │     └→ models/Exercise.js [For exercise selection]
│     └→ [Future: RabbitMQ event publishing]
└→ [Rest of TASK-021 stack]
```

---

## 📝 API Routes (Planned - TASK-024+)

### Exercise Endpoints (TASK-024 Pending)

**All endpoints will be mounted at `/exercises` in `routes/exercise.routes.js`**
**Full path via Nginx gateway: `/api/exercises`**

```
GET /exercises
  Description: List all exercises with optional filters
  Auth: Optional (User role)
  Query Params: muscleGroup, difficulty
  Response: 200 [{ id, name, muscleGroup, difficulty, equipment }]

POST /exercises
  Description: Create new exercise (Admin only)
  Auth: Bearer <JWT token> (Admin role required)
  Body: { name, description, muscleGroup, difficulty, instructions, equipment }
  Response: 201 { id, name, muscleGroup, ... }
  Errors: 400 (validation), 401 (unauthorized), 403 (forbidden)

GET /exercises/:id
  Description: Get single exercise details
  Response: 200 { id, name, description, muscleGroup, difficulty, instructions, equipment }
  Errors: 404 (not found), 401 (unauthorized)

PUT /exercises/:id
  Description: Update exercise (Admin only)
  Auth: Bearer <JWT token> (Admin role required)
  Body: Partial fields
  Response: 200 { updated exercise }
  Errors: 400 (validation), 401, 403, 404

DELETE /exercises/:id
  Description: Delete exercise (Admin only)
  Auth: Bearer <JWT token> (Admin role required)
  Response: 200 { message: "Exercise deleted" }
  Errors: 401, 403, 404
```

### Workout Plan Endpoints (TASK-025 Pending)

**All endpoints will be mounted at `/plans` in `routes/plan.routes.js`**
**Full path via Nginx gateway: `/api/plans`**

```
POST /plans/generate
  Description: Generate personalized workout plan
  Auth: Bearer <JWT token> (User role)
  Body: { templateId? } (optional template reference)
  Response: 201 { id, userId, name, goal, weeks: [...] }
  Errors: 400 (invalid user profile), 401, 404 (user profile not found)

GET /plans/my
  Description: Get user's current workout plan
  Auth: Bearer <JWT token> (User role)
  Response: 200 { id, userId, name, goal, weeks: [...], createdAt }
  Errors: 401, 404 (plan not found)

GET /plans/my/week/:weekNumber
  Description: Get specific week of plan with daily breakdown
  Response: 200 { weekNumber, days: [{ dayNumber, exercises: [...] }] }
  Errors: 400 (invalid week number), 401, 404

GET /plans/today
  Description: Get today's workout exercises
  Response: 200 { dayNumber, exercises: [{ exerciseId, name, sets, reps, weight, restSeconds }] }
  Errors: 401, 404 (plan not found or today not in schedule)
```

---

## 🧪 Testing Strategy (TASK-021 ✅)

### Test Structure

```
tests/
├── unit/
│   ├── logger.test.js                 # Logger tests (TASK-021) ✅ 16 tests
│   ├── database.test.js               # Database connection tests (TASK-021) ✅ 13 tests
│   └── userServiceClient.test.js      # User service client tests (TASK-021) ✅ 12 tests
└── integration/
    ├── app.test.js                    # Express app integration tests (TASK-021) ✅ 14 tests
    └── exercise.model.test.js         # Exercise model tests (TASK-022) ✅ 42 tests
```

### Test Coverage (146 tests passing ✅)

**TASK-023 (WorkoutPlan Model & Generator) — 47 tests:**

**Unit Tests:**
- PlanGenerator (47 tests):
  - generatePlan function (main entry point)
  - selectExercises function (filtering and sorting logic)
  - buildDaysForWeek function (day/exercise assembly)
  - Progressive overload logic (standard vs severe BMI)
  - Equipment priority selection (gender-aware)
  - PPL split validation (muscle group assignment)
  - Date calculation (scheduled dates for each day)
  - Output structure validation (plan schema compliance)
  - 100% coverage of plan generation logic

**TASK-021 (Scaffold) — 57 tests:**

**Unit Tests:**
- Logger (16 tests):
  - Log level configuration (debug, info, warn, error)
  - File writing (app.log, error.log)
  - JSON formatting in production
  - Colorized output in development
  - Service metadata inclusion
  - 100% coverage

- Database (13 tests):
  - Connection success with pool config
  - Fallback URI handling
  - Connection pool settings (min/max, timeouts)
  - Disconnection cleanup
  - Error handling (connection failures)
  - 100% coverage

- UserServiceClient (12 tests):
  - Successful profile retrieval
  - 404 error mapping to user-friendly message
  - Timeout handling (5000ms)
  - Authorization header passing
  - Response data transformation
  - Error logging before throwing
  - 100% coverage

**Integration Tests:**
- App (14 tests):
  - Express app initialization
  - Health check endpoint response
  - CORS middleware configuration
  - Body parser middleware
  - 404 handler for unknown routes
  - JSON parse error handler
  - Global error handler
  - Middleware ordering
  - 100% coverage

**TASK-022 (Exercise Model) — 42 integration tests:**
- Schema creation (9 tests): required fields, defaults, optional fields, arrays, validation
- Timestamps (2 tests): auto-generated createdAt/updatedAt
- Field validation (8 tests): name uniqueness, muscle group enum, equipment enum, difficulty enum
- Index verification (4 tests): name unique index, muscleGroup index, equipment index, difficulty index
- Soft delete (3 tests): isActive flag, soft delete behavior, active query filtering
- Constraints (8 tests): minlength/maxlength validation, enum enforcement, custom validators
- 100% coverage of model validation logic

**Overall:** 227 total tests (57 TASK-021 + 42 TASK-022 + 47 TASK-023 + 51 TASK-024 + 30 TASK-025), comprehensive coverage of all exercise and workout plan operations

### Example Tests (TASK-021 + TASK-022) ✅

```javascript
describe('Logger', () => {
  test('should write logs to files', () => {
    logger.info('test message', { userId: '123' });
    // Verify logs/app.log contains message
    expect(fs.existsSync('logs/app.log')).toBe(true);
  });
});

describe('Database', () => {
  test('should connect with pool config', async () => {
    await connectDatabase();
    // Verify connection pool settings
    expect(mongoose.connection.getClient()._poolOptions.minPoolSize).toBe(5);
    await disconnectDatabase();
  });
});

describe('UserServiceClient', () => {
  test('should map 404 to user-friendly error', async () => {
    // Mock axios to return 404
    await expect(getUserProfile(token))
      .rejects.toThrow('User profile not found');
  });
});

describe('Express App', () => {
  test('GET /health should return status ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('workout-service');
  });
});

describe('Exercise Model (TASK-022)', () => {
  test('should save exercise with all required fields', async () => {
    const exercise = new Exercise({
      name: 'Bench Press',
      muscleGroup: 'chest',
      equipment: 'barbell',
      difficulty: 'beginner',
      instructions: 'Lie on a flat bench and press the barbell upward until arms are fully extended.'
    });
    const doc = await exercise.save();
    expect(doc._id).toBeDefined();
    expect(doc.isActive).toBe(true);
  });

  test('should enforce unique constraint on name', async () => {
    await Exercise.create({
      name: 'Bench Press',
      muscleGroup: 'chest',
      equipment: 'barbell',
      difficulty: 'beginner',
      instructions: 'Test instructions.'
    });
    
    await expect(
      Exercise.create({
        name: 'Bench Press',
        muscleGroup: 'back',
        equipment: 'dumbbell',
        difficulty: 'intermediate',
        instructions: 'Different exercise.'
      })
    ).rejects.toThrow();
  });

  test('should validate difficulty enum', async () => {
    await expect(
      Exercise.create({
        name: 'Invalid Difficulty Exercise',
        muscleGroup: 'chest',
        equipment: 'barbell',
        difficulty: 'impossible', // Invalid
        instructions: 'Test instructions.'
      })
    ).rejects.toThrow();
  });

  test('should validate tips length constraint', async () => {
    const longTip = 'a'.repeat(201); // Exceeds 200 char limit
    await expect(
      Exercise.create({
        name: 'Exercise with Long Tip',
        muscleGroup: 'chest',
        equipment: 'barbell',
        difficulty: 'beginner',
        instructions: 'Test instructions.',
        tips: [longTip]
      })
    ).rejects.toThrow();
  });
});
```

---

## 🐳 Docker & Deployment

### Dockerfile (TASK-021 Complete)

Multi-stage build optimized for production:

```dockerfile
# Build stage: Node.js development environment
FROM node:18-alpine AS builder

# Runtime stage: Minimal production image
FROM node:18-alpine
RUN addgroup -g 1001 appgroup && adduser -D -u 1001 -G appgroup appuser
WORKDIR /app
COPY --chown=appuser:appgroup . .
RUN npm ci --omit=dev
USER appuser
EXPOSE 3003
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
CMD ["node", "src/server.js"]
```

### Environment Variables (TASK-021 Complete)

See `.env.example`:

```bash
NODE_ENV=development
PORT=3003
MONGO_URI=mongodb://localhost:27017/fitgainer-workout
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
LOG_LEVEL=debug
ALLOWED_ORIGINS=http://localhost:5173
```

---

## 📦 Dependencies (TASK-021 Complete)

### Production Dependencies

```json
{
  "axios": "^1.6.0",
  "cors": "^2.8.6",
  "dotenv": "^16.0.0",
  "express": "^4.18.0",
  "jsonwebtoken": "^9.0.0",
  "mongoose": "^7.0.0",
  "winston": "^3.8.0"
}
```

### Development Dependencies

```json
{
  "@types/jest": "^29.5.0",
  "eslint": "^8.0.0",
  "jest": "^29.5.0",
  "mongodb-memory-server": "^9.0.0",
  "supertest": "^6.3.0"
}
```

### Scripts (TASK-021 Complete)

```bash
npm start                 # Production mode
npm run dev              # Development with watch mode
npm test                 # Run tests with coverage
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:watch       # Watch mode
npm run lint             # ESLint validation
```

---

## 🎯 Implementation Phases

### TASK-021: Workout Service Scaffolding ✅ Complete (2026-05-18)

**Status:** Foundation infrastructure ready

**Deliverables:**
- `src/server.js` — Entry point with database connection
- `src/app.js` — Express app configuration
- `src/config/database.js` — MongoDB pool management with fallback URI
- `src/config/userServiceClient.js` — Axios HTTP client for user-service integration
- `src/routes/exercise.routes.js` — Stub routes (placeholder)
- `src/routes/plan.routes.js` — Stub routes (placeholder)
- `src/utils/logger.js` — Winston logging with service metadata
- `jest.config.js` — Test framework setup
- `Dockerfile` — Production containerization with healthcheck
- `.env.example` — Configuration template
- `README.md` — Service documentation
- 57 tests (16 logger + 13 database + 12 userServiceClient + 14 app integration)

**Key Features:**
- Graceful shutdown handlers (SIGTERM/SIGINT)
- Connection pooling (5-20 connections)
- Structured logging with service metadata
- Non-root Docker user for security
- Jest test configuration with 80% threshold
- Axios client with timeout and error handling
- User service integration ready for TASK-024+

**Test Results (TASK-021):**
- 57 tests passed
- Coverage: 98% statements, 88% branches, 100% functions, 98% lines

### TASK-022: Exercise Model & Seed Data ✅ Complete (2026-05-18)

**Status:** Exercise schema and seed data fully implemented with comprehensive tests

**Deliverables:**
- `src/models/Exercise.js` — Mongoose schema with 11 fields, 4 indexes, validation ✅
- `src/scripts/seedExercises.js` — Seed script with 36 exercises, idempotent upsert ✅
- Integration tests covering schema, validation, constraints, indexes
- 42 integration tests (100% model coverage)

**Test Results (TASK-022):**
- 42 tests passed
- Coverage: 100% of model validation and constraints

**Combined Results (TASK-021 + TASK-022):**
- 106 total tests passing
- Coverage: 98.3% statements, 88% branches, 100% functions, 98% lines

### TASK-023: WorkoutPlan Model & Generator ✅ Complete (2026-05-18)

**Status:** Models and generator service fully implemented with comprehensive tests

**Deliverables:** ✅
- `src/models/WorkoutPlan.js` — Mongoose schema with nested week/day/exercise structures ✅
- `src/services/planGenerator.js` — Plan generation logic with PPL split and progressive overload ✅
- `tests/unit/planGenerator.test.js` — Plan generator unit tests (47 tests) ✅
- `tests/integration/workoutplan.model.test.js` — WorkoutPlan model integration tests ✅

**Key Features:**
- **4-Week Plans:** Default 4-week duration with flexible configuration
- **PPL Split:** Push (chest/shoulders/arms), Pull (back/arms), Legs (legs/core) routine
- **3-Training Days/Week:** Monday/Wednesday/Friday format with 4 rest days
- **Progressive Overload:** Week-by-week scaling of sets/reps based on BMI severity
- **Gender-Aware Equipment:** Males prioritize barbells, females prefer bodyweight/dumbbells
- **Adaptive Logic:** Severe BMI (<16) gets conservative progression; standard BMI gets aggressive scaling
- **Denormalized Exercise Data:** Exercise names/muscle groups stored in plan for historical reference
- **Scheduled Dates:** Each day has explicit scheduled date for tracking purposes

**Progressive Overload Scaling:**

Standard BMI (≥16):
- Week 1: 3 sets × 10 reps
- Week 2: 3 sets × 10-12 reps  
- Week 3: 4 sets × 8-10 reps
- Week 4: 4 sets × 8-12 reps

Severe BMI (<16):
- Week 1-4: Conservative approach (2→3 sets, fixed 10-15 reps)

**Test Results (TASK-023):**
- 47 tests passed
- Coverage: 100% of plan generation logic
- Test categories: generatePlan, selectExercises, buildDaysForWeek, equipment priority, PPL split validation, date calculations, output structure

### TASK-024: Exercise Library API ✅ Complete (2026-05-18)

**Status:** All 5 REST endpoints implemented with full RBAC and BR-08 soft-delete enforcement

**Deliverables:** ✅
- `src/middleware/authenticate.js` — JWT verification (TASK-024) ✅
- `src/controllers/exercise.controller.js` — 5 handler functions (TASK-024) ✅
- `src/validators/exercise.validator.js` — Input validation middleware (TASK-024) ✅
- `src/routes/exercise.routes.js` — Route definitions with middleware chain (TASK-024) ✅
- 5 endpoints: GET /exercises (list+filter), GET /exercises/:id, POST /exercises (admin), PUT /exercises/:id (admin), DELETE /exercises/:id (admin with BR-08)
- Admin CRUD + User read-only
- 51 integration tests (100% controller coverage)

**Key Features:**
- **GET /exercises** — List all active exercises with optional filtering (muscleGroup, equipment, difficulty)
- **GET /exercises/:id** — Retrieve single exercise with full details
- **POST /exercises** — Admin-only creation with input validation
- **PUT /exercises/:id** — Admin-only partial update
- **DELETE /exercises/:id** — Admin-only soft delete (isActive=false) with BR-08: cannot delete if used in active plan
- **Soft Delete with Enforcement** — Checks WorkoutPlan collection for active plans before deletion
- **JWT Authentication** — All endpoints require Bearer token
- **RBAC** — GET endpoints require User or Admin role; POST/PUT/DELETE require Admin role only
- **Input Validation** — Required fields, enum values, length constraints, uniqueness checks
- **Error Handling** — Proper HTTP status codes (201, 400, 401, 403, 404, 409)

**Test Results (TASK-024):**
- 51 tests passing
- Coverage: 80%+ on exercise.controller.js
- Test categories: auth (401/403), GET list with filters, GET detail, POST validation/create/duplicate, PUT update, DELETE soft-delete/BR-08/in-use detection

### TASK-025: Workout Plan API ✅ Complete (2026-05-18)

**Status:** All 4 REST endpoints implemented with full service integration and comprehensive tests

**Deliverables:** ✅
- `src/controllers/plan.controller.js` — 4 handler functions (getMyPlan, generatePlan, getWeek, getTodayWorkout) ✅
- `src/services/planService.js` — Plan operations (getActivePlan, generateNewPlan, getWeekDetail, getTodayWorkout) ✅
- 4 endpoints: POST /plans/generate, GET /plans/my, GET /plans/my/week/:weekNumber, GET /plans/my/today ✅
- User service integration for profile validation ✅
- 30 integration tests (100% coverage of all endpoints) ✅

**Key Features:**
- **POST /plans/generate** — Generate personalized workout plan with user-service integration, BR-01 (one active plan), BR-02 (must have profile), returns 201 with plan summary
- **GET /plans/my** — Retrieve active plan with full nested weeks/days/exercises structure, returns 200 or 404
- **GET /plans/my/week/:weekNumber** — Get specific week detail with validation of week range, returns 200 with 7-day schedule or 400/404
- **GET /plans/my/today** — Get today's workout exercises using UTC date comparison, returns 200 with workout or rest day response (never 404)
- **User Service Integration** — Calls user-service to validate profile before plan generation, returns 400 if profile not found
- **Business Rule Enforcement** — BR-01: Only one active plan per user (409 conflict); BR-02: Profile required (400 validation)
- **Security** — userId always from JWT, never from request body; SR-01 + SR-03 compliance
- **UTC Date Comparison** — Timezone-aware comparison for today's workout identification

**Test Results (TASK-025):**
- 30 tests passing
- Coverage: 85%+ on plan service and controller
- Test categories: POST generate (success/conflict/no-profile), GET /my (found/not-found), GET /my/week (valid/invalid range), GET /my/today (workout day/rest day/out-of-plan)

---

## 🔗 Related Documentation

### Feature Specifications

- `spec/features/workout-plan/feature.spec.md` — Feature overview
- `spec/features/workout-plan/api.spec.md` — API endpoints
- `spec/features/workout-plan/schema.spec.md` — Data models
- `spec/features/workout-plan/rules.spec.md` — Business logic

### Architecture & Design

- `docs/architecture/workout-service.md` (Pending)
- `spec/mapping/story-to-spec.md` — User story mapping

### Service Documentation

- `BE/workout-service/README.md` — Getting started guide
- `BE/auth-service/README.md` — Auth integration reference
- `BE/user-service/README.md` — User service integration

### Guides

- `CLAUDE.md` — Project rules and constraints

---

## 📊 Workout Execution API (TASK-028 ✅)

**File:** `src/controllers/workoutSessionController.js` (TASK-028) ✅

### POST /api/workouts/sessions (Workout Execution Logging)

**Responsibility:** Accept and validate workout session data, store session in MongoDB

**Features:**
- JWT authentication (Bearer token required)
- Multi-level input validation:
  - Session-level: planId, weekNumber, dayNumber, sessionDate, exercises array
  - Exercise-level: exerciseId, name, muscleGroup, status (completed/skipped), plannedSets/Reps, sets array
  - Set-level: setNumber, actualReps (0-100), weight (0-500), rpe (1-10 optional), notes (max 200)
- Business rule enforcement:
  - BR-02: sessionDate cannot be in the future
  - BR-03: completed exercises must have >= 1 set
  - BR-04: actualReps and weight validation
- Denormalization: exercise name and muscleGroup stored in session for historical reference
- Security: userId extracted from JWT (not request body)
- Unique constraint: (userId, planId, weekNumber, dayNumber, sessionDate) prevents duplicate sessions
- Error handling with specific error types (ValidationError, DuplicateSessionError, DatabaseError)

### WorkoutSession Model (TASK-028) ✅

**File:** `src/models/WorkoutSession.js` (TASK-028) ✅

**Schema Structure:**

#### SetResultSchema (nested, no _id)
```javascript
{
  setNumber: Number,        // 1-based set counter
  actualReps: Number,       // 0-100, required
  weight: Number,           // 0-500 kg, required
  rpe: Number,             // 1-10 (optional, rate of perceived exertion)
  notes: String            // max 200 chars (optional)
}
```

#### ExerciseSessionSchema (nested, no _id)
```javascript
{
  exerciseId: String,       // ObjectId reference
  name: String,            // Exercise name snapshot
  muscleGroup: String,     // enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core']
  status: String,          // 'completed' | 'skipped'
  plannedSets: Number,     // Expected sets for this exercise
  plannedReps: String,     // Planned rep range (e.g., "8-12")
  sets: [SetResultSchema], // Only for completed exercises
  notes: String            // max 300 chars (optional)
}
```

#### WorkoutSession Root Schema
```javascript
{
  userId: String,                   // User ID from JWT
  planId: String,                   // Workout plan reference
  weekNumber: Number,               // 1-based week number
  dayNumber: Number,                // 1-7 day of week
  sessionDate: Date,                // ISO format (YYYY-MM-DD)
  exercises: [ExerciseSessionSchema], // Array of exercises in session
  totalDuration: Number,            // Minutes (0-300, optional)
  mood: String,                     // 'great'|'good'|'ok'|'tired' (optional)
  notes: String,                    // max 500 chars (optional)
  completedAt: Date,               // Auto-set by pre-save hook
  timestamps                        // createdAt, updatedAt
}
```

**Indexes:**
- Unique compound: `{ userId: 1, planId: 1, weekNumber: 1, dayNumber: 1, sessionDate: 1 }`
- Query optimization: `{ userId: 1 }`, `{ sessionDate: 1 }`

**Pre-save Hooks:**
1. Date validation: Ensure sessionDate is not in the future (BR-02)
2. Completed exercise validation: All exercises marked 'completed' must have >= 1 set (BR-03)
3. Timestamp: Auto-set completedAt to current time

### WorkoutSessionService (TASK-028) ✅

**File:** `src/services/workoutSessionService.js` (TASK-028) ✅

**Main Function:** `createSession(userId, sessionData)`

**Validation Chain:**
1. Input validation: `validateSessionInput()` — check all required fields, formats, ranges
2. Exercise validation: `validateExercise()` — check each exercise in array
3. Set validation: `validateSet()` — check set-level constraints
4. Duplicate check: Query for existing session with same (userId, planId, weekNumber, dayNumber, sessionDate)
5. Database insert: Save to MongoDB if all validations pass

**Error Handling:**
- `ValidationError` (400): Input validation failures
- `DuplicateSessionError` (409): Session already exists for this date/plan/week/day
- `DatabaseError` (500): MongoDB operation failures

### Test Coverage (TASK-028) ✅

**Tests:** 159 comprehensive integration tests

**Test Categories:**
- Model validation: Schema field validation, enum constraints, range checks
- Service validation: Input parsing, multi-level validation, error scenarios
- Duplicate session detection: Unique compound index enforcement
- API endpoint: 201 success, 400 validation errors, 401 unauthorized, 409 duplicate, 500 server error
- Denormalization: Exercise name/muscleGroup snapshots stored correctly
- Boundary conditions: Min/max values, optional fields, empty arrays
- Business rules: Future date rejection, completed exercise set check

**Coverage:** 97%+ of business logic

---

## ⚙️ Configuration & Fixes (Post-TASK-027)

### USER_SERVICE_URL Configuration Fix ✅

**Issue Resolved:** userServiceClient was unable to reach user-service due to incorrect URL configuration.

**Root Cause:**
- Original `.env`: `USER_SERVICE_URL=http://localhost:3002/api/users`
- userServiceClient appended `/profile`
- Result: `http://localhost:3002/api/users/profile` ❌
- But user-service only mounts routes at `/profile` (not `/api/users/profile`)

**Solution Applied:**
- ✅ Updated `.env`: `USER_SERVICE_URL=http://localhost:3002`
- ✅ Updated `.env.example`: `USER_SERVICE_URL=http://localhost:3002`
- ✅ Now: `http://localhost:3002/profile` (direct connection) ✅

**Files Modified:**
- `BE/workout-service/.env`
- `BE/workout-service/.env.example`

**Verification:**
- Workout-service can now successfully call user-service to fetch user profiles
- Plan generation with user profile integration working correctly
- All 30 plan API integration tests passing

### Vietnamese Error Message Localization ✅

**Issue:** Backend was returning error messages in Vietnamese instead of English.

**Vietnamese Messages Replaced:**
- "Vui lòng tạo hồ sơ cơ thể trước" → "Please create your body profile before generating a plan"
- "Đã có lộ trình đang active" → "You already have an active workout plan"
- "Chưa có lộ trình" → "No active workout plan found"
- "Ngoài chu kỳ lộ trình" → "Rest Day"
- "Ngày A — Push" → "Day A — Push"
- "Ngày B — Pull" → "Day B — Pull"
- "Ngày C — Legs" → "Day C — Legs"
- "Nghỉ ngơi" → "Rest Day"

**Files Modified:**
- `BE/workout-service/src/services/planService.js`
- `BE/workout-service/src/services/planGenerator.js`
- `BE/workout-service/src/controllers/plan.controller.js`

**Test Updates:**
- `tests/integration/plan.api.test.js` — Updated seed data and error message expectations

**Result:** 100% English error messages throughout backend and frontend ✅

---

## 📊 Document Metadata

- **Version:** 1.5
- **Created:** 2026-05-18
- **Last Updated:** 2026-05-18
- **Status:** Phase 3a-3g ✅ Complete (Backend TASK-021 to TASK-025 + Frontend TASK-026 Data Layer + TASK-027 UI Pages & Components)
- **Owner:** Engineering Team
- **Dependencies:** Phase 2 (User Service) ✅, Phase 1 (Auth Service) ✅
- **Review Cycle:** Update after each phase
- **Test Results:** 379 total tests passing (BE: 227 = 57+42+47+51+30; FE: 152 = 72+80), 96%+ coverage on BE service layer, 100% FE code path coverage
- **Latest Fix:** USER_SERVICE_URL configuration corrected (http://localhost:3002), Vietnamese error messages replaced with English ✅

---

## 💡 Quick Navigation

### For Getting Started
→ `BE/workout-service/README.md`

### For API Specification
→ `spec/features/workout-plan/api.spec.md`

### For Data Model Design
→ `spec/features/workout-plan/schema.spec.md`

### For Business Rules
→ `spec/features/workout-plan/rules.spec.md`

### For Implementation Task
→ `tasks/workout-plan/TASK-021-be-workout-service-scaffold.md`

### For Development Setup
→ `docs/SETUP.md`

### For Architecture Decisions
→ `CLAUDE.md`

### For Frontend Execution Form (TASK-029)
→ `docs/CODEMAPS/FE-workout-execution.md`

---

## 📝 TASK-029 Frontend Execution Summary

**Component Location:** `FE/src/pages/workout/WorkoutExecutionForm.jsx`

**Key Additions:**
- WorkoutExecutionForm component with form state management (useState)
- ExerciseCard dual-mode support (display + execution)
- workoutSession.service for FE API calls
- Real-time validation (reps 0-100, weight 0-500, RPE 1-10)
- Status toggle per exercise (completed/skipped)
- Session summary fields: duration, mood, notes
- Auto-dismiss success toast (3s)
- Fetch & display saved sessions read-only
- Date guard for today-only logging (UTC comparison)
- MSW mock handlers for testing
- TailwindCSS-only styling (dark mode, emerald/amber colors)

**Backend GET Endpoint Integration:**
- GET /api/workouts/sessions — Fetch user's saved sessions
- Used to display read-only sessions below execution form
- Filtered by userId (from JWT), optional filters for date range

**Full Workout Execution Feature Flow:**
1. User navigates to WorkoutDayPage for today
2. User clicks "Log This Workout" button
3. WorkoutExecutionForm opens with today's exercises
4. User fills form (reps, weight, mood, duration, notes)
5. Form submits via workoutSession.service.createSession()
6. Backend validates and stores session
7. Success toast shown (3s auto-dismiss)
8. Saved sessions list refreshed via GET /api/workouts/sessions
9. Previously logged sessions displayed in read-only format
10. Form can be reset and used again for re-logging same day (if allowed by backend)

---

## TASK-031-BE-Workout-Admin: Admin Exercise Management (✅ Complete, 2026-05-19)

### Overview

Admin exercise management provides comprehensive CRUD operations for exercise library maintenance. Admins can list, search, filter, create, update, and soft-delete exercises with full validation and authorization protection.

### Admin Exercise API Endpoints

**Base Path:** `/api/admin/exercises` (requires Admin role + JWT authentication)

#### GET /api/admin/exercises — List exercises with pagination, search, and filtering

**Authentication:** Admin role required

**Query Parameters:**
- `page` (integer, default 1) — 1-indexed page number
- `search` (string, optional) — Search exercises by name or description (case-insensitive)
- `muscleGroup` (string, optional) — Filter by muscle group (chest, back, shoulders, arms, legs, core)

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "ObjectId",
      "name": "Bench Press",
      "muscleGroup": "chest",
      "sets": 3,
      "reps": "8-12",
      "restTime": 90,
      "description": "Classic compound chest exercise",
      "difficulty": "intermediate",
      "equipment": "barbell",
      "instructions": "...",
      "isDeleted": false,
      "createdAt": "2026-05-19T...",
      "updatedAt": "2026-05-19T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  }
}
```

**Implementation Details:**
- Returns only non-deleted exercises (`isDeleted: false`)
- Regex search on name + description fields with ReDoS prevention
- Pagination: fixed limit of 10 per page
- Sorted by exercise name (ascending)
- `.lean()` optimization for read-only queries

#### POST /api/admin/exercises — Create new exercise

**Authentication:** Admin role required

**Request Body:**
```json
{
  "name": "Barbell Squat",
  "muscleGroup": "legs",
  "sets": 4,
  "reps": "6-8",
  "restTime": 120,
  "description": "Heavy compound leg movement",
  "difficulty": "intermediate",
  "equipment": "barbell",
  "instructions": "Detailed form instructions..."
}
```

**Response (201 Created):** Full exercise object

**Validation (via adminValidation.js):**
- `name` — Required, string, 1-100 chars, unique (case-insensitive)
- `muscleGroup` — Required, enum: [chest, back, shoulders, arms, legs, core]
- `sets` — Required, integer, 1-10
- `reps` — Required, format "X-Y" (e.g., "8-12")
- `restTime` — Required, integer, 30-300 seconds
- All fields must pass before service layer processes

**Errors:**
- 400 — Validation failed (specific field message)
- 409 — Duplicate exercise name (case-insensitive check)
- 401 — No authentication token
- 403 — User role (not Admin)

#### PATCH /api/admin/exercises/:exerciseId — Update exercise

**Authentication:** Admin role required

**Request Body:** Partial update (all fields optional)
```json
{
  "name": "Barbell Back Squat",
  "sets": 5,
  "reps": "5-8"
}
```

**Response (200 OK):** Updated exercise object

**Validation:**
- Only updates non-deleted exercises (`isDeleted: false`)
- Validates each provided field (same rules as creation)
- Name uniqueness checked only if name is different from current
- Supports partial updates (any fields can be omitted)

**Errors:**
- 400 — Validation failed on any field
- 404 — Exercise not found or already deleted
- 409 — Name conflict (duplicate with another exercise)
- 401/403 — Auth/Authz

#### DELETE /api/admin/exercises/:exerciseId — Soft delete exercise

**Authentication:** Admin role required

**Response (200 OK):**
```json
{
  "message": "Exercise deleted",
  "exercise": {
    "_id": "ObjectId",
    "isDeleted": true
  }
}
```

**Implementation Details:**
- Soft delete: Sets `isDeleted = true` and `deletedAt = now()`
- Pre-save hook auto-manages deletedAt timestamp
- Idempotent: Calling on already-deleted exercise returns 200
- Doesn't check workout plan usage (different from TASK-024 Exercise API which has BR-08 constraint)

**Errors:**
- 404 — Exercise not found
- 401/403 — Auth/Authz

### Admin Service Layer (adminService.js)

**File:** `src/services/adminService.js` | **Class:** `AdminExerciseService`

**Methods:**

1. **getExerciseList(page, limit, searchFilter, muscleGroupFilter)**
   - Builds query with `isDeleted: false` base
   - Adds regex search on name + description if searchFilter provided
   - Adds muscleGroup filter if provided
   - Returns paginated results with metadata

2. **createExercise(data)**
   - Validates required fields via controller validation
   - Checks name uniqueness (case-insensitive regex)
   - Creates new Exercise document
   - Returns saved exercise

3. **updateExercise(exerciseId, data)**
   - Validates ObjectId format
   - Fetches existing exercise (`isDeleted: false`)
   - Applies partial updates
   - Checks name uniqueness if name changed
   - Saves and returns updated exercise

4. **deleteExercise(exerciseId)**
   - Validates ObjectId format
   - Sets `isDeleted = true` (soft delete)
   - Pre-save hook auto-sets `deletedAt`
   - Idempotent operation

### Validation Middleware (adminValidation.js)

**File:** `src/middleware/adminValidation.js`

**Validators:**

- **validateExerciseCreate(req, res, next)**
  - Validates all 5 required fields: name, muscleGroup, sets, reps, restTime
  - Type checks + enum validation + range validation
  - ReDoS-safe regex for reps format: `^\d+-\d+$`
  - Rejects if any field invalid with specific error message

- **validateExerciseUpdate(req, res, next)**
  - Same validation rules but all fields optional
  - Only validates fields that are present in request
  - Allows partial updates while maintaining constraints

### Admin Routes (admin.routes.js)

**File:** `src/routes/admin.routes.js` | **Prefix:** `/api/admin/exercises`

**Middleware Chain:**
1. `authenticate` — JWT verification
2. `authorize(['Admin'])` — Role-based access control
3. `validateExerciseCreate/validateExerciseUpdate` — Input validation
4. Controller handler

**Route Definitions:**
```javascript
GET    /exercises              → getExerciseList (authenticate + authorize)
POST   /exercises              → createExercise (authenticate + authorize + validate)
PATCH  /exercises/:exerciseId  → updateExercise (authenticate + authorize + validate)
DELETE /exercises/:exerciseId  → deleteExercise (authenticate + authorize)
```

### Admin Controller (adminController.js)

**File:** `src/controllers/adminController.js` | **Class:** `AdminController`

**Handlers:**

1. **getExerciseList(req, res, next)**
   - Extracts query parameters (page, search, muscleGroup)
   - Validates page as positive integer (default 1)
   - Calls service and returns paginated results
   - Passes errors to next() for global handler

2. **createExercise(req, res, next)**
   - Calls service.createExercise(req.body)
   - Returns 201 Created on success
   - Maps 400/409 errors to appropriate status codes
   - Passes other errors to next()

3. **updateExercise(req, res, next)**
   - Extracts exerciseId from path parameter
   - Calls service.updateExercise(exerciseId, req.body)
   - Returns 200 OK on success
   - Maps 400/404/409 errors to appropriate status codes

4. **deleteExercise(req, res, next)**
   - Extracts exerciseId from path parameter
   - Calls service.deleteExercise(exerciseId)
   - Returns 200 OK with soft-delete confirmation
   - Maps 404 error to 404 status code

### Exercise Model Enhancements (Exercise.js)

**New Fields (for admin functionality):**
- `description` (String, optional) — Admin-managed exercise description
- `sets` (Number, optional) — Default sets for this exercise
- `reps` (String, optional) — Default reps range (format: "X-Y")
- `restTime` (Number, optional) — Default rest time in seconds
- `isDeleted` (Boolean, default: false) — Soft delete flag
- `deletedAt` (Date, default: null) — Soft delete timestamp

**Pre-save Hook:**
```javascript
exerciseSchema.pre('save', function (next) {
  if (this.isDeleted && !this.deletedAt) {
    this.deletedAt = new Date();
  } else if (!this.isDeleted) {
    this.deletedAt = null;
  }
  next();
});
```

**Index on isDeleted:** Fast filtering for non-deleted exercises

### Test Coverage (63 tests, 100% coverage)

**File:** `tests/integration/admin-exercises.test.js` | **Status:** ✅ All Passing

**Test Categories:**

1. **Authentication & Authorization (12 tests)**
   - Missing token → 401
   - Invalid token → 401
   - Expired token → 401
   - Non-admin (User role) → 403
   - Admin token → 200

2. **GET /exercises List & Pagination (15 tests)**
   - Default pagination (page 1)
   - Invalid page numbers (0, -1) → default to 1
   - Search by name (partial match)
   - Search by description
   - Filter by muscleGroup
   - Multiple filters combined
   - Empty results
   - Total count and pages calculation

3. **POST /exercises Create (18 tests)**
   - Valid creation → 201
   - Missing required fields → 400
   - Invalid muscleGroup enum → 400
   - Invalid sets range → 400
   - Invalid reps format → 400
   - Invalid restTime range → 400
   - Duplicate name (case-insensitive) → 409
   - Name already exists variations
   - Long name/description handling

4. **PATCH /exercises/:id Update (12 tests)**
   - Valid partial update → 200
   - Update single field only
   - Update multiple fields
   - Invalid field value → 400
   - Non-existent exercise → 404
   - Deleted exercise → 404
   - Duplicate name on update → 409
   - Name uniqueness check (only if name changed)

5. **DELETE /exercises/:id Soft Delete (6 tests)**
   - Valid delete → 200 with isDeleted=true
   - Non-existent exercise → 404
   - Already deleted exercise → 200 (idempotent)
   - Deleted status verification

### Security & Best Practices

1. **Authorization Enforcement**
   - Admin role required on all endpoints
   - Middleware ordering: authenticate before authorize
   - No permission bypass possible

2. **Input Validation**
   - Comprehensive validation on create/update
   - ReDoS-safe regex patterns
   - Type checking for all inputs
   - Range validation for numeric fields
   - Enum validation for muscle groups

3. **Data Integrity**
   - Unique constraint on exercise names (case-insensitive)
   - Soft delete prevents data loss
   - Pre-save hooks maintain deletedAt consistency
   - Index on isDeleted for performance

4. **Error Handling**
   - Specific error messages guide API consumers
   - Duplicate constraint errors → 409 Conflict
   - Validation errors → 400 Bad Request
   - Not found errors → 404
   - Auth errors → 401/403

---

**Version:** 2.0  
**Last Updated:** 2026-05-19  
**Status:** Phase 3a-3h + 4b Backend ✅ (includes TASK-031-BE-Workout-Admin) | Phase 3f-3i Frontend ✅ (includes TASK-029)
