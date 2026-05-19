# Feature Spec: Workout Execution (Thực hiện bài tập)

## 📋 Tóm tắt

**Workout Execution** là tính năng cho phép người dùng thực hiện bài tập theo lộ trình và ghi lại kết quả thực tế (số reps, trọng lượng, RPE, cảm nhận). Dữ liệu được lưu để theo dõi tiến trình tập luyện.

**Service phụ trách:** `workout-service` (port 3003)  
**Frontend:** Tích hợp vào `WorkoutDayPage` (/workout/day/:weekNumber/:dayNumber)  
**Backend phụ trách lưu lịch sử:** `progress-service` (port 3004) — deferred to future phase

---

## 🎯 User Stories

| ID | Story |
|----|-------|
| WE-01 | Là một người dùng, tôi muốn xem bài tập cần thực hiện trong ngày hôm nay khi mở WorkoutDayPage |
| WE-02 | Là một người dùng, tôi muốn bấm "Start Workout" để mở form nhập kết quả tập luyện |
| WE-03 | Là một người dùng, tôi muốn ghi lại kết quả từng set (reps, weight, RPE, notes) |
| WE-04 | Là một người dùng, tôi muốn đánh dấu bài tập là "hoàn thành" hoặc "bỏ qua" |
| WE-05 | Là một người dùng, tôi muốn nhập cảm nhận chung và ghi chú chung cho buổi tập |

---

## 🏗️ Architecture

### Kiến trúc dự kiến

```
WorkoutDayPage (/workout/day/:weekNumber/:dayNumber)
├── Shows exercises for the day (từ workout store)
├── "Start Workout" button → mở modal/inline form
│   └── WorkoutExecutionForm
│       ├── ExerciseCard (cho mỗi bài tập)
│       │   ├── Status toggle (completed/skipped)
│       │   ├── Set inputs (reps, weight, RPE, notes) — nếu completed
│       │   └── Exercise notes
│       ├── Session summary
│       │   ├── Total duration input
│       │   ├── Mood selector
│       │   └── Session notes
│       └── Submit button → gửi POST request

API Flow:
User click "Start Workout"
  ↓
Show execution form (dữ liệu lấy từ workout store sẵn)
  ↓
User fills form
  ↓
POST /api/workouts/sessions (workout-service)
  ↓
Lưu session vào MongoDB (progress DB)
  ↓
Show success message
```

### Phân tích trách nhiệm

| Component | Trách nhiệm |
|-----------|-----------|
| **WorkoutDayPage (FE)** | Hiển thị exercises, nút "Start Workout", form modal |
| **WorkoutExecutionForm (FE)** | Form nhập kết quả, validation, submit |
| **Workout-Service (BE)** | Endpoint POST /api/workouts/sessions để lưu session |
| **Progress-Service (BE)** | Deferred - sẽ xử lý lịch sử, stats ở phase sau |

---

## 📊 Data Model

### Dữ liệu gửi từ FE lên BE (POST body)

```javascript
{
  planId: string,              // ObjectId của workout plan
  weekNumber: number,          // 1, 2, 3...
  dayNumber: number,           // 1, 2, 3...
  sessionDate: string,         // "2026-05-18" (YYYY-MM-DD)
  exercises: [
    {
      exerciseId: string,      // ObjectId của exercise
      name: string,            // "Bench Press" (denormalized)
      muscleGroup: string,     // "chest" (denormalized)
      status: "completed" | "skipped",
      plannedSets: number,     // 3
      plannedReps: string,     // "8-12"
      sets: [                  // chỉ có nếu status = "completed"
        {
          setNumber: number,
          actualReps: number,  // 0-100
          weight: number,      // 0-500 (kg)
          rpe: number | null,  // 1-10 (optional)
          notes: string        // (optional, max 200 chars)
        }
      ],
      notes: string            // (optional, max 300 chars)
    }
  ],
  totalDuration: number | null,  // minutes (0-300)
  mood: "great" | "good" | "ok" | "tired" | null,
  notes: string | null           // (optional, max 500 chars)
}
```

### MongoDB Collection: `workoutsessions`

```javascript
{
  _id: ObjectId,
  userId: string,              // extracted from JWT
  planId: ObjectId,
  weekNumber: number,
  dayNumber: number,
  sessionDate: Date,           // YYYY-MM-DD at midnight UTC
  exercises: [
    {
      exerciseId: ObjectId,
      name: string,            // denormalized
      muscleGroup: string,     // denormalized
      status: "completed" | "skipped",
      plannedSets: number,
      plannedReps: string,
      sets: [
        {
          setNumber: number,
          actualReps: number,
          weight: number,
          rpe: number | null,
          notes: string
        }
      ],
      notes: string
    }
  ],
  totalDuration: number | null,
  mood: string | null,
  notes: string | null,
  completedAt: Date,          // when user clicked submit
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 Workflows

### Workflow 1: Thực hiện bài tập hôm nay

1. User truy cập `/workout/day/1/1` (WorkoutDayPage)
2. Page hiển thị:
   - Day label (VD: "Ngày A — Push")
   - Danh sách exercises với chi tiết (sets, reps, instructions)
   - Nút "Start Workout"
3. User bấm "Start Workout"
4. Mở modal/form với:
   - Các exercise cards (có toggle completed/skipped, set inputs)
   - Session summary fields (duration, mood, notes)
   - Submit button
5. User điền kết quả từng set
6. User chọn mood, nhập duration, notes (optional)
7. User bấm "Lưu"
8. POST /api/workouts/sessions với dữ liệu form
9. BE validates, saves to DB
10. FE shows success toast "Bài tập đã được lưu"
11. Close modal, reset form (optional)

### Workflow 2: Tương tác form

- **Toggle exercise status**: Click "Hoàn thành" / "Bỏ qua"
  - Nếu "Bỏ qua" → ẩn set inputs, cho phép nhập notes bài tập
  - Nếu "Hoàn thành" → hiển thị set inputs bắt buộc

- **Input set data**: Reps, weight, RPE, notes
  - Validation real-time (reps 0-100, weight 0-500)
  - Optional: last set hint (nếu có data từ session trước)

- **Session summary**: Duration, mood, notes
  - Tất cả optional

---

## 📋 Acceptance Criteria

### Backend

- [ ] Endpoint POST /api/workouts/sessions tồn tại
- [ ] Validates `sessionDate` không trong tương lai (BR-03)
- [ ] Validates `actualReps` (0-100), `weight` (0-500) (BR-04)
- [ ] Validates completed exercise phải có ≥1 set (BR-05)
- [ ] Denormalize exercise `name`, `muscleGroup`, `equipment` vào session (BR-06)
- [ ] userId extracted từ JWT, không nhận từ body (SR-01)
- [ ] One session per (userId, planId, weekNumber, dayNumber, sessionDate) (BR-01)
- [ ] Return 201 with saved session data on success
- [ ] Return 400 on validation errors
- [ ] Return 409 if duplicate session
- [ ] Return 401 if not authenticated

### Frontend

- [ ] WorkoutDayPage có nút "Start Workout" (not disabled)
- [ ] Click "Start Workout" → mở form execution
- [ ] Form shows exercises từ day data
- [ ] Toggle completed/skipped works
- [ ] Set inputs (reps, weight, RPE) editable
- [ ] Inline validation: reps 0-100, weight 0-500
- [ ] Duration, mood, notes inputs functional
- [ ] Submit button sends correct POST payload
- [ ] Loading state while submitting
- [ ] Success message after save
- [ ] Error message on API failure
- [ ] Form closes/resets after success

---

## ⚙️ Implementation Phase

### Phase 1: Core (TASK-029)
- FE: "Start Workout" button → WorkoutExecutionForm component
- FE: Form UI, state management, validation
- BE: POST /api/workouts/sessions endpoint
- BE: Validation, denormalization, save to DB
- Tests: E2E + unit

### Phase 2+: Future (deferred)
- Progress-Service integration (lịch sử, stats)
- RabbitMQ event publishing
- History/Stats APIs
- Last session hints (optimization)

---

## 📝 Notes

- **WorkoutExecutionForm có thể inline trong WorkoutDayPage hoặc modal riêng** — UX decision
- **No history API in this phase** — lưu DB chỉ để prepare cho phase sau
- **No RabbitMQ events in this phase** — sẽ thêm ở phase sau
- **TailwindCSS only** — no separate CSS files
- **Validation** — basic checks only (type, range, required fields)

---

**Document version:** 1.0  
**Created:** 2026-05-18  
**Status:** Ready for task breakdown
