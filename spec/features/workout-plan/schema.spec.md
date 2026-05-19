# Schema Spec: Workout Plan

---

## Backend — MongoDB Models (`workout-service`)

### Collection: `exercises`

Thư viện bài tập — do Admin quản lý, dùng chung cho mọi lộ trình.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | MongoDB default |
| `name` | String | Yes | Unique. Tên bài tập (tiếng Anh) |
| `muscleGroup` | String | Yes | enum: `chest`, `back`, `shoulders`, `arms`, `legs`, `core` |
| `secondaryMuscles` | [String] | No | Các nhóm cơ phụ |
| `equipment` | String | Yes | enum: `barbell`, `dumbbell`, `bodyweight`, `cable`, `machine` |
| `difficulty` | String | Yes | enum: `beginner`, `intermediate`, `advanced` |
| `instructions` | String | Yes | Hướng dẫn thực hiện |
| `tips` | [String] | No | Mẹo kỹ thuật |
| `imageUrl` | String | No | URL ảnh minh họa |
| `isActive` | Boolean | Yes | default: true. Soft delete |
| `createdAt` | Date | auto | mongoose timestamps |
| `updatedAt` | Date | auto | mongoose timestamps |

**Indexes:**
- `name` — unique index
- `muscleGroup` — index (query lọc)
- `equipment` — index (query lọc)
- `difficulty` — index (query lọc)

---

### Collection: `workoutplans`

Lộ trình tập luyện của một người dùng (1 active tại một thời điểm).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | MongoDB default |
| `userId` | String | Yes | Maps to userId từ auth-service |
| `name` | String | Yes | Tên lộ trình, VD: "Beginner Weight Gain Plan" |
| `startDate` | Date | Yes | Ngày bắt đầu lộ trình |
| `endDate` | Date | Yes | Ngày kết thúc (startDate + durationWeeks * 7) |
| `durationWeeks` | Number | Yes | Số tuần, mặc định: 4 |
| `daysPerWeek` | Number | Yes | Số ngày tập/tuần, mặc định: 3 |
| `status` | String | Yes | enum: `active`, `completed`, `cancelled` |
| `weeks` | [WeekSchema] | Yes | Mảng các tuần (embedded) |
| `generatedFrom` | Object | No | Snapshot hồ sơ lúc tạo: `{ weight, height, bmi, gender }` |
| `createdAt` | Date | auto | mongoose timestamps |
| `updatedAt` | Date | auto | mongoose timestamps |

**Indexes:**
- `userId` — index (query lộ trình theo user)
- `(userId, status)` — compound index (tìm active plan)

---

### WeekSchema (embedded trong `workoutplans`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `weekNumber` | Number | Yes | 1 đến durationWeeks |
| `days` | [DaySchema] | Yes | Mảng 7 ngày (cả ngày tập lẫn ngày nghỉ) |

---

### DaySchema (embedded trong Week)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `dayNumber` | Number | Yes | 1–7 trong tuần (1 = Thứ 2) |
| `dayLabel` | String | Yes | VD: "Ngày A — Push", "Nghỉ ngơi" |
| `scheduledDate` | Date | Yes | Ngày lịch cụ thể |
| `isRestDay` | Boolean | Yes | true nếu là ngày nghỉ |
| `exercises` | [PlanExerciseSchema] | Yes | Rỗng nếu isRestDay = true |

---

### PlanExerciseSchema (embedded trong Day)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `exerciseId` | ObjectId | Yes | Ref → `exercises._id` |
| `name` | String | Yes | Denormalized — tên bài tập tại thời điểm tạo plan |
| `muscleGroup` | String | Yes | Denormalized |
| `sets` | Number | Yes | Số set, VD: 3 |
| `reps` | String | Yes | VD: "8-12" hoặc "10" |
| `restSeconds` | Number | Yes | Thời gian nghỉ giữa set (giây), VD: 90 |
| `order` | Number | Yes | Thứ tự bài tập trong ngày, bắt đầu từ 1 |

---

## Frontend — Zustand Store (`workoutStore`)

```js
// stores/workout.store.js
{
  plan: {
    planId: string | null,
    name: string | null,
    startDate: string | null,
    endDate: string | null,
    durationWeeks: number | null,
    daysPerWeek: number | null,
    status: 'active' | 'completed' | 'cancelled' | null,
    weeks: Week[] | null,
  } | null,
  todayWorkout: {
    isRestDay: boolean,
    dayLabel: string | null,
    exercises: PlanExercise[],
  } | null,
  isLoading: boolean,
  error: string | null,
}
```

**Actions:**
- `fetchMyPlan()` — GET /api/workouts/plans/my
- `generatePlan()` — POST /api/workouts/plans/generate
- `fetchWeek(weekNumber)` — GET /api/workouts/plans/my/week/:weekNumber
- `fetchTodayWorkout()` — GET /api/workouts/plans/my/today
- `clearPlan()` — reset store (khi logout)

---

## Frontend — Component Structure

```
pages/workout/
  ├── WorkoutPlanPage.jsx      # Trang chính: tổng quan lộ trình + chọn tuần
  └── WorkoutDayPage.jsx       # Chi tiết bài tập một ngày

components/workout/
  ├── WeekCalendar.jsx         # Lịch tuần: hiển thị 7 ngày, đánh dấu ngày tập / nghỉ
  ├── DayCard.jsx              # Card một ngày: tên ngày, danh sách bài tập rút gọn
  ├── ExerciseCard.jsx         # Card một bài tập: tên, sets×reps, thời gian nghỉ, nhóm cơ
  └── PlanSummaryCard.jsx      # Tổng quan lộ trình: tên, thời gian, số ngày/tuần
```
