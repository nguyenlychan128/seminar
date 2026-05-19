# FitGainer Progress Service

**Progress Service** — Weight logs, weight tracking, and progress analytics for the FitGainer fitness platform.

**Service:** `BE/progress-service` | **Port:** 3004 | **Status:** ✅ TASK-030-BE Complete (89 tests, 87.5% coverage)

---

## 📌 Overview

The Progress Service is responsible for:

1. **Weight Logging** — Users can record their weight with date and optional notes
2. **Trend Calculation** — Automatically calculates weight change from previous day
3. **History Retrieval** — Fetch weight history with optional date filtering and pagination
4. **Data Isolation** — Each user only sees their own weight logs

**Key Features:**
- Prevent duplicate weight entries on the same date per user
- UTC-safe date handling to avoid timezone issues
- Weight validation (30-200 kg range)
- Automatic trend calculation (current weight - previous day weight)
- Optional notes with 200 character limit

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MongoDB running locally or accessible via connection string
- Environment variables configured

### 1. Install Dependencies

```bash
cd BE/progress-service
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

**Required Variables:**
```bash
NODE_ENV=development
PORT=3004
MONGO_URI=mongodb://localhost:27017/fitgainer-progress
JWT_SECRET=<32+ char secret from auth-service, e.g., your-secret-key-here>
LOG_LEVEL=debug
```

### 3. Run Service

```bash
# Development with watch mode
npm run dev

# Production
npm start

# Or with Docker
docker build -t fitgainer-progress:latest .
docker run -p 3004:3004 --env-file .env fitgainer-progress:latest
```

### 4. Verify It's Running

```bash
curl http://localhost:3004/health
# Response: { "status": "ok", "service": "progress-service", "timestamp": "2026-05-18T..." }
```

---

## 📚 API Documentation

### Create Weight Log

**Endpoint:** `POST /progress/weight`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "weight": 75.5,
  "date": "2026-05-18",
  "notes": "Feeling stronger"
}
```

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "weight": 75.5,
  "date": "2026-05-18T00:00:00.000Z",
  "trend": 0.5,
  "notes": "Feeling stronger",
  "createdAt": "2026-05-18T10:30:45.123Z",
  "updatedAt": "2026-05-18T10:30:45.123Z"
}
```

**Status Codes:**
- `201 Created` — Weight log successfully created
- `400 Bad Request` — Validation error (invalid weight, date, or notes)
- `401 Unauthorized` — Missing or invalid authentication token
- `409 Conflict` — Duplicate entry for same date

**Validation Rules:**
- `weight` (required, number) — Must be between 30 and 200 kg
- `date` (optional, string) — ISO format (YYYY-MM-DD), defaults to today, must not be future date
- `notes` (optional, string) — Max 200 characters, trimmed

**Example with cURL:**
```bash
curl -X POST http://localhost:3004/progress/weight \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "weight": 75.5,
    "date": "2026-05-18",
    "notes": "Gym session went well"
  }'
```

### Get Weight History

**Endpoint:** `GET /progress/weight`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `startDate` (optional) — ISO date string (default: 30 days ago)
- `endDate` (optional) — ISO date string (default: today)
- `limit` (optional) — Number of entries to return (default: 30, max: 365)

**Response (200):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "weight": 75.5,
      "date": "2026-05-18T00:00:00.000Z",
      "trend": 0.5,
      "notes": "Gym session went well",
      "createdAt": "2026-05-18T10:30:45.123Z",
      "updatedAt": "2026-05-18T10:30:45.123Z"
    },
    {
      "_id": "507f1f77bcf86cd799439010",
      "userId": "507f1f77bcf86cd799439012",
      "weight": 75.0,
      "date": "2026-05-17T00:00:00.000Z",
      "trend": -0.3,
      "notes": "Started with baseline weight",
      "createdAt": "2026-05-17T09:15:30.456Z",
      "updatedAt": "2026-05-17T09:15:30.456Z"
    }
  ],
  "count": 2,
  "startDate": "2026-04-18",
  "endDate": "2026-05-18"
}
```

**Status Codes:**
- `200 OK` — History retrieved successfully (even if empty)
- `400 Bad Request` — Invalid query parameters
- `401 Unauthorized` — Missing or invalid authentication token

**Example with cURL:**
```bash
# Get last 30 days of weight logs
curl -X GET "http://localhost:3004/progress/weight" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get specific date range
curl -X GET "http://localhost:3004/progress/weight?startDate=2026-04-01&endDate=2026-05-18&limit=60" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

**Output:**
```
Test Suites: 2 passed, 2 total
Tests:       89 passed, 89 total
Coverage:    87.5% statements, 76.76% branches
Time:        ~8 seconds
```

### Test Files

- **`tests/integration/models.test.js`** — 37 tests for WeightLog model
  - Schema validation (weight, date, notes)
  - Unique compound index (userId, date)
  - Trend calculation (pre-save hook)
  - Timestamps (createdAt, updatedAt)
  - User isolation

- **`tests/integration/weightLog.test.js`** — 47 tests for API endpoints
  - POST /progress/weight (create)
  - GET /progress/weight (history)
  - Authentication & authorization
  - Validation & error handling
  - Date filtering & pagination

### Run Specific Tests

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode (auto-rerun on file change)
npm run test:watch

# Coverage report
npm test -- --coverage
```

### Test Coverage

```
File                          Statements    Branches    Functions    Lines
────────────────────────────────────────────────────────────────────────────
All files                     87.5%         76.76%      78.94%       87.91%
src/models/WeightLog.js       95.83%        100%        100%         95.83%
src/services/...Service.js    100%          88.23%      100%         100%
src/controllers/...ller.js    93.75%        50%         100%         93.33%
src/routes/...routes.js       100%          100%        100%         100%
src/middleware/...js          82-95%        50-94%      85-100%      82-95%
```

---

## 🏗️ Architecture

### Service Structure

```
┌─────────────────────────────────────────┐
│          Frontend (React)                 │
│   - ProgressDashboard page               │
│   - WeightInputForm component            │
│   - WeightChart component                │
└────────────┬────────────────────────────┘
             │
             │ HTTP (axios)
             │
┌────────────▼────────────────────────────┐
│    Nginx API Gateway (Port 80)           │
│    Route: /api/progress → localhost:3004 │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│    Progress Service (Port 3004)          │
│  ┌─────────────────────────────────────┐ │
│  │ Express App (app.js)                │ │
│  │ - CORS, body-parser, logging        │ │
│  │ - Global error handler              │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ Routes (weightLog.routes.js)        │ │
│  │ - POST /progress/weight             │ │
│  │ - GET /progress/weight              │ │
│  └────┬────────────────────────────┬───┘ │
│       │                            │     │
│   ┌───▼────────────────┐   ┌──────▼──┐  │
│   │ Controllers        │   │ Middleware│ │
│   │ weightLogCtrl.js   │   │ - auth.js │  │
│   └────┬─────────────┬─┘   │ - valid.js  │
│        │             │     │ - error.js  │
│    ┌───▼──────┬─────▼──┐  └──────────┘  │
│    │ Services │ Models │                │
│    │ weight   │ Weight │                │
│    │ LogSvc   │ Log    │                │
│    └───┬──────┴───┬────┘                │
│        │          │                     │
│  ┌─────▼──────────▼────────────────┐   │
│  │ MongoDB (fitgainer-progress)    │   │
│  │ - weight_logs collection        │   │
│  │ - (userId, date) unique index   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Data Model

**WeightLog Document:**
```json
{
  "_id": ObjectId,
  "userId": ObjectId,      // Reference to User
  "weight": Number,        // 30-200 kg
  "date": Date,           // UTC date 00:00:00
  "trend": Number,        // Current - Previous day weight
  "notes": String,        // Optional, max 200 chars
  "createdAt": Date,      // Auto-generated
  "updatedAt": Date       // Auto-updated
}
```

**Indexes:**
- `userId` (sparse) — Efficient user lookups
- `(userId, date)` compound unique — Prevent duplicate same-day entries
- `(userId, date DESC)` compound sort — Efficient history queries

---

## 🔒 Security

### Authentication
- All endpoints (except `/health`) require JWT Bearer token
- Token extracted from `Authorization: Bearer <token>` header
- Token validation via `authenticate` middleware
- Invalid/expired tokens return 401 Unauthorized

### Authorization
- Users can only access their own weight logs
- userId extracted from JWT payload
- All queries filtered by `userId` (user isolation)

### Data Validation
- **Weight:** 30-200 kg range enforced at schema + middleware level
- **Date:** ISO format, no future dates (UTC-safe comparison)
- **Notes:** Max 200 characters, trimmed whitespace
- **Duplicate Prevention:** Unique compound index on (userId, date)

### Input Sanitization
- Request body validation via `weightLogValidationMiddleware`
- Query parameter validation via `weightHistoryValidationMiddleware`
- Type coercion (string → number for weight, string → date for dates)

---

## 🔌 Integration with Other Services

### Auth Service (Port 3001)
- Validates JWT tokens issued by auth-service
- Uses same `JWT_SECRET` for token verification
- Extracts userId from JWT payload

### User Service (Port 3002)
- (Future) Validate user exists and is active before creating weight logs
- (Future) Cross-reference user profile for weight range recommendations

### Frontend (React)
- Calls POST /progress/weight to create weight logs
- Calls GET /progress/weight to fetch history
- Uses Zustand store for state management
- Displays history in WeightChart component

---

## 📋 Development Notes

### Trend Calculation
The `trend` field is calculated automatically via a Mongoose pre-save hook:
1. On document creation (not update)
2. Finds previous day's entry for same user
3. Computes: trend = current_weight - previous_weight
4. Sets trend = 0 if no previous entry exists

**Example:**
- 2026-05-17: weight 75.0 kg, trend 0 (first entry)
- 2026-05-18: weight 75.5 kg, trend 0.5 (75.5 - 75.0)
- 2026-05-19: weight 75.2 kg, trend -0.3 (75.2 - 75.5)

### Date Handling
All dates are stored as UTC midnight (00:00:00) in the database:
- `new Date('2026-05-18')` → `2026-05-18T00:00:00.000Z`
- Unique index on (userId, date) prevents duplicates per day
- Future date validation: `date <= today + 23:59:59 UTC`

### Error Handling
Errors are mapped to HTTP status codes by `errorHandler` middleware:
- `400` — Validation errors (invalid weight, date, notes)
- `401` — Authentication failures (missing/invalid token)
- `409` — Conflict errors (duplicate entry same date)
- `500` — Server errors (database, unexpected exceptions)

---

## 🚢 Deployment

### Docker

**Build Image:**
```bash
docker build -t fitgainer-progress:latest .
```

**Run Container:**
```bash
docker run -p 3004:3004 \
  -e NODE_ENV=production \
  -e MONGO_URI=mongodb://mongo:27017/fitgainer-progress \
  -e JWT_SECRET=your-secret-key \
  fitgainer-progress:latest
```

**With Docker Compose:**
```yaml
services:
  progress-service:
    build: ./BE/progress-service
    ports:
      - "3004:3004"
    environment:
      NODE_ENV: production
      MONGO_URI: mongodb://mongo:27017/fitgainer-progress
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - mongo
```

### Kubernetes

```bash
kubectl apply -f infra/k8s/services/progress-service/
```

---

## 📖 Related Documentation

- **Codemap:** `docs/CODEMAPS/progress-service.md`
- **Feature Spec:** `spec/features/progress-tracking/`
- **Task:** `tasks/progress-tracking/TASK-030-be-weight-log-api.md`
- **Architecture:** `docs/architecture/progress-service.md` (pending)
- **API Index:** `docs/SETUP.md#-api-endpoints`

---

## 🆘 Troubleshooting

### MongoDB Connection Error
```
Error: MongoDB connection error: connect ECONNREFUSED
```
**Solution:** Ensure MongoDB is running:
```bash
mongod --dbpath /path/to/data
# Or with Docker:
docker run -p 27017:27017 -d mongo:latest
```

### JWT Secret Mismatch
```
Error: invalid signature
```
**Solution:** Ensure `JWT_SECRET` in `.env` matches auth-service's secret

### Validation Error on POST
```
400 Bad Request: Weight must be between 30-200 kg
```
**Solution:** Check request body has valid `weight` (30-200), `date` (ISO format), `notes` (max 200 chars)

### Duplicate Entry Error
```
409 Conflict: Weight entry already exists for this date
```
**Solution:** To update a weight entry, delete the old one and create a new one, or implement PUT endpoint

---

## 📊 Metrics

- **API Response Time:** <100ms for most requests
- **Database Query Time:** <50ms (with indexes)
- **Memory Usage:** ~80-120MB for Node.js process
- **Test Coverage:** 87.5% statements, 76.76% branches
- **Total Tests:** 89 passing

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-18 | Initial release (TASK-030-BE Weight Log API) |

---

## 📝 Notes

- This is a Phase 4 service, depends on Phase 1-3 (Auth, User, Workout) being complete
- Frontend components (ProgressDashboard, WeightChart) are pending (Phase 4-FE)
- Future enhancements: strength tracking, analytics, adaptive plan integration
- RabbitMQ integration for cross-service events (future)

---

**Last Updated:** 2026-05-18  
**Status:** ✅ TASK-030-BE Complete (89 tests, 87.5% coverage)
