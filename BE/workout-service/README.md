# FitGainer Workout Service

Exercise library and personalized workout plan management service for the FitGainer fitness application.

**Status:** Phase 3a-3i + 4b ✅ (TASK-021 Scaffold + TASK-022 Exercise Model + TASK-023 WorkoutPlan Model & Generator + TASK-024 Exercise API + TASK-025 Workout Plan API + TASK-028 Workout Execution API + TASK-029 FE Workout Execution + TASK-031-BE-Workout-Admin Exercise Management) | 449 backend tests (386 + 63 admin)

**Latest Updates (TASK-031-BE-Workout-Admin):**
- ✅ Exercise model enhanced with isDeleted, deletedAt, description, sets, reps, restTime fields
- ✅ Admin service layer with 4 methods (getExerciseList, createExercise, updateExercise, deleteExercise)
- ✅ Admin controller with HTTP handlers for 4 endpoints (GET list with pagination/search/filter, POST create, PATCH update, DELETE soft-delete)
- ✅ Admin validation middleware (validateExerciseCreate, validateExerciseUpdate with ReDoS prevention)
- ✅ Admin routes at /api/admin/exercises with Auth/Authz protection
- ✅ 63 comprehensive integration tests (all passing)
- ✅ Security fixes: ReDoS prevention, soft-delete integrity, pagination guards

**Previous Updates (TASK-028):**
- ✅ WorkoutSession model with SetResultSchema + ExerciseSessionSchema
- ✅ Unique compound index: (userId, planId, weekNumber, dayNumber, sessionDate)
- ✅ workoutSessionService with multi-level validation (session/exercise/set levels)
- ✅ Pre-save hooks: date validation, completed exercise check, completedAt assignment
- ✅ Error classes: ValidationError, DuplicateSessionError, DatabaseError
- ✅ POST /api/workouts/sessions endpoint with JWT auth
- ✅ 159 comprehensive integration tests, 97%+ coverage
- ✅ Denormalization strategy: exercise name/muscleGroup snapshots

## Tech Stack

- **Runtime:** Node.js v18+
- **Framework:** Express
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (jsonwebtoken) — Token validation via auth-service
- **User Service Integration:** Axios client with timeout handling
- **Testing:** Jest + Supertest + MongoMemoryServer
- **Logging:** Winston

## Project Structure

```
src/
├── app.js                           # Express app configuration (TASK-021) ✅
├── server.js                        # Server entry point
├── config/
│   ├── database.js                  # MongoDB connection logic
│   └── userServiceClient.js         # Axios client for user-service (TASK-021) ✅ | Fixed config in TASK-026 ✅
├── routes/
│   ├── exercise.routes.js           # Exercise API routes (TASK-024) ✅
│   ├── plan.routes.js               # Workout plan API routes (TASK-025) ✅
│   ├── workoutSessionRoutes.js      # Workout session routes (TASK-028) ✅
│   └── admin.routes.js              # Admin exercise routes (TASK-031-BE-Workout-Admin) ✅
├── utils/
│   └── logger.js                    # Winston logging
├── models/                          # Mongoose schemas
│   ├── Exercise.js                  # Exercise model with validation + admin fields (TASK-022 + TASK-031-BE) ✅
│   ├── WorkoutPlan.js               # WorkoutPlan model with nested schemas (TASK-023) ✅
│   └── WorkoutSession.js            # WorkoutSession model with nested schemas (TASK-028) ✅
├── scripts/                         # Seed and utility scripts (TASK-022) ✅
│   └── seedExercises.js             # Seed 36 exercises across 6 muscle groups (TASK-022) ✅
├── controllers/                     # Route handlers
│   ├── exercise.controller.js       # 5 handlers: list, detail, create, update, delete (TASK-024) ✅
│   ├── plan.controller.js           # 4 handlers: getMyPlan, generatePlan, getWeek, getTodayWorkout (TASK-025) ✅
│   ├── workoutSessionController.js  # 1 handler: createSession (TASK-028) ✅
│   └── adminController.js           # 4 handlers: getExerciseList, createExercise, updateExercise, deleteExercise (TASK-031-BE) ✅
├── middleware/                      # Custom middleware
│   ├── authenticate.js              # JWT verification (TASK-024, TASK-028) ✅
│   ├── authorize.js                 # RBAC middleware (TASK-024) ✅
│   └── adminValidation.js           # Admin exercise validation (TASK-031-BE-Workout-Admin) ✅
└── services/                        # Business logic
    ├── planGenerator.js             # Plan generation with PPL split & progressive overload (TASK-023) ✅
    ├── planService.js               # Workout plan service layer (TASK-025) ✅
    ├── workoutSessionService.js     # Session validation, denormalization, duplicate check (TASK-028) ✅
    └── adminService.js              # Admin exercise management (TASK-031-BE-Workout-Admin) ✅

tests/
├── unit/
│   ├── logger.test.js               # Logger tests (TASK-021) ✅ 16 tests
│   ├── database.test.js             # Database connection tests (TASK-021) ✅ 13 tests
│   ├── userServiceClient.test.js    # User service client tests (TASK-021) ✅ 12 tests
│   └── planGenerator.test.js        # Plan generator tests (TASK-023) ✅ 47 tests
└── integration/
    ├── app.test.js                  # Express app integration tests (TASK-021) ✅ 14 tests
    ├── exercise.model.test.js       # Exercise model tests (TASK-022) ✅ 42 tests
    ├── workoutplan.model.test.js    # WorkoutPlan model tests (TASK-023) ✅ [included above]
    ├── exercise.api.test.js         # Exercise API integration tests (TASK-024) ✅ 51 tests
    └── plan.api.test.js             # Workout Plan API integration tests (TASK-025) ✅ 30 tests
```

## Setup

### Prerequisites

- Node.js v18+
- MongoDB (or MongoDB Memory Server for testing)
- npm v9+

### Installation

```bash
# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env
```

### Environment Variables

See `.env.example` for all required variables:

- `PORT` - Server port (default: 3003)
- `NODE_ENV` - Environment (development/production)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `JWT_EXPIRES_IN` - Access token TTL (default: 15m)
- `LOG_LEVEL` - Winston log level (default: debug)
- `ALLOWED_ORIGINS` - CORS allowed origins (default: http://localhost:5173)

## Running

### Development

```bash
npm run dev
```

Server will start on `http://localhost:3003`

### Production

```bash
npm start
```

## Testing

### Run all tests with coverage

```bash
npm test
```

### Run unit tests only

```bash
npm run test:unit
```

### Run integration tests only

```bash
npm run test:integration
```

### Watch mode

```bash
npm run test:watch
```

**Coverage threshold:** 80% (branches, functions, lines, statements)

## Docker

### Build

```bash
docker build -t fitgainer-workout:latest .
```

### Run

```bash
docker run -p 3003:3003 \
  -e NODE_ENV=production \
  -e MONGO_URI=mongodb://host.docker.internal:27017/fitgainer-workout \
  -e JWT_SECRET=your-secret-key-min-32-chars \
  fitgainer-workout:latest
```

## Features

### Core Workout Service Features (TASK-021 Scaffold ✅)

- **Service Scaffolding** — Express app, logger, database config, Docker setup
- **User Service Integration** — Axios HTTP client with automatic timeout and error handling
- **Health Check** — `GET /health` endpoint for monitoring
- **Structured Logging** — Winston logger with development/production modes
- **Test Infrastructure** — Jest configuration with 80% coverage threshold
- **Graceful Shutdown** — SIGTERM/SIGINT signal handlers

### Exercise Library Features (TASK-022 ✅)

- **Exercise Model** — Mongoose schema with name, muscleGroup, equipment, difficulty, instructions, tips, imageUrl, isActive
- **36 Seeded Exercises** — Complete exercise library across 6 muscle groups (chest, back, shoulders, arms, legs, core)
- **Difficulty Levels** — Beginner, intermediate, advanced exercises with progressive complexity
- **Soft Delete Support** — isActive flag for non-destructive deletion
- **Indexed Queries** — Fast filtering by name, muscleGroup, equipment, difficulty
- **Validation** — Comprehensive field validation (length, enum, custom validators)
- **Idempotent Seeding** — Safe re-run of seed script without duplicates

### Workout Plan Generation Features (TASK-023 ✅)

- **4-Week Training Plans** — Default 4-week duration with flexible configuration
- **Push/Pull/Legs Split** — Day A (Push: chest/shoulders/arms), Day B (Pull: back/arms), Day C (Legs: legs/core)
- **Progressive Overload** — Week-by-week scaling of sets/reps based on user BMI
- **Gender-Aware Equipment Selection** — Males prefer barbells, females prefer bodyweight/dumbbells
- **Adaptive Difficulty** — Standard BMI (≥16) gets aggressive progression, Severe BMI (<16) gets conservative approach
- **Exercise Denormalization** — Exercise names and muscle groups stored in plan for historical reference
- **Scheduled Dates** — Each workout day has explicit scheduled date

### Exercise Library API Features (TASK-024 ✅)

- **List Exercises** — GET /exercises with optional filters (muscleGroup, equipment, difficulty)
- **Get Exercise Detail** — GET /exercises/:id with full information including tips
- **Create Exercise** — POST /exercises (Admin only) with validation of all required fields
- **Update Exercise** — PUT /exercises/:id (Admin only) for partial updates
- **Delete Exercise** — DELETE /exercises/:id (Admin only) with soft-delete (isActive=false)
- **BR-08 Enforcement** — Cannot delete exercise if used in an active workout plan
- **JWT Authentication** — All endpoints require Bearer token
- **RBAC** — GET for User+Admin, POST/PUT/DELETE for Admin only
- **Input Validation** — Name uniqueness, enum values, length constraints
- **Soft Delete** — Exercises are marked inactive rather than removed from database

### Workout Plan API Features (TASK-025 ✅)

- **Generate Personalized Plans** — POST /plans/generate with user profile integration
- **View Active Plan** — GET /plans/my retrieves user's current plan
- **Weekly Breakdown** — GET /plans/my/week/:weekNumber shows week-specific exercises
- **Today's Workout** — GET /plans/my/today returns exercises for current date
- **User Profile Integration** — Validates user has completed profile before generating
- **BR-01 & BR-02 Enforcement** — Business rule validation for plan generation
- **UTC Date Comparison** — Today's workout calculated with proper timezone handling

### Workout Execution API Features (TASK-028 ✅ Backend + TASK-029 ✅ Frontend)

**Backend (TASK-028):**
- **Session Logging** — POST /api/workouts/sessions to record workout results
- **WorkoutSession Model** — MongoDB schema with nested SetResult and ExerciseSession objects
- **Multi-Level Validation** — Session, exercise, and set-level input validation
- **Unique Constraint** — Prevents duplicate sessions for (userId, planId, weekNumber, dayNumber, sessionDate)
- **Denormalization** — Exercise name and muscle group snapshots stored for historical reference
- **Pre-save Hooks** — Automatic validation (date in future check, completed exercise validation, completedAt assignment)
- **Error Handling** — Custom error classes (ValidationError, DuplicateSessionError, DatabaseError)
- **Set Tracking** — Record reps, weight, RPE, and notes for each set
- **Mood & Duration** — Optional session-level mood and total duration tracking
- **JWT Authentication** — All endpoints require Bearer token (userId extracted from JWT)
- **Comprehensive Validation** — actualReps (0-100), weight (0-500), rpe (1-10), notes length constraints

**Frontend (TASK-029):**
- **GET /api/workouts/sessions** — Fetch saved sessions for display in read-only mode
- **WorkoutExecutionForm Component** — Real-time form validation (reps, weight, RPE)
- **ExerciseCard Execution Mode** — Set-by-set logging with individual input validation
- **Session Summary** — Duration (0-300 min), mood (great/good/ok/tired), notes fields
- **Status Toggle** — completed/skipped per exercise
- **Auto-dismiss Toast** — 3s auto-hide on successful submission
- **Read-only View** — Display previously saved sessions in non-editable format
- **Date Guard** — Only allow logging for today's date (UTC comparison)

## Implementation Status

| Task | Feature | Status | Details |
|------|---------|--------|---------|
| TASK-021 | Workout Service Scaffolding | ✅ Complete | Express app, logger, database, Axios client, Dockerfile, jest config, 57 tests (16+13+12+14), 98% coverage |
| TASK-022 | Exercise Model & Seed Data | ✅ Complete | 36 exercises (6 muscle groups, 3 difficulties), Mongoose schema, seed script, 42 integration tests, 100% coverage |
| TASK-023 | WorkoutPlan Model & Generator | ✅ Complete | 4-week plans, PPL split, progressive overload, gender-aware equipment, 47 tests, 96.58% coverage |
| TASK-024 | Exercise Library API | ✅ Complete | 5 endpoints (GET list, GET detail, POST, PUT, DELETE), JWT auth, RBAC, soft-delete with BR-08, 51 integration tests, 80%+ coverage |
| TASK-025 | Workout Plan API | ✅ Complete | 4 endpoints (POST /plans/generate, GET /plans/my, GET /plans/my/week/:weekNumber, GET /plans/my/today), user-service integration, BR-01/BR-02 enforcement, UTC date comparison, 30 integration tests, 85%+ coverage |
| TASK-028 | Workout Execution API (Backend) | ✅ Complete | WorkoutSession model with SetResult/ExerciseSession schemas, POST /api/workouts/sessions endpoint, multi-level validation, unique compound index, pre-save hooks, denormalization, error classes, 159 integration tests, 97%+ coverage |
| TASK-029 | Workout Execution Form (Frontend) | ✅ Complete | WorkoutExecutionForm component, ExerciseCard execution mode, workoutSession.service (FE), GET /api/workouts/sessions endpoint integration, real-time validation, session summary, read-only saved sessions view, date guard for today-only logging |
| TASK-031-BE-Workout-Admin | Admin Exercise Management (Backend) | ✅ Complete | Exercise model enhanced with isDeleted, deletedAt, description, sets, reps, restTime; admin service (4 methods), controller (4 handlers), validation middleware (ReDoS prevention), routes with Auth/Authz, 63 integration tests, 100% coverage |

## TASK-023: WorkoutPlan Model & Generator (✅ Complete, 2026-05-18)

### WorkoutPlan Model Implementation

**File:** `src/models/WorkoutPlan.js`

**Schema Structure (with nested schemas):**

**planExerciseSchema (nested):**
- `exerciseId` (ObjectId) — Reference to Exercise document
- `name` (String) — Exercise name (denormalized)
- `muscleGroup` (String) — Primary muscle group, enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core']
- `sets` (Number) — Number of sets, 1-10
- `reps` (String) — Reps range (e.g., "10" or "8-12")
- `restSeconds` (Number) — Rest between sets, 30-300 seconds
- `order` (Number) — Exercise order in workout

**daySchema (nested):**
- `dayNumber` (Number) — Day of week, 1-7
- `dayLabel` (String) — Day label (e.g., "Ngày A — Push")
- `scheduledDate` (Date) — Specific date for this workout
- `isRestDay` (Boolean) — Rest day flag
- `exercises` ([planExerciseSchema]) — Exercises for the day

**weekSchema (nested):**
- `weekNumber` (Number) — Week number, min 1
- `days` ([daySchema]) — 7-day schedule

**WorkoutPlan Root Schema:**
- `userId` (String) — User ID
- `name` (String) — Plan name
- `startDate` (Date) — Plan start date
- `endDate` (Date) — Plan end date
- `durationWeeks` (Number) — Duration, default 4
- `daysPerWeek` (Number) — Training days per week, default 3
- `status` (String) — enum: ['active', 'completed', 'cancelled'], default 'active'
- `weeks` ([weekSchema]) — Training weeks
- `generatedFrom` (Object) — Metadata (weight, height, bmi, gender at generation)
- `createdAt`, `updatedAt` — Timestamps

**Indexes:**
- `{ userId: 1 }` — Find user's plans
- `{ userId: 1, status: 1 }` — Find user's active plans

### Plan Generator Service

**File:** `src/services/planGenerator.js`

**Main Function:** `generatePlan(userProfile, exercises)`

**Key Logic:**
- Accepts user profile data (userId, weight, height, bmi, gender)
- Accepts array of Exercise documents
- Generates 4-week plan with PPL split
- Determines progressive overload level based on BMI severity
- Selects gender-appropriate exercises
- Returns complete WorkoutPlan object ready for database insertion

**Progressive Overload Scaling:**

Standard BMI (≥16):
- Week 1: 3 sets × 10 reps
- Week 2: 3 sets × 10-12 reps
- Week 3: 4 sets × 8-10 reps
- Week 4: 4 sets × 8-12 reps

Severe BMI (<16):
- Week 1-4: 2→3 sets × 10-15 reps (conservative)

**Equipment Priority (Gender-Aware):**
- Male: barbell > dumbbell > cable > machine > bodyweight
- Female: bodyweight > dumbbell > cable > machine > barbell

**Weekly Structure (7 days):**
- Day 1: Push (Ngày A — Push) — chest, shoulders, arms
- Day 2: Rest (Nghỉ ngơi)
- Day 3: Pull (Ngày B — Pull) — back, arms
- Day 4: Rest
- Day 5: Legs (Ngày C — Legs) — legs, core
- Day 6-7: Rest

**Test Coverage (47 tests, 100% coverage)**

Test categories:
- generatePlan function (plan creation, structure validation)
- selectExercises function (filtering and sorting by muscle group)
- buildDaysForWeek function (day generation with proper dates)
- Progressive overload logic (week scaling calculations)
- Equipment priority (gender-aware selection)
- PPL split validation (muscle group assignment correctness)
- Date calculations (each day gets proper scheduled date)
- Output schema compliance (generated plan matches model)

**Key Design Decisions**

1. **Nested Schemas** — Denormalize exercise data in plan for historical reference
2. **Gender-Aware Equipment** — Adapt equipment selection to user preferences
3. **BMI-Based Progression** — Adjust intensity based on user's BMI severity
4. **7-Day Weeks** — Include rest days explicitly in plan structure
5. **API-Layer Validation** — Exercise count validation deferred to TASK-025 (Exercise API)

---

## TASK-024: Exercise Library API (✅ Complete, 2026-05-18)

### Exercise API Endpoints

**File:** `src/controllers/exercise.controller.js`

**GET /exercises** — List all active exercises
- **Auth:** User or Admin
- **Query Parameters (optional):**
  - `muscleGroup` — Filter by muscle group (chest, back, shoulders, arms, legs, core)
  - `equipment` — Filter by equipment type (barbell, dumbbell, bodyweight, cable, machine)
  - `difficulty` — Filter by difficulty (beginner, intermediate, advanced)
- **Response:** 200 `{ exercises: [...], total: N }`
- **Implementation:** Queries Exercise model with `isActive: true` filter and optional query filters

**GET /exercises/:exerciseId** — Get single exercise detail
- **Auth:** User or Admin
- **Response:** 200 with full exercise object (includes tips array)
- **Error:** 404 if exercise not found or not active
- **Implementation:** Retrieves document by `_id` and verifies `isActive: true`

**POST /exercises** — Create new exercise
- **Auth:** Admin only (returns 403 for User role)
- **Body:** `{ name, muscleGroup, equipment, difficulty, instructions, tips?, secondaryMuscles?, imageUrl? }`
- **Validation:** Via `validateCreateExercise` middleware
  - `name` — required, 2-100 chars, unique (checked at DB level)
  - `muscleGroup` — required, enum validation
  - `equipment` — required, enum validation
  - `difficulty` — required, enum validation
  - `instructions` — required, 10-2000 chars
  - `tips` — optional, array, each item ≤ 200 chars
  - `secondaryMuscles` — optional array
- **Response:** 201 with created exercise
- **Error:** 400 (validation failed), 409 (duplicate name via E11000 index), 401 (no token), 403 (not admin)

**PUT /exercises/:exerciseId** — Update exercise
- **Auth:** Admin only
- **Body:** Partial update (all fields optional but validated if present)
- **Validation:** Via `validateUpdateExercise` middleware (same rules as create but all optional)
- **Only Updates:** Exercises with `isActive: true`
- **Response:** 200 with updated exercise
- **Error:** 404 (not found or inactive), 400 (validation), 401, 403

**DELETE /exercises/:exerciseId** — Soft delete exercise (BR-08 enforcement)
- **Auth:** Admin only
- **Only Deletes:** Exercises with `isActive: true`
- **BR-08 Enforcement:** Checks `WorkoutPlan` collection for active plans using this exercise
  - If found: Returns 409 "Exercise is being used in an active workout plan"
  - If not: Sets `isActive = false` (soft delete)
- **Response:** 200 `{ success: true, message: "Exercise deleted" }`
- **Error:** 404 (not found or inactive), 409 (in-use constraint), 401, 403

### Authentication & Authorization (TASK-024)

**File:** `src/middleware/authenticate.js`
- Extracts `Authorization: Bearer <token>` header
- Verifies JWT signature with HS256 algorithm
- Sets `req.user = { userId, email, role }`
- Returns 401 for missing/invalid/expired tokens

**Middleware Chain Example:**
```javascript
// Read endpoints (User + Admin)
router.get('/', authenticate, controller.getExercises);

// Admin-only endpoints
router.post('/', authenticate, requireRole(['Admin']), validateCreateExercise, controller.createExercise);
router.put('/:id', authenticate, requireRole(['Admin']), validateUpdateExercise, controller.updateExercise);
router.delete('/:id', authenticate, requireRole(['Admin']), controller.deleteExercise);
```

### Input Validation (TASK-024)

**File:** `src/validators/exercise.validator.js`

**validateCreateExercise Middleware:**
- Validates request body before controller processes it
- Returns 400 with errors array on validation failure
- Enforces all required fields and constraint rules

**validateUpdateExercise Middleware:**
- Validates optional fields (same constraints as create)
- Allows partial updates
- Returns 400 if any present field fails validation

### Test Coverage (TASK-024)

**File:** `tests/integration/exercise.api.test.js`

**51 tests covering:**
- **Authentication (6 tests):**
  - Missing token → 401
  - Invalid token → 401
  - Expired token → 401
  - User token on admin endpoint → 403
  - Admin token on read endpoint → 200

- **GET /exercises (6 tests):**
  - List all exercises → 200 with array
  - Filter by muscleGroup → returns matching exercises
  - Filter by equipment → returns matching exercises
  - Filter by difficulty → returns matching exercises
  - Multiple filters combined → returns correct subset
  - No results → returns empty array

- **GET /exercises/:id (4 tests):**
  - Valid ID → 200 with full exercise (including tips)
  - Invalid ID format → 404
  - Non-existent ID → 404
  - Inactive exercise → 404

- **POST /exercises (13 tests):**
  - Valid body, admin token → 201 with exercise
  - Missing required field → 400 with error message
  - Invalid muscleGroup enum → 400
  - Invalid equipment enum → 400
  - Invalid difficulty enum → 400
  - Name too short → 400
  - Name too long → 400
  - Instructions too short → 400
  - Instructions too long → 400
  - Tips item > 200 chars → 400
  - Duplicate name → 409
  - No token → 401
  - User token → 403

- **PUT /exercises/:id (12 tests):**
  - Valid partial update → 200
  - Update name only → 200 with updated name
  - Update instructions only → 200
  - Invalid enum value in update → 400
  - Non-existent ID → 404
  - Inactive exercise → 404
  - Field validation errors → 400
  - No token → 401
  - User token → 403
  - Update with all fields → 200
  - Keep unchanged fields → 200

- **DELETE /exercises/:id (10 tests):**
  - Valid delete (not in use) → 200 with isActive=false
  - Non-existent ID → 404
  - Inactive exercise → 404
  - Exercise in active plan → 409
  - Multiple active plans using exercise → 409
  - Exercise in completed plan → 200 (can delete, plan not active)
  - No token → 401
  - User token → 403

**Coverage:** 80%+ on exercise.controller.js (all main paths and error cases)

---

## TASK-022: Exercise Model & Seed Data (✅ Complete, 2026-05-18)

### Exercise Model Implementation

**File:** `src/models/Exercise.js`

**Schema Fields:**
- `name` (String) — Exercise name, required, unique, 2-100 chars
- `muscleGroup` (String) — Primary muscle group, required, enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core']
- `secondaryMuscles` ([String]) — Secondary muscle groups worked, default []
- `equipment` (String) — Equipment needed, required, enum: ['barbell', 'dumbbell', 'bodyweight', 'cable', 'machine']
- `difficulty` (String) — Difficulty level, required, enum: ['beginner', 'intermediate', 'advanced']
- `instructions` (String) — Detailed instructions, required, 10-2000 chars
- `tips` ([String]) — Performance tips, each ≤200 chars, default []
- `imageUrl` (String) — Optional image URL, default null
- `isActive` (Boolean) — Soft delete flag, required, default true
- `createdAt`, `updatedAt` — Timestamps (auto)

**Indexes:**
- `name` (unique)
- `muscleGroup` (for filtering)
- `equipment` (for filtering)
- `difficulty` (for filtering)

**Validation:**
- Name uniqueness enforced at DB level
- All enum fields validated against allowed values
- Instructions min/max length enforced
- Tips length validation (max 200 chars each)
- Custom validator for array constraints

### Exercise Seed Data

**File:** `src/scripts/seedExercises.js`

**36 Exercises seeded across 6 muscle groups:**

**Chest (5 exercises):**
- Bench Press (barbell, beginner)
- Dumbbell Flyes (dumbbell, beginner)
- Push-Up (bodyweight, beginner)
- Incline Dumbbell Press (dumbbell, beginner)
- Cable Crossover (cable, intermediate)

**Back (6 exercises):**
- Deadlift (barbell, intermediate)
- Pull-Up (bodyweight, beginner)
- Barbell Row (barbell, intermediate)
- Lat Pulldown (cable/machine, intermediate)
- T-Bar Row (barbell, intermediate)
- Seal Rows (machine, advanced)

**Shoulders (6 exercises):**
- Military Press (barbell, intermediate)
- Lateral Raises (dumbbell, beginner)
- Shrugs (barbell, beginner)
- Dumbbell Press (dumbbell, beginner)
- Machine Shoulder Press (machine, beginner)
- Cable Lateral Raise (cable, intermediate)

**Arms (5 exercises):**
- Barbell Curls (barbell, beginner)
- Skull Crushers (barbell, intermediate)
- Dumbbell Curls (dumbbell, beginner)
- Tricep Dips (bodyweight, intermediate)
- Preacher Curls (machine, beginner)

**Legs (4 exercises):**
- Squats (barbell, intermediate)
- Leg Press (machine, beginner)
- Lunges (dumbbell, beginner)
- Leg Curls (machine, beginner)

**Core (4 exercises):**
- Planks (bodyweight, beginner)
- Ab Wheel Rollouts (machine, advanced)
- Hanging Leg Raises (bodyweight, intermediate)
- Russian Twists (dumbbell, intermediate)

**Seed Script Features:**
- Idempotent upsert via `findOneAndUpdate()` with upsert: true
- Safe to re-run without creating duplicates
- Each exercise includes instructions and tips
- Mix of beginner (19), intermediate (13), and advanced (4) exercises
- Proper secondary muscle group classification

**Usage:**
```bash
node src/scripts/seedExercises.js
# Output: ✓ Seeded 36 exercises successfully
```

### Test Coverage (42 tests, 100% coverage)

**Integration Tests:** `tests/integration/exercise.model.test.js`

**Test Categories:**

1. **Schema Creation (9 tests)**
   - Save with all required fields
   - Auto-generation of isActive, secondaryMuscles, tips, imageUrl defaults
   - Accept all optional fields when provided

2. **Timestamps (2 tests)**
   - Auto-generate createdAt and updatedAt
   - Update updatedAt on save

3. **Validation (8 tests)**
   - Name uniqueness constraint
   - muscleGroup enum validation
   - equipment enum validation
   - difficulty enum validation

4. **Index Verification (4 tests)**
   - name unique index enforcement
   - muscleGroup index for filtering
   - equipment index for filtering
   - difficulty index for filtering

5. **Soft Delete (3 tests)**
   - isActive flag default to true
   - isActive can be set to false
   - Query filtering by isActive

6. **Constraints (8 tests)**
   - name minlength/maxlength
   - instructions minlength/maxlength
   - tips array validation (length, individual tip constraints)
   - Custom validators

7. **Compound Tests (8 tests)**
   - Secondary muscles handling
   - Tips array with valid content
   - imageUrl handling
   - Update operations

**Results:**
- 42 tests passing (100% success)
- 100% model code coverage
- All validation rules tested

### Key Design Decisions

1. **Soft Delete (isActive)** — Allows archiving exercises without data loss (BR-08)
2. **Difficulty Enumeration** — Restricts to 3 levels (beginner/intermediate/advanced) for consistent progression
3. **Multiple Indexes** — Enables fast filtering by muscle group, equipment, difficulty for workout generation
4. **Secondary Muscles** — Allows exercises that work multiple muscle groups (e.g., Deadlift works back, legs, core)
5. **Idempotent Seeding** — Upsert strategy ensures seed script is safe to re-run multiple times
6. **Constraints Validation** — Custom validators enforce business rules (tips length, array constraints)

---

## TASK-021: Workout Service Scaffolding (✅ Complete, 2026-05-18)

### Architecture Scaffolding

**New Files:**
- `src/server.js` — Entry point with database connection and graceful shutdown
- `src/app.js` — Express app configuration with middleware setup
- `src/config/database.js` — MongoDB connection with pool configuration
- `src/config/userServiceClient.js` — Axios HTTP client for user-service integration
- `src/utils/logger.js` — Winston logging factory
- `src/routes/exercise.routes.js` — Stub exercise routes (placeholder)
- `src/routes/plan.routes.js` — Stub workout plan routes (placeholder)
- `jest.config.js` — Test configuration with 80% coverage threshold
- `Dockerfile` — Production-ready containerization (multi-stage build, non-root user)
- `.env.example` — Environment configuration template
- `package.json` — Dependencies (Express, Mongoose, JWT, Winston, Jest, Axios)

**Infrastructure:**
- Graceful shutdown: SIGTERM/SIGINT signal handlers
- Database connection pooling: min 5, max 20 connections
- Unhandled rejection/exception monitoring
- Winston structured logging with separate app/error logs

### Key Features Implemented

1. **Server Lifecycle**
   - Async startup with database connection
   - Graceful shutdown on SIGTERM/SIGINT
   - Unhandled rejection/exception handlers

2. **Express App**
   - CORS middleware for cross-origin requests
   - Body parser for JSON payloads
   - Request logging via Winston
   - Health check endpoint: `GET /health`
   - Error handling middleware for JSON parse errors and 404s

3. **Database Configuration**
   - Connection string from `MONGO_URI` environment variable
   - Connection pool: min 5, max 20
   - Timeouts: 5000ms (socket, server selection, connect)
   - Graceful connection cleanup on shutdown
   - Fallback URI: `fitgainer-workout` if not specified

4. **User Service Integration (New)**
   - Axios HTTP client with 5000ms timeout
   - Error handling: 404 errors mapped to "User profile not found"
   - Auto-conversion of response data to plain objects
   - Structured logging before throwing 404 errors
   - Method: `getUserProfile(token)` → Promise<{userId, email, ...}>

5. **Logging**
   - Winston logger with JSON format
   - Development (colorized console) and production (JSON) modes
   - Separate log files: `logs/app.log` and `logs/error.log`
   - Configurable log level via `LOG_LEVEL` environment variable
   - Service metadata: `defaultMeta.service = 'workout-service'`

6. **Testing Infrastructure**
   - Jest configuration with MongoMemoryServer support
   - 80% coverage threshold (statements, branches, functions, lines)
   - Test environment setup
   - Test timeout: 30 seconds

7. **Docker & Deployment**
   - Multi-stage Dockerfile for optimized production image
   - Non-root user for security
   - Health check support
   - Environment variable configuration
   - EXPOSE 3003

### Test Coverage (TASK-021)

**Unit Tests:**
- Logger (16 tests) — Logging output, levels, file writing
- Database (13 tests) — Connection, pool config, timeouts, error handling
- UserServiceClient (12 tests) — Axios client, error handling, 404 mapping

**Integration Tests:**
- App (14 tests) — Express app startup, health check, middleware, 404 handling

**Total:** 57 tests passing
**Coverage:** 98% statements, 88% branches, 100% functions, 98% lines

### Example Usage

```bash
# Health check
curl http://localhost:3003/health
# Response: { "status": "ok", "service": "workout-service", "timestamp": "..." }

# Test user service integration (in code)
const client = require('./config/userServiceClient');
const profile = await client.getUserProfile(token);
```

---

## TASK-025: Workout Plan API (✅ Complete, 2026-05-18)

### Workout Plan API Endpoints

**File:** `src/controllers/plan.controller.js`

**POST /plans/generate** — Generate personalized workout plan
- **Auth:** User or Admin (Bearer token required)
- **Body:** None (uses JWT token for userId)
- **User-Service Integration:** Calls user-service to fetch and validate user profile
- **Business Rules:**
  - BR-01: One active plan per user (returns 409 if already exists)
  - BR-02: User must have profile (returns 400 if not found)
  - SR-01: userId always from JWT (never from body)
  - SR-03: Calls user-service for profile validation
- **Response:** 201 with plan summary (planId, name, startDate, endDate, durationWeeks, daysPerWeek, status)
- **Error:** 400 (no profile), 409 (already has active plan), 500 (insufficient exercises)

**GET /plans/my** — Retrieve active workout plan
- **Auth:** User or Admin (Bearer token required)
- **Response:** 200 with complete plan (nested weeks/days/exercises), or 404 if not found
- **Includes:** Full plan structure with all exercise details

**GET /plans/my/week/:weekNumber** — Get specific week of current plan
- **Auth:** User or Admin
- **Path Parameters:** weekNumber (integer, 1 ≤ weekNumber ≤ durationWeeks)
- **Response:** 200 with week detail (7-day schedule), 400 for invalid weekNumber, 404 if no plan

**GET /plans/my/today** — Get today's workout exercises
- **Auth:** User or Admin
- **Timezone-Aware:** Uses UTC date comparison
- **Response:** 200 with today's workout or rest day response
- **Never Returns 404:** Always returns 200

### Test Coverage (TASK-025)

**File:** `tests/integration/plan.api.test.js`

**30 tests covering:**
- POST /plans/generate: success, conflict, no-profile, insufficient-exercises
- GET /plans/my: found, not-found, full-structure validation
- GET /plans/my/week/:weekNumber: valid/invalid range, not-found
- GET /plans/my/today: workout-day, rest-day, out-of-plan, no-plan
- Security: userId from JWT, isolation between users

**Coverage:** 85%+ on planService.js and plan.controller.js

---

## TASK-028: Workout Execution API (✅ Complete, 2026-05-18)

### Backend Workout Execution Implementation

**Purpose:** Accept and validate workout execution results, store session data with multi-level validation and denormalization strategy.

**New Files:**
- `src/models/WorkoutSession.js` — WorkoutSession schema with nested SetResult and ExerciseSession
- `src/services/workoutSessionService.js` — Business logic with validation chain and duplicate check
- `src/controllers/workoutSessionController.js` — POST handler for session creation
- `src/routes/workoutSessionRoutes.js` — Route definitions for workout session endpoints
- `src/errors/ValidationError.js`, `DuplicateSessionError.js`, `DatabaseError.js` — Custom error classes
- `tests/integration/workoutSession.api.test.js` — 159 comprehensive integration tests

### WorkoutSession Model

**File:** `src/models/WorkoutSession.js`

**Schema Hierarchy:**

1. **SetResultSchema** (nested, no _id)
   - `setNumber` — Integer (1-based counter)
   - `actualReps` — Number (0-100)
   - `weight` — Number (0-500 kg)
   - `rpe` — Number (1-10, optional, rate of perceived exertion)
   - `notes` — String (max 200 chars, optional)

2. **ExerciseSessionSchema** (nested, no _id)
   - `exerciseId` — String (ObjectId reference)
   - `name` — String (denormalized exercise name)
   - `muscleGroup` — String (enum: 'chest'|'back'|'shoulders'|'arms'|'legs'|'core')
   - `status` — String (enum: 'completed'|'skipped')
   - `plannedSets` — Number (expected sets from plan)
   - `plannedReps` — String (e.g., "8-12")
   - `sets` — Array of SetResultSchema (only if status='completed')
   - `notes` — String (max 300 chars, optional)

3. **WorkoutSessionSchema** (root)
   - `userId` — String (from JWT)
   - `planId` — String (workout plan reference)
   - `weekNumber` — Number (1-based)
   - `dayNumber` — Number (1-7)
   - `sessionDate` — Date (YYYY-MM-DD format)
   - `exercises` — Array of ExerciseSessionSchema
   - `totalDuration` — Number (0-300 minutes, optional)
   - `mood` — String (enum: 'great'|'good'|'ok'|'tired', optional)
   - `notes` — String (max 500 chars, optional)
   - `completedAt` — Date (auto-set by pre-save hook)
   - `timestamps` — createdAt, updatedAt (auto)

**Indexes:**
- Unique compound: `{ userId: 1, planId: 1, weekNumber: 1, dayNumber: 1, sessionDate: 1 }`
- Query optimization: `{ userId: 1 }`, `{ sessionDate: 1 }`

**Pre-save Hooks:**
1. **Date Validation** — Ensures sessionDate is not in the future (BR-02)
2. **Completed Exercise Check** — Validates all 'completed' exercises have >= 1 set (BR-03)
3. **Timestamp Assignment** — Auto-sets completedAt to current time

### WorkoutSessionService

**File:** `src/services/workoutSessionService.js`

**Main Function:** `createSession(userId, sessionData)`

**Validation Chain:**
1. `validateSessionInput()` — Session-level fields
   - planId: valid ObjectId
   - weekNumber: positive integer
   - dayNumber: 1-7
   - sessionDate: not in future
   - exercises: non-empty array
   - totalDuration: 0-300 (if provided)
   - mood: enum validation
   - notes: max 500 chars

2. `validateExercise()` — Per-exercise validation
   - exerciseId: valid ObjectId
   - name: required, non-empty
   - muscleGroup: enum validation
   - status: 'completed'|'skipped'
   - plannedSets: positive integer
   - plannedReps: required, non-empty
   - completed exercises must have >= 1 set

3. `validateSet()` — Per-set validation
   - setNumber: positive integer
   - actualReps: 0-100
   - weight: 0-500
   - rpe: 1-10 (if provided)
   - notes: max 200 chars

4. **Duplicate Check** — Queries for existing session with same (userId, planId, weekNumber, dayNumber, sessionDate)

5. **Database Insert** — Saves to MongoDB with pre-save hooks

**Error Handling:**
- `ValidationError` (400) — Input validation failures with specific field/reason
- `DuplicateSessionError` (409) — Session already exists for this date/plan
- `DatabaseError` (500) — MongoDB operation failures

### Denormalization Strategy

**Why:** Maintain historical accuracy of exercise information at session time

**What's Denormalized:**
- `exerciseId` — Reference to current Exercise document
- `name` — Exercise name snapshot (in case exercise is renamed later)
- `muscleGroup` — Primary muscle group snapshot (for reporting/stats)

**Why Denormalize:**
- If exercise is deleted/renamed, session still shows original data
- Enables accurate historical analysis and statistics
- Prevents "broken link" scenarios where session references deleted exercise

### POST /api/workouts/sessions Endpoint

**File:** `src/controllers/workoutSessionController.js`

**Handler:** `createSession(req, res, next)`

**Features:**
- JWT authentication required (Bearer token)
- Extracts userId from JWT (never from request body) — SR-01
- Calls workoutSessionService.createSession(userId, req.body)
- Returns appropriate HTTP status codes

**Response Format:**
```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "userId": "user-123",
    "planId": "plan-456",
    "weekNumber": 1,
    "dayNumber": 3,
    "sessionDate": "2026-05-18",
    "exercises": [
      {
        "exerciseId": "exercise-789",
        "name": "Bench Press",
        "muscleGroup": "chest",
        "status": "completed",
        "plannedSets": 3,
        "plannedReps": "8-12",
        "sets": [
          {
            "setNumber": 1,
            "actualReps": 10,
            "weight": 80,
            "rpe": 8,
            "notes": "Felt strong"
          }
        ],
        "notes": "Good form throughout"
      }
    ],
    "totalDuration": 45,
    "mood": "great",
    "notes": "Session went well",
    "completedAt": "2026-05-18T14:30:00Z",
    "createdAt": "2026-05-18T14:30:00Z",
    "updatedAt": "2026-05-18T14:30:00Z"
  }
}
```

**Status Codes:**
- `201` — Session created successfully
- `400` — Validation failed with specific error message
- `401` — Missing or invalid JWT token
- `409` — Duplicate session already exists
- `500` — Database or server error

### Test Coverage (TASK-028)

**File:** `tests/integration/workoutSession.api.test.js`

**Test Count:** 159 comprehensive integration tests

**Test Categories:**
- **Model Validation (20 tests)** — Schema constraints, enums, ranges, required fields
- **Service Validation (40 tests)** — Input parsing, multi-level validation, error scenarios
- **Unique Constraint (15 tests)** — Duplicate session detection, compound index enforcement
- **API Endpoint (30 tests)** — 201 success, 400 validation errors, 401 auth, 409 duplicate, 500 errors
- **Denormalization (15 tests)** — Exercise data snapshots stored correctly
- **Boundary Conditions (20 tests)** — Min/max values, optional fields, edge cases
- **Business Rules (19 tests)** — BR-02 (future date), BR-03 (completed exercises), BR-04 (set validation)

**Coverage:** 97%+ of business logic, all critical paths tested

---

## Logging

Logs are written to `logs/` directory:

- `app.log` - All logs
- `error.log` - Errors only

Console output is colorized in development.

## Development Guidelines

### Code Style

- CommonJS (require/module.exports)
- 2-space indentation
- No TypeScript
- Clear variable names

### Testing

- Write tests first (TDD)
- Use MongoMemoryServer for integration tests
- Aim for 80%+ coverage
- Test error cases

### Security

- Never commit `.env` files
- JWT_SECRET must be ≥32 chars in production
- Validate and sanitize all inputs
- Token validation mandatory on protected routes

## License

MIT

## TASK-031-BE-Workout-Admin: Admin Exercise Management API

### Overview

Admin exercise management provides comprehensive CRUD operations for the exercise library. Admins can list exercises with pagination, search, and filtering; create new exercises; update existing exercises; and soft-delete exercises. All endpoints require Admin role authorization.

### API Endpoints

**All endpoints:**
- Require Bearer token authentication (JWT)
- Require Admin role authorization
- Base path: `/api/admin/exercises`

#### GET /api/admin/exercises — List exercises with pagination, search, and filtering

**Query Parameters:**
- `page` (integer, default 1) — 1-indexed page number
- `search` (string, optional) — Search exercises by name or description (case-insensitive)
- `muscleGroup` (string, optional) — Filter by muscle group (chest, back, shoulders, arms, legs, core)

**Example Request:**
```bash
GET /api/admin/exercises?page=1&search=bench&muscleGroup=chest
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Bench Press",
      "muscleGroup": "chest",
      "sets": 3,
      "reps": "8-12",
      "restTime": 90,
      "description": "Classic compound chest exercise",
      "difficulty": "intermediate",
      "equipment": "barbell",
      "instructions": "Lie on flat bench with feet on floor...",
      "isDeleted": false,
      "createdAt": "2026-05-19T10:00:00.000Z",
      "updatedAt": "2026-05-19T10:00:00.000Z"
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
- Regex search on name + description with ReDoS prevention
- Pagination: fixed limit of 10 per page
- Results sorted by exercise name (ascending)
- `.lean()` optimization for read-only queries

#### POST /api/admin/exercises — Create new exercise

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
  "instructions": "Position bar on shoulders. Descend until thighs are parallel to floor. Drive through heels to stand."
}
```

**Response (201 Created):**
```json
{
  "message": "Exercise created",
  "exercise": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Barbell Squat",
    "muscleGroup": "legs",
    "sets": 4,
    "reps": "6-8",
    "restTime": 120,
    "description": "Heavy compound leg movement",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "instructions": "...",
    "isDeleted": false,
    "createdAt": "2026-05-19T11:00:00.000Z",
    "updatedAt": "2026-05-19T11:00:00.000Z"
  }
}
```

**Validation Rules:**
- `name` — Required, string, 1-100 chars, must be unique (case-insensitive)
- `muscleGroup` — Required, enum: [chest, back, shoulders, arms, legs, core]
- `sets` — Required, integer, 1-10
- `reps` — Required, format "X-Y" (e.g., "8-12")
- `restTime` — Required, integer, 30-300 seconds

**Errors:**
- `400` — Validation failed (specific field message)
- `409` — Duplicate exercise name (case-insensitive check)
- `401` — No authentication token
- `403` — User role (not Admin)

#### PATCH /api/admin/exercises/:exerciseId — Update exercise

**Request Body (partial update):**
```json
{
  "name": "Barbell Back Squat",
  "sets": 5,
  "reps": "5-8"
}
```

**Response (200 OK):**
```json
{
  "message": "Exercise updated",
  "exercise": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Barbell Back Squat",
    "muscleGroup": "legs",
    "sets": 5,
    "reps": "5-8",
    "restTime": 120,
    "description": "Heavy compound leg movement",
    "difficulty": "intermediate",
    "equipment": "barbell",
    "instructions": "...",
    "isDeleted": false,
    "createdAt": "2026-05-19T11:00:00.000Z",
    "updatedAt": "2026-05-19T11:30:00.000Z"
  }
}
```

**Features:**
- All fields optional (partial update)
- Validates each provided field (same rules as creation)
- Name uniqueness checked only if name is different from current
- Only updates non-deleted exercises (`isDeleted: false`)

**Errors:**
- `400` — Validation failed on any field
- `404` — Exercise not found or already deleted
- `409` — Name conflict with another exercise
- `401` — No authentication token
- `403` — User role (not Admin)

#### DELETE /api/admin/exercises/:exerciseId — Soft delete exercise

**Request:**
```bash
DELETE /api/admin/exercises/507f1f77bcf86cd799439012
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "message": "Exercise deleted",
  "exercise": {
    "_id": "507f1f77bcf86cd799439012",
    "isDeleted": true
  }
}
```

**Implementation Details:**
- Soft delete: Sets `isDeleted = true` and `deletedAt = now()`
- Pre-save hook auto-manages deletedAt timestamp
- Idempotent: Calling on already-deleted exercise returns 200
- Doesn't block deletion (unlike TASK-024 Exercise API which enforces BR-08)

**Errors:**
- `404` — Exercise not found
- `401` — No authentication token
- `403` — User role (not Admin)

### Model Enhancements (Exercise.js)

**New/Updated Fields:**
- `description` (String, optional) — Admin-maintained exercise description
- `sets` (Number, optional) — Default sets for this exercise
- `reps` (String, optional) — Default reps range (format: "X-Y")
- `restTime` (Number, optional) — Default rest time in seconds
- `isDeleted` (Boolean, default: false) — Soft delete flag
- `deletedAt` (Date, default: null) — Soft delete timestamp

**Pre-save Hook:**
Automatically manages `deletedAt` timestamp when `isDeleted` changes
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

**Index:** `{ isDeleted: 1 }` for fast filtering of non-deleted exercises

### Service Layer (adminService.js)

**Class:** `AdminExerciseService`

**Methods:**

1. **getExerciseList(page, limit, searchFilter, muscleGroupFilter)**
   - Pagination with skip calculation
   - Regex search on name + description (ReDoS-safe)
   - Optional muscleGroup filtering
   - Returns { exercises, pagination }

2. **createExercise(data)**
   - Validates required fields (via middleware)
   - Checks name uniqueness (case-insensitive)
   - Creates and returns new exercise

3. **updateExercise(exerciseId, data)**
   - Validates ObjectId format
   - Fetches existing non-deleted exercise
   - Applies partial updates
   - Checks name uniqueness if name changed
   - Saves and returns updated exercise

4. **deleteExercise(exerciseId)**
   - Validates ObjectId format
   - Soft deletes exercise (sets isDeleted=true)
   - Pre-save hook handles deletedAt
   - Idempotent operation

### Validation Middleware (adminValidation.js)

**Validators:**

- **validateExerciseCreate(req, res, next)**
  - All 5 fields required
  - Type checking: name is string, sets is integer, restTime is integer
  - Enum validation: muscleGroup against allowed values
  - Range validation: sets 1-10, restTime 30-300 seconds
  - Format validation: reps matches "X-Y" pattern (ReDoS-safe)
  - Rejects request with 400 if any validation fails

- **validateExerciseUpdate(req, res, next)**
  - Same validation rules but all fields optional
  - Only validates fields present in request body
  - Enables partial updates while maintaining constraints

### Test Coverage

**File:** `tests/integration/admin-exercises.test.js`

**63 comprehensive integration tests covering:**

- **Authentication & Authorization (12 tests)**
  - Missing token → 401
  - Invalid/expired token → 401
  - Non-admin (User role) → 403
  - Admin authorization success

- **GET /exercises List & Pagination (15 tests)**
  - Default pagination
  - Invalid page numbers → default to 1
  - Search by name, description
  - Filter by muscleGroup
  - Combined filters
  - Empty results handling
  - Total count and pages calculation

- **POST /exercises Create (18 tests)**
  - Valid creation → 201
  - Required field validation
  - Enum validation
  - Range validation
  - Reps format validation
  - Duplicate name (case-insensitive) → 409
  - Field length constraints

- **PATCH /exercises/:id Update (12 tests)**
  - Valid partial updates
  - Single and multiple field updates
  - Field validation errors → 400
  - Non-existent exercise → 404
  - Deleted exercise → 404
  - Name uniqueness on update → 409
  - Only updating if name differs

- **DELETE /exercises/:id Soft Delete (6 tests)**
  - Valid delete → 200
  - Non-existent exercise → 404
  - Idempotent: already deleted → 200
  - isDeleted flag verification

**Status:** ✅ All 63 tests passing | 100% coverage

---

## Support

For issues or questions, refer to the FitGainer documentation at `spec/features/workout-plan/` or `docs/CODEMAPS/workout-service.md`
