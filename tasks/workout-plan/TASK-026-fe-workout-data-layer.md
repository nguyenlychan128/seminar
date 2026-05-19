# TASK-026 — FE: Workout Plan Data Layer (Store, Service, Hook)

## Description

Tạo lớp data layer cho feature workout-plan phía frontend: Axios service gọi các endpoint của `workout-service`, Zustand store quản lý state lộ trình, và custom hook bao gói logic. Đây là nền tảng cho tất cả component UI của feature workout. Dùng MSW để mock API trong tests.

---

## Input

- `spec/features/workout-plan/schema.spec.md` — Zustand store shape (`workoutStore`), actions
- `spec/features/workout-plan/api.spec.md` — 4 plan endpoints + FE integration points
- Pattern từ `FE/src/stores/user.store.js` và `FE/src/services/user.service.js` (reference)
- `FE/src/services/api.js` — Axios instance hiện có (với auth interceptor)

---

## Output

```
FE/src/
  ├── services/
  │   └── workout.service.js      # Axios calls tới /api/workouts
  ├── stores/
  │   └── workout.store.js        # Zustand store: plan state + actions
  └── hooks/
      └── useWorkoutPlan.js       # Custom hook bao gói store actions

FE/src/tests/
  ├── services/
  │   └── workout.service.test.js
  ├── stores/
  │   └── workout.store.test.js
  └── hooks/
      └── useWorkoutPlan.test.js
```

---

## Steps

### 1. Service: `workout.service.js`

Dùng Axios instance hiện có (`api.js`) — token tự động được attach qua interceptor.

Functions:
- `getMyPlan()` → GET `/api/workouts/plans/my` → trả plan object hoặc throw
- `generatePlan()` → POST `/api/workouts/plans/generate` → trả plan summary hoặc throw
- `getWeek(weekNumber)` → GET `/api/workouts/plans/my/week/${weekNumber}` → trả week data
- `getTodayWorkout()` → GET `/api/workouts/plans/my/today` → trả today data

Error handling thống nhất — map HTTP status codes → error messages tiếng Anh (UI dùng tiếng Anh):
- 404 → "No workout plan found"
- 409 → "Active plan already exists"
- 400 → message từ server hoặc "Invalid request"
- 401 → "Session expired"
- 500 → "Failed to generate plan, please try again"

### 2. Store: `workout.store.js` (Zustand)

State shape (theo schema.spec.md):
```js
{
  plan: null,           // full plan object hoặc null
  todayWorkout: null,   // { isRestDay, dayLabel, exercises } hoặc null
  isLoading: false,
  error: null,
}
```

Actions:
- `fetchMyPlan()` — gọi service.getMyPlan(); set plan; handle 404 → set plan = null (không throw)
- `generatePlan()` — gọi service.generatePlan(); sau khi thành công gọi fetchMyPlan() để load full plan
- `fetchWeek(weekNumber)` — gọi service.getWeek(); merge week data vào `plan.weeks[weekNumber-1]`
- `fetchTodayWorkout()` — gọi service.getTodayWorkout(); set todayWorkout
- `clearPlan()` — reset toàn bộ state về initial (gọi khi logout)

Tất cả actions set `isLoading = true` trước khi call, `isLoading = false` sau khi xong (success hoặc error).

### 3. Hook: `useWorkoutPlan.js`

```js
const {
  plan, todayWorkout, isLoading, error,
  fetchMyPlan, generatePlan, fetchWeek, fetchTodayWorkout, clearPlan,
  // computed
  hasActivePlan,      // boolean: plan !== null && plan.status === 'active'
  currentWeekNumber,  // tính từ plan.startDate và ngày hôm nay (1–4)
} = useWorkoutPlan()
```

`currentWeekNumber` logic:
```js
const daysSinceStart = Math.floor((Date.now() - new Date(plan.startDate)) / 86400000)
const weekNum = Math.min(Math.floor(daysSinceStart / 7) + 1, plan.durationWeeks)
return weekNum
```

Tích hợp với auth store: `clearPlan()` được gọi tự động khi user logout (subscribe vào authStore).

### 4. Cập nhật Nginx / Vite proxy

Thêm proxy rule trong `FE/vite.config.js` (hoặc confirm Nginx đã có):
- `/api/workouts` → `http://localhost:3003` (workout-service)
- Pattern tương tự `/api/users` → `http://localhost:3002`

### 5. MSW Handlers

Tạo `FE/src/tests/mocks/workout.handlers.js` với MSW handlers cho:
- `GET /api/workouts/plans/my` → mock response hoặc 404
- `POST /api/workouts/plans/generate` → mock 201 response
- `GET /api/workouts/plans/my/week/1` → mock week data
- `GET /api/workouts/plans/my/today` → mock today data (rest day và workout day variants)

### 6. Viết tests

**`workout.service.test.js`** (MSW):
- `getMyPlan()` trả plan khi 200
- `getMyPlan()` throw error "No workout plan found" khi 404
- `generatePlan()` trả summary khi 201
- `generatePlan()` throw "Active plan already exists" khi 409
- `getWeek(1)` trả week data khi 200
- `getTodayWorkout()` trả isRestDay: true khi nghỉ

**`workout.store.test.js`**:
- `fetchMyPlan()` set plan khi success
- `fetchMyPlan()` set plan = null (không throw) khi 404
- `generatePlan()` gọi fetchMyPlan() sau khi success
- `clearPlan()` reset state về initial
- `isLoading` đúng lifecycle (true → false)

**`useWorkoutPlan.test.js`** (renderHook + MSW):
- `hasActivePlan` = false khi plan null
- `hasActivePlan` = true khi plan.status = 'active'
- `currentWeekNumber` = 1 khi startDate = hôm nay
- `currentWeekNumber` = 2 khi startDate = 8 ngày trước

---

## Acceptance Criteria

- [ ] `workout.service.js` export đủ 4 functions
- [ ] `workout.store.js` có đủ 5 actions và state shape đúng spec
- [ ] `useWorkoutPlan` trả `hasActivePlan` và `currentWeekNumber` computed đúng
- [ ] `clearPlan()` được wire vào logout flow của authStore
- [ ] Vite proxy `/api/workouts` hoạt động (hoặc Nginx config xác nhận)
- [ ] `npm test` xanh — ≥ 15 tests tổng cộng cho 3 files
- [ ] Coverage ≥ 80% cho service, store, hook

---

## Mapping

- Schema: `spec/features/workout-plan/schema.spec.md` — Frontend Zustand Store
- API: `spec/features/workout-plan/api.spec.md` — 4 Plan endpoints + FE Integration Points
- Rules: `spec/features/workout-plan/rules.spec.md` — UR-06 (redirect nếu không có profile)
- Depends on: TASK-025 (BE plan API up), TASK-018 pattern (user store/service reference)
