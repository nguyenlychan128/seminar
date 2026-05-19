# TASK-025 — BE: Workout Plan API (Generate & View Endpoints)

## Description

Implement 4 REST endpoints cho lộ trình tập luyện: GET lộ trình active, POST generate lộ trình mới, GET chi tiết tuần, GET bài tập hôm nay. Service này cần gọi user-service để lấy profile trước khi generate và áp dụng business rules BR-01 (1 active plan), BR-02 (phải có profile).

---

## Input

- `spec/features/workout-plan/api.spec.md` — 4 plan endpoints: GET /plans/my, POST /plans/generate, GET /plans/my/week/:weekNumber, GET /plans/my/today
- `spec/features/workout-plan/rules.spec.md` — BR-01, BR-02, SR-01 (userId từ JWT), SR-03 (gọi user-service)
- `BE/workout-service/src/models/WorkoutPlan.js` — từ TASK-023
- `BE/workout-service/src/services/planGenerator.js` — từ TASK-023
- `BE/workout-service/src/config/userServiceClient.js` — từ TASK-021

---

## Output

```
BE/workout-service/src/
  ├── services/
  │   └── planService.js          # Business logic: generate, fetch, query today
  ├── controllers/
  │   └── plan.controller.js      # 4 handler functions
  └── routes/
      └── plan.routes.js          # Route definitions

BE/workout-service/tests/
  └── integration/
      └── plan.api.test.js        # API integration tests với Supertest + MongoMemoryServer
```

---

## Steps

### 1. Tạo `src/services/planService.js`

**`getActivePlan(userId)`**:
- Query `WorkoutPlan.findOne({ userId, status: 'active' })`
- Return: plan document hoặc null

**`generateNewPlan(userId, accessToken)`**:
- Gọi `userServiceClient.getUserProfile(accessToken)` để lấy profile
- Nếu user-service trả lỗi 404 → throw error `{ status: 400, message: 'Vui lòng tạo hồ sơ cơ thể trước' }`
- Kiểm tra `getActivePlan(userId)` — nếu đã có → throw error `{ status: 409, message: 'Đã có lộ trình đang active' }` (BR-01)
- Lấy tất cả exercises từ DB có `isActive: true`
- Kiểm tra đủ bài tập: mỗi muscleGroup cần ≥ 5 bài → thiếu thì throw `{ status: 500 }`
- Gọi `planGenerator.generatePlan(profile, exercises)`
- Lưu vào DB: `new WorkoutPlan(planData).save()`
- Return: `{ planId, name, durationWeeks, daysPerWeek, startDate, endDate, status }`

**`getWeekDetail(userId, weekNumber)`**:
- Lấy active plan của user
- Nếu không có → throw `{ status: 404, message: 'Chưa có lộ trình' }`
- Validate weekNumber: 1 ≤ weekNumber ≤ plan.durationWeeks → nếu sai → throw `{ status: 400 }`
- Tìm week trong `plan.weeks` theo `weekNumber`
- Return: `{ planId, weekNumber, days: [...] }`

**`getTodayWorkout(userId)`**:
- Lấy active plan của user
- Nếu không có → throw `{ status: 404 }`
- Lấy ngày hôm nay theo UTC, so sánh với `scheduledDate` của từng day trong tất cả weeks
- Nếu tìm thấy ngày khớp → return day data
- Nếu không khớp ngày nào (ngoài chu kỳ lộ trình) → return rest day response
- Return: `{ planId, today, isRestDay, dayLabel, exercises }`

### 2. Tạo `src/controllers/plan.controller.js`

**`getMyPlan(req, res)`** — GET /plans/my:
- `userId` từ `req.user.userId` (JWT)
- Gọi `planService.getActivePlan(userId)`
- 404 nếu không tìm thấy
- Return 200 với full plan (incl. weeks)

**`generatePlan(req, res)`** — POST /plans/generate:
- `userId` từ JWT, `accessToken` từ header Authorization
- Gọi `planService.generateNewPlan(userId, accessToken)`
- Xử lý lỗi từ service: 400, 409, 500
- Return 201 với summary (planId, name, dates, status)

**`getWeek(req, res)`** — GET /plans/my/week/:weekNumber:
- Parse `weekNumber = parseInt(req.params.weekNumber)`
- Gọi `planService.getWeekDetail(userId, weekNumber)`
- Xử lý lỗi: 400 (invalid weekNumber), 404 (no plan)
- Return 200 với week data

**`getTodayWorkout(req, res)`** — GET /plans/my/today:
- Gọi `planService.getTodayWorkout(userId)`
- 404 nếu không có plan
- Return 200 (kể cả ngày nghỉ — không phải 404)

### 3. Cập nhật `src/routes/plan.routes.js`

```
GET  /my                     → authenticate, getMyPlan
POST /generate               → authenticate, generatePlan
GET  /my/week/:weekNumber    → authenticate, getWeek
GET  /my/today               → authenticate, getTodayWorkout
```

### 4. Viết `tests/integration/plan.api.test.js`

Mock `userServiceClient.getUserProfile` để không cần user-service thật. Dùng MongoMemoryServer + seed exercises từ TASK-022.

Test cases cần cover:
- GET /my chưa có plan → 404
- POST /generate với userServiceClient mock trả profile hợp lệ → 201, plan được lưu vào DB
- POST /generate gọi lại khi đã có active plan → 409
- POST /generate khi userServiceClient trả 404 → 400
- GET /my sau khi generate → 200, trả plan với 4 weeks × 7 days
- GET /my/week/1 → 200, trả 7 ngày của tuần 1
- GET /my/week/0 → 400 (invalid weekNumber)
- GET /my/week/5 → 400 (vượt durationWeeks)
- GET /my/today → 200 với exercises hoặc isRestDay: true
- GET /my, /my/week/:n, /my/today không có token → 401
- userId từ JWT đúng — không thể xem plan của user khác (test isolation)

---

## Acceptance Criteria

- [ ] `POST /plans/generate` gọi user-service để lấy profile (mock verify được)
- [ ] `POST /plans/generate` trả 409 nếu đã có active plan
- [ ] `POST /plans/generate` trả 400 nếu chưa có profile
- [ ] `GET /plans/my` trả full plan với nested weeks/days/exercises
- [ ] `GET /plans/my/week/:weekNumber` validate range và trả đúng tuần
- [ ] `GET /plans/my/today` luôn trả 200 (rest day hoặc workout day)
- [ ] `userId` luôn lấy từ JWT, không từ request body
- [ ] `npm test` xanh — plan.api.test.js ≥ 12 tests
- [ ] Coverage ≥ 80% cho `services/planService.js` và `controllers/plan.controller.js`

---

## Mapping

- API: `spec/features/workout-plan/api.spec.md` — Workout Plan endpoints
- Rules: `spec/features/workout-plan/rules.spec.md` — BR-01, BR-02, SR-01, SR-03
- Schema: `spec/features/workout-plan/schema.spec.md` — Collection `workoutplans`
- Depends on: TASK-021 (scaffold + userServiceClient), TASK-022 (Exercise model + seed), TASK-023 (WorkoutPlan model + planGenerator)
