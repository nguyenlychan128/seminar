# TASK-023 — BE: WorkoutPlan Model & Plan Generator Service

## Description

Tạo Mongoose model `WorkoutPlan` với embedded schemas (Week → Day → PlanExercise) và `planGenerator` service — logic cốt lõi sinh lộ trình tự động 4 tuần dựa trên profile người dùng (gender, BMI). Đây là business logic quan trọng nhất của feature.

---

## Input

- `spec/features/workout-plan/schema.spec.md` — Collection `workoutplans`, WeekSchema, DaySchema, PlanExerciseSchema
- `spec/features/workout-plan/rules.spec.md` — BR-03 (cá nhân hóa theo gender/BMI), BR-04 (Beginner 4 tuần 3 ngày/tuần), BR-05 (Push/Pull/Legs), BR-06 (progressive overload), BR-07 (denormalize)
- `spec/features/workout-plan/feature.spec.md` — Cấu trúc lộ trình mặc định

---

## Output

```
BE/workout-service/src/
  ├── models/
  │   └── WorkoutPlan.js          # Mongoose schema với embedded Week/Day/PlanExercise
  └── services/
      └── planGenerator.js        # Service sinh lộ trình tự động

BE/workout-service/tests/
  ├── unit/
  │   └── planGenerator.test.js   # Unit tests cho generator logic
  └── integration/
      └── workoutplan.model.test.js   # Integration tests với MongoMemoryServer
```

---

## Steps

### 1. Tạo `src/models/WorkoutPlan.js`

**PlanExerciseSchema** (embedded):
- `exerciseId` — ObjectId, ref: 'Exercise', required
- `name` — String, required (denormalized)
- `muscleGroup` — String, required (denormalized)
- `sets` — Number, required, min: 1, max: 10
- `reps` — String, required (VD: "8-12", "10")
- `restSeconds` — Number, required, min: 30, max: 300
- `order` — Number, required, min: 1

**DaySchema** (embedded):
- `dayNumber` — Number, required, min: 1, max: 7
- `dayLabel` — String, required
- `scheduledDate` — Date, required
- `isRestDay` — Boolean, required, default: false
- `exercises` — [PlanExerciseSchema], default: []

**WeekSchema** (embedded):
- `weekNumber` — Number, required, min: 1
- `days` — [DaySchema], required

**WorkoutPlan schema**:
- `userId` — String, required
- `name` — String, required
- `startDate` — Date, required
- `endDate` — Date, required
- `durationWeeks` — Number, required, default: 4
- `daysPerWeek` — Number, required, default: 3
- `status` — String, required, enum: `['active', 'completed', 'cancelled']`, default: 'active'
- `weeks` — [WeekSchema], required
- `generatedFrom` — Object: `{ weight, height, bmi, gender }`, default: {}
- timestamps: true

Indexes:
- `userId`: 1
- `{ userId: 1, status: 1 }`: compound

### 2. Tạo `src/services/planGenerator.js`

Export function: `generatePlan(userProfile, exercises)`

**Input:**
- `userProfile`: `{ userId, weight, height, bmi, gender }`
- `exercises`: mảng Exercise documents từ DB

**Logic:**

**Bước 1 — Xác định volume theo BMI (BR-03):**
```
if bmi < 16:
  setsPerExercise = 2–3, repsRange = "10-15"
else (bmi 16–18.5 hoặc cao hơn):
  setsPerExercise = 3–4, repsRange = "8-12"
```

**Bước 2 — Lọc bài tập theo gender (BR-03):**
- male: ưu tiên equipment `barbell` và `dumbbell`
- female: ưu tiên equipment `bodyweight` và `dumbbell`, bỏ barbell khỏi priority

**Bước 3 — Chọn bài tập cho từng nhóm ngày (BR-05):**
- Push day (chest, shoulders, arms/triceps): chọn 3–4 bài từ exercises lọc được
- Pull day (back, arms/biceps): chọn 3–4 bài
- Legs day (legs, core): chọn 3–4 bài

Hàm helper `selectExercises(exercises, muscleGroups, count, genderPreference)`:
- Lọc exercises theo `muscleGroup` in muscleGroups và `isActive: true`
- Sort theo gender preference (equipment priority)
- Lấy `count` bài đầu tiên

**Bước 4 — Progressive overload theo tuần (BR-06):**
```
week 1: sets = 3, reps = "10"
week 2: sets = 3, reps = "10-12"
week 3: sets = 4, reps = "8-10"
week 4: sets = 4, reps = "8-12"
```

**Bước 5 — Build schedule (BR-04):**
```
startDate = today (Date object)
Schedule cho 4 tuần, mỗi tuần 7 ngày:
  Thứ 2 (dayNumber 1): Push — isRestDay: false
  Thứ 3 (dayNumber 2): Rest — isRestDay: true
  Thứ 4 (dayNumber 3): Pull — isRestDay: false
  Thứ 5 (dayNumber 4): Rest — isRestDay: true
  Thứ 6 (dayNumber 5): Legs — isRestDay: false
  Thứ 7 (dayNumber 6): Rest — isRestDay: true
  Chủ Nhật (dayNumber 7): Rest — isRestDay: true
```

Tính `scheduledDate` = startDate + offset ngày.

**Bước 6 — Build PlanExercise (BR-07 denormalize):**
Với mỗi bài tập được chọn: `{ exerciseId: ex._id, name: ex.name, muscleGroup: ex.muscleGroup, sets, reps, restSeconds: 90, order: i+1 }`

**Return value:**
```js
{
  userId,
  name: "Beginner Weight Gain Plan",
  startDate,
  endDate,   // startDate + 28 ngày
  durationWeeks: 4,
  daysPerWeek: 3,
  status: 'active',
  weeks: [...],  // 4 WeekSchema objects
  generatedFrom: { weight, height, bmi, gender }
}
```

### 3. Viết tests

**`tests/unit/planGenerator.test.js`** — mock exercises data, test:
- Generate trả về đúng cấu trúc (4 weeks, 7 days/week)
- BMI < 16 → sets = 2, reps = "10-15" ở week 1
- BMI 16–18.5 → sets = 3, reps = "10" ở week 1
- Gender male → ưu tiên barbell exercises
- Gender female → ưu tiên bodyweight/dumbbell
- Progressive overload: week 1 sets=3, week 3 sets=4
- Push day có chest exercises, Pull day có back exercises, Legs day có legs
- `endDate` = `startDate` + 28 ngày
- `generatedFrom` snapshot đúng giá trị profile

**`tests/integration/workoutplan.model.test.js`** — MongoMemoryServer:
- Tạo WorkoutPlan thành công với đủ embedded docs
- `userId` required → thiếu thì lỗi
- `status` invalid enum → lỗi
- Compound index `(userId, status)` tồn tại
- Query tìm active plan theo userId hoạt động

---

## Acceptance Criteria

- [ ] `WorkoutPlan.js` model export thành công, có đủ nested schemas
- [ ] `generatePlan(profile, exercises)` trả đúng cấu trúc 4 tuần × 7 ngày
- [ ] BMI < 16 và BMI 16-18.5 tạo ra lộ trình khác nhau (sets/reps)
- [ ] Gender male và female tạo ra exercise selection khác nhau (equipment preference)
- [ ] Week 1→4 thể hiện progressive overload (sets tăng dần)
- [ ] `npm test` xanh — planGenerator.test.js ≥ 10 tests, workoutplan.model.test.js ≥ 8 tests
- [ ] Coverage ≥ 80% cho `services/planGenerator.js` và `models/WorkoutPlan.js`

---

## Mapping

- Schema: `spec/features/workout-plan/schema.spec.md` — WorkoutPlan, WeekSchema, DaySchema, PlanExerciseSchema
- Rules: `spec/features/workout-plan/rules.spec.md` — BR-03, BR-04, BR-05, BR-06, BR-07
- API sử dụng generator: `spec/features/workout-plan/api.spec.md` — POST /plans/generate
