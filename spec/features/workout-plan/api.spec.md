# API Spec: Workout Plan

Base path: `/api/workouts` (qua Nginx gateway → workout-service port 3003)

Tất cả endpoint yêu cầu header: `Authorization: Bearer <access_token>`

---

## Exercise Library (Thư viện bài tập)

### GET /api/workouts/exercises

Lấy danh sách tất cả bài tập trong thư viện.

**Auth:** Required (User, Admin)

**Query params (optional):**
- `muscleGroup` — lọc theo nhóm cơ: `chest`, `back`, `shoulders`, `arms`, `legs`, `core`
- `equipment` — lọc theo dụng cụ: `barbell`, `dumbbell`, `bodyweight`, `cable`, `machine`
- `difficulty` — lọc theo độ khó: `beginner`, `intermediate`, `advanced`

**Response 200:**
```json
{
  "exercises": [
    {
      "id": "string",
      "name": "Bench Press",
      "muscleGroup": "chest",
      "secondaryMuscles": ["triceps", "shoulders"],
      "equipment": "barbell",
      "difficulty": "beginner",
      "instructions": "Nằm ngửa trên ghế...",
      "imageUrl": "string | null"
    }
  ],
  "total": 30
}
```

---

### GET /api/workouts/exercises/:exerciseId

Lấy chi tiết một bài tập.

**Auth:** Required (User, Admin)

**Response 200:**
```json
{
  "id": "string",
  "name": "Bench Press",
  "muscleGroup": "chest",
  "secondaryMuscles": ["triceps", "shoulders"],
  "equipment": "barbell",
  "difficulty": "beginner",
  "instructions": "Nằm ngửa trên ghế, tay rộng hơn vai...",
  "tips": ["Giữ lưng thẳng", "Không bật ngực"],
  "imageUrl": "string | null"
}
```

**Response 404:** Bài tập không tồn tại

---

### POST /api/workouts/exercises

Tạo bài tập mới (Admin only).

**Auth:** Required (Admin)

**Request Body:**
```json
{
  "name": "Bench Press",
  "muscleGroup": "chest",
  "secondaryMuscles": ["triceps", "shoulders"],
  "equipment": "barbell",
  "difficulty": "beginner",
  "instructions": "Nằm ngửa trên ghế...",
  "tips": ["Giữ lưng thẳng"]
}
```

**Response 201:** Trả về exercise vừa tạo

**Response 400:** Validation lỗi (thiếu field bắt buộc)

**Response 409:** Tên bài tập đã tồn tại

---

### PUT /api/workouts/exercises/:exerciseId

Cập nhật bài tập (Admin only).

**Auth:** Required (Admin)

**Request Body:** Tất cả fields optional (partial update)

**Response 200:** Trả về exercise đã cập nhật

**Response 404:** Bài tập không tồn tại

---

### DELETE /api/workouts/exercises/:exerciseId

Xóa bài tập (Admin only).

**Auth:** Required (Admin)

**Response 200:** `{ "success": true, "message": "Exercise deleted" }`

**Response 404:** Bài tập không tồn tại

**Response 409:** Bài tập đang được dùng trong một lộ trình active — không thể xóa

---

## Workout Plan (Lộ trình tập luyện)

### GET /api/workouts/plans/my

Lấy lộ trình active hiện tại của người dùng.

**Auth:** Required (User)

**Response 200:**
```json
{
  "planId": "string",
  "userId": "string",
  "name": "Beginner Weight Gain Plan",
  "startDate": "2026-05-18",
  "endDate": "2026-06-14",
  "durationWeeks": 4,
  "daysPerWeek": 3,
  "status": "active",
  "weeks": [
    {
      "weekNumber": 1,
      "days": [
        {
          "dayNumber": 1,
          "dayLabel": "Ngày A — Push",
          "scheduledDate": "2026-05-19",
          "exercises": [
            {
              "exerciseId": "string",
              "name": "Bench Press",
              "muscleGroup": "chest",
              "sets": 3,
              "reps": "8-12",
              "restSeconds": 90,
              "order": 1
            }
          ]
        }
      ]
    }
  ],
  "createdAt": "2026-05-18T10:00:00Z"
}
```

**Response 404:** Người dùng chưa có lộ trình — cần gọi POST /generate

---

### POST /api/workouts/plans/generate

Tạo lộ trình mới tự động dựa trên hồ sơ người dùng.

**Auth:** Required (User)

**Request Body:** Không cần (workout-service tự lấy profile từ user-service bằng JWT)

**Response 201:**
```json
{
  "planId": "string",
  "name": "Beginner Weight Gain Plan",
  "durationWeeks": 4,
  "daysPerWeek": 3,
  "startDate": "2026-05-18",
  "endDate": "2026-06-14",
  "status": "active"
}
```

**Response 400:** Người dùng chưa có hồ sơ cơ thể (cần tạo profile trước)

**Response 409:** Người dùng đã có lộ trình active — không thể tạo thêm

---

### GET /api/workouts/plans/my/week/:weekNumber

Lấy chi tiết một tuần trong lộ trình.

**Auth:** Required (User)

**Params:** `weekNumber` — 1 đến 4

**Response 200:**
```json
{
  "planId": "string",
  "weekNumber": 1,
  "days": [
    {
      "dayNumber": 1,
      "dayLabel": "Ngày A — Push",
      "scheduledDate": "2026-05-19",
      "isRestDay": false,
      "exercises": [
        {
          "exerciseId": "string",
          "name": "Bench Press",
          "muscleGroup": "chest",
          "equipment": "barbell",
          "sets": 3,
          "reps": "8-12",
          "restSeconds": 90,
          "instructions": "Nằm ngửa...",
          "order": 1
        }
      ]
    },
    {
      "dayNumber": 2,
      "dayLabel": "Nghỉ ngơi",
      "scheduledDate": "2026-05-20",
      "isRestDay": true,
      "exercises": []
    }
  ]
}
```

**Response 400:** weekNumber ngoài phạm vi (< 1 hoặc > durationWeeks)

**Response 404:** Người dùng chưa có lộ trình

---

### GET /api/workouts/plans/my/today

Lấy bài tập của ngày hôm nay (dùng để workout execution biết hôm nay tập gì).

**Auth:** Required (User)

**Response 200:**
```json
{
  "planId": "string",
  "today": "2026-05-19",
  "isRestDay": false,
  "dayLabel": "Ngày A — Push",
  "exercises": [
    {
      "exerciseId": "string",
      "name": "Bench Press",
      "muscleGroup": "chest",
      "sets": 3,
      "reps": "8-12",
      "restSeconds": 90,
      "order": 1
    }
  ]
}
```

**Response 200 (nghỉ):**
```json
{
  "planId": "string",
  "today": "2026-05-20",
  "isRestDay": true,
  "dayLabel": "Nghỉ ngơi",
  "exercises": []
}
```

**Response 404:** Người dùng chưa có lộ trình

---

## FE Integration Points

| Tình huống | Hành động |
|---|---|
| Sau login + có profile, chưa có plan | Gọi POST /plans/generate tự động hoặc hiển thị nút "Tạo lộ trình" |
| Sau login + có profile, đã có plan | Load GET /plans/my, hiển thị tổng quan lộ trình |
| Chưa có profile (404 từ user-service) | Redirect `/profile/setup` — không tạo lộ trình được |
| Xem tuần | GET /plans/my/week/:weekNumber |
| Xem hôm nay | GET /plans/my/today (dùng ở Dashboard) |
| Admin quản lý bài tập | CRUD /exercises với Admin JWT |
