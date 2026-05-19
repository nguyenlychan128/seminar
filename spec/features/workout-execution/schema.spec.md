# Schema Spec: Workout Execution

---

## Backend — MongoDB Collection: `workoutsessions`

Ghi lại kết quả tập luyện của người dùng cho từng buổi tập.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | MongoDB default |
| `userId` | String | Yes | Maps to userId từ auth-service (extracted from JWT) |
| `planId` | ObjectId | Yes | Ref → workoutplans._id |
| `weekNumber` | Number | Yes | 1, 2, 3, ... |
| `dayNumber` | Number | Yes | 1, 2, 3, ... |
| `sessionDate` | Date | Yes | Ngày tập (format: YYYY-MM-DD at 00:00:00 UTC) |
| `exercises` | [ExerciseSessionSchema] | Yes | Mảng kết quả của từng bài tập |
| `totalDuration` | Number | No | Tổng thời gian tập (phút), range: 0-300 |
| `mood` | String | No | enum: "great", "good", "ok", "tired" |
| `notes` | String | No | Ghi chú chung về session (max 500 ký tự) |
| `completedAt` | Date | No | Thời gian user nhấn submit |
| `createdAt` | Date | auto | mongoose timestamps |
| `updatedAt` | Date | auto | mongoose timestamps |

**Indexes:**
- `{ userId: 1 }` — query session theo user
- `{ userId: 1, planId: 1, weekNumber: 1, dayNumber: 1, sessionDate: 1 }` — unique (1 session per user/plan/week/day/date)
- `{ sessionDate: 1 }` — filter theo ngày

---

## ExerciseSessionSchema (embedded)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `exerciseId` | ObjectId | Yes | Ref → exercises._id (từ workout-service) |
| `name` | String | Yes | Denormalized: tên bài tập tại lúc log |
| `muscleGroup` | String | Yes | Denormalized: nhóm cơ chính (chest, back, legs, etc.) |
| `status` | String | Yes | enum: "completed", "skipped" |
| `plannedSets` | Number | Yes | Số set lên kế hoạch (VD: 3) |
| `plannedReps` | String | Yes | VD: "8-12", "10" |
| `sets` | [SetResultSchema] | Yes | Mảng kết quả từng set (rỗng nếu skipped) |
| `notes` | String | No | Ghi chú riêng bài tập (max 300 ký tự) |

---

## SetResultSchema (embedded)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `setNumber` | Number | Yes | 1, 2, 3, ... |
| `actualReps` | Number | Yes | Số reps thực tế: 0-100 |
| `weight` | Number | Yes | Trọng lượng (kg hoặc lbs): 0-500 |
| `rpe` | Number | No | Rate of Perceived Exertion: 1–10 (optional) |
| `notes` | String | No | Ghi chú set này (max 200 ký tự) |

---

## Frontend — Component State

### WorkoutExecutionForm State

```javascript
{
  // Form inputs
  formData: {
    exercises: [
      {
        exerciseId: string,
        status: "completed" | "skipped",
        sets: [
          { setNumber: number, actualReps: number, weight: number, rpe: number | null, notes: string }
        ],
        notes: string
      }
    ],
    totalDuration: number | null,
    mood: "great" | "good" | "ok" | "tired" | null,
    notes: string
  },

  // UI state
  isLoading: boolean,
  error: string | null,
  successMessage: string | null
}
```

### Per-Exercise State (ExerciseCard component)

```javascript
{
  status: "completed" | "skipped",  // toggle state
  sets: [
    { setNumber: number, actualReps: number, weight: number, rpe: number | null, notes: string }
  ]
}
```

---

## Validation Rules

### Exercise Session (per exercise)

| Field | Rule |
|-------|------|
| `actualReps` | Required (nếu completed), number >= 0, <= 100 |
| `weight` | Required (nếu completed), number >= 0, <= 500 |
| `rpe` | Optional, number 1–10 |
| `notes` | Optional, string, max 200 ký tự |

### Session (overall)

| Field | Rule |
|-------|------|
| `sessionDate` | Required, date, <= today (BR-03) |
| `exercises` | Required, array, >= 0 items |
| `totalDuration` | Optional, number >= 0, <= 300 |
| `mood` | Optional, enum: "great", "good", "ok", "tired" |
| `notes` | Optional, string, max 500 ký tự |

### Business Rules Enforced

| Rule | Validation |
|------|-----------|
| BR-01: 1 session per (userId, planId, weekNumber, dayNumber, sessionDate) | Unique compound index |
| BR-03: Cannot log future session | Pre-save hook checks `sessionDate <= today` |
| BR-04: Set must have actualReps and weight | Schema `required: true` |
| BR-05: Completed exercise must have ≥1 set | Pre-save hook checks |
| BR-06: Denormalize exercise name, muscleGroup | Saving logic denormalizes |
| SR-01: userId from JWT only | Controller extracts from token |

---

## Pre-Save Hooks

```javascript
// 1. Validate sessionDate not in future
// 2. Validate completed exercises have ≥1 set
// 3. Validate actualReps (0-100) and weight (0-500) for all sets
// 4. Set completedAt timestamp
```
