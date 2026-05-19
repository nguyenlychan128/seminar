# Rules Spec: Workout Execution

---

## Business Rules

### BR-01: Chỉ có 1 session per user/plan/week/day/date
- Mỗi `(userId, planId, weekNumber, dayNumber, sessionDate)` chỉ có tối đa 1 document
- POST /api/workouts/sessions với session đã tồn tại → trả `409 Conflict`
- User không thể log cùng workout day hai lần

### BR-02: Session date không được trong tương lai
- `sessionDate` không được > ngày hôm nay (BR-03)
- POST /api/workouts/sessions với `sessionDate` future → trả `400` "Không thể log session trong tương lai"

### BR-03: Completed exercise phải có ≥1 set
- Nếu `status: "completed"` → phải có ít nhất 1 set với `actualReps` và `weight`
- Nếu `status: "skipped"` → `sets` array có thể rỗng

### BR-04: Set details validation
- `actualReps`: 0-100
- `weight`: 0-500
- `rpe`: 1-10 (nếu có)
- Nếu ngoài range → trả `400`

### BR-05: Denormalize exercise info
- Khi log, snapshot `name`, `muscleGroup` từ exercise data vào session
- Nếu Admin sau này sửa exercise, lịch sử session không bị ảnh hưởng

### BR-06: userId extracted from JWT only
- `userId` lấy từ JWT token, không nhận từ request body
- User không thể log session cho người khác

### BR-07: Optional fields
- `totalDuration`, `mood`, `notes` đều optional
- Default: null

---

## Validation Rules

### Session-level Validation

| Field | Rule | Error Code |
|-------|------|-----------|
| `sessionDate` | Required, date format YYYY-MM-DD, <= today | 400 |
| `planId` | Required, valid ObjectId | 400 |
| `weekNumber` | Required, positive integer | 400 |
| `dayNumber` | Required, positive integer | 400 |
| `exercises` | Required, array | 400 |
| `totalDuration` | Optional, 0-300 (minutes) | 400 |
| `mood` | Optional, enum: "great"/"good"/"ok"/"tired" | 400 |
| `notes` | Optional, max 500 characters | 400 |

### Exercise-level Validation

| Field | Rule | Error Code |
|-------|------|-----------|
| `exerciseId` | Required, valid ObjectId | 400 |
| `status` | Required, enum: "completed"/"skipped" | 400 |
| `plannedSets` | Required, positive integer | 400 |
| `plannedReps` | Required, string (VD: "8-12") | 400 |
| `sets` | Required array. If status="completed", length >= 1 | 400 |
| `notes` | Optional, max 300 characters | 400 |

### Set-level Validation

| Field | Rule | Error Code |
|-------|------|-----------|
| `setNumber` | Required, positive integer | 400 |
| `actualReps` | Required, 0-100 | 400 |
| `weight` | Required, 0-500 | 400 |
| `rpe` | Optional, 1-10 | 400 |
| `notes` | Optional, max 200 characters | 400 |

---

## Security Rules

### SR-01: User isolation
- `userId` extracted from JWT token (payload.sub or payload.userId)
- Never trust `userId` from request body
- Each user can only log sessions for themselves

### SR-02: One session per day per user
- Unique compound index prevents duplicate logging
- Returns 409 Conflict if user tries to log twice

### SR-03: Data immutability
- Denormalized exercise data (name, muscleGroup) is a snapshot
- Prevents retroactive changes to historical logs

---

## UI Rules

### UR-01: Exercise Status Toggle
- Default: "Hoàn thành" (completed)
- Toggle between "Hoàn thành" and "Bỏ qua"
- If "Bỏ qua": collapse set inputs, allow only notes
- If "Hoàn thành": show set inputs (required)

### UR-02: Set Input Validation
- Real-time validation: reps 0-100, weight 0-500
- Show error under field if out of range
- Prevent submit if validation fails

### UR-03: Session Summary
- Duration: optional, show minutes input
- Mood: optional, show selector (great/good/ok/tired)
- Notes: optional, show textarea with character counter

### UR-04: Submit Button
- Disabled while loading
- Show "Đang lưu..." text during submit
- Enable after success or error

### UR-05: Success/Error Feedback
- Success: toast message "Bài tập đã được lưu"
- Error: show alert with error message from API
- Auto-dismiss success after 3 seconds (optional)

### UR-06: Form Reset
- After success: close modal, reset form, reload parent if needed
- Allow user to log same workout again (prevent form cache issue)

---

## API Response Rules

### 201 Created
- Session successfully saved
- Return full session object with all fields

### 400 Bad Request
- Validation failed
- Return error message with specific field/reason

### 401 Unauthorized
- Missing or invalid JWT token
- Return "Unauthorized - invalid or missing token"

### 409 Conflict
- Duplicate session for (userId, planId, weekNumber, dayNumber, sessionDate)
- Return "Session already logged for this date"

### 500 Internal Server Error
- Unexpected server error
- Return generic "Internal server error"

---

## Data Retention Rules

### DR-01: Immutable logs
- Once saved, workout sessions are immutable (no updates, only reads)
- Prevents changing historical data

### DR-02: User privacy
- Each user only sees their own sessions
- No cross-user access

---

## Integration Rules

### I-01: No external dependencies in Phase 1
- Phase 1 (this task): Only log to DB, no RabbitMQ
- Phase 2+: Add event publishing, history APIs

### I-02: Workout-Service integration
- Fetch exercise details from cache/store (FE already has data from WorkoutPlanPage)
- No additional API calls needed for basic logging
