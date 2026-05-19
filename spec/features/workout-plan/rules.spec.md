# Rules Spec: Workout Plan

---

## Business Rules

### BR-01: Một user — một lộ trình active tại một thời điểm
- Mỗi `userId` chỉ có tối đa 1 plan với `status: "active"`.
- POST /plans/generate trả `409 Conflict` nếu đã tồn tại active plan.
- Lộ trình cũ chuyển sang `completed` hoặc `cancelled` trước khi tạo mới.

### BR-02: Phải có hồ sơ cơ thể trước khi tạo lộ trình
- workout-service gọi user-service (qua Nginx) để lấy profile trước khi generate.
- Nếu user-service trả 404 → workout-service trả 400 về FE với message: "Vui lòng tạo hồ sơ cơ thể trước".

### BR-03: Lộ trình được cá nhân hóa theo giới tính và BMI
- **Gender = male:** Ưu tiên bài tập barbell/dumbbell, target Bench Press, Squat, Deadlift.
- **Gender = female:** Ưu tiên bài tập bodyweight/dumbbell, nhấn mạnh legs/glutes, ít barbell hơn.
- **BMI < 16 (severely underweight):** Volume thấp hơn (2–3 sets), reps 10–15 để tránh chấn thương.
- **BMI 16–18.5 (underweight):** Volume tiêu chuẩn (3–4 sets), reps 8–12.
- Ứng dụng thiết kế cho underweight — người BMI >= 18.5 vẫn nhận lộ trình nhưng cùng template.

### BR-04: Lộ trình mặc định là Beginner (4 tuần, 3 ngày/tuần)
- Tất cả người dùng mới bắt đầu với template Beginner.
- 3 ngày/tuần: Thứ 2 (Push), Thứ 4 (Pull), Thứ 6 (Legs).
- 4 tuần = 1 chu kỳ. Tuần 1–4 tăng dần volume (progressive overload nhẹ).

### BR-05: Cấu trúc ngày Push/Pull/Legs
- **Ngày A — Push:** Chest + Shoulders + Triceps
- **Ngày B — Pull:** Back + Biceps
- **Ngày C — Legs:** Quads + Hamstrings + Glutes + Calves
- Thứ Tư, Thứ Sáu (ngày xen kẽ) và Chủ Nhật là ngày nghỉ.

### BR-06: Progressive overload theo tuần
- Tuần 1: 3 sets × 10 reps (learning phase)
- Tuần 2: 3 sets × 10–12 reps (adaptation)
- Tuần 3: 4 sets × 8–10 reps (overload)
- Tuần 4: 4 sets × 8–12 reps (peak volume)
- `reps` lưu dạng string range: `"10"`, `"8-12"`, `"10-12"`.

### BR-07: Dữ liệu bài tập được denormalize vào plan
- Khi tạo lộ trình, snapshot `name` và `muscleGroup` của exercise vào PlanExercise.
- Nếu Admin sau này sửa tên bài tập, lộ trình đã tạo không bị ảnh hưởng.

### BR-08: Không xóa exercise đang dùng trong active plan
- DELETE /exercises/:id trả 409 nếu exercise đang có trong ít nhất 1 plan `status: active`.
- Soft delete: đặt `isActive: false` thay vì xóa khỏi DB để giữ tham chiếu.

---

## Validation Rules

### Exercise

| Field | Rule |
|-------|------|
| `name` | Required, string, 2–100 ký tự, unique |
| `muscleGroup` | Required, enum: `chest`, `back`, `shoulders`, `arms`, `legs`, `core` |
| `equipment` | Required, enum: `barbell`, `dumbbell`, `bodyweight`, `cable`, `machine` |
| `difficulty` | Required, enum: `beginner`, `intermediate`, `advanced` |
| `instructions` | Required, string, 10–2000 ký tự |
| `tips` | Optional, mảng string, mỗi tip tối đa 200 ký tự |

### Plan Generation

| Điều kiện | Kết quả |
|-----------|---------|
| User chưa có profile | 400 — Cần tạo profile trước |
| User đã có active plan | 409 — Đã có lộ trình đang active |
| Thư viện bài tập < 5 bài/nhóm cơ | 500 — Không đủ bài tập để tạo lộ trình |

---

## UI Rules

### UR-01: Hiển thị lộ trình theo tuần
- Default: Hiển thị tuần hiện tại (dựa vào `startDate` và ngày hôm nay).
- Người dùng có thể chuyển sang tuần trước/sau bằng nút điều hướng.

### UR-02: Đánh dấu ngày hôm nay
- Ngày tương ứng với hôm nay được highlight trong WeekCalendar.
- Nếu hôm nay là ngày tập → hiển thị nút "Bắt đầu tập" dẫn sang WorkoutDayPage.
- Nếu hôm nay là ngày nghỉ → hiển thị badge "Ngày nghỉ".

### UR-03: Card bài tập hiển thị đủ thông tin
- Mỗi ExerciseCard hiển thị: tên bài, nhóm cơ, số set × reps, thời gian nghỉ.
- Nhấn vào card → mở modal hoặc navigate tới trang chi tiết bài tập (instructions, tips).

### UR-04: Trạng thái chưa có lộ trình
- Nếu GET /plans/my trả 404 → hiển thị màn hình onboarding với nút "Tạo lộ trình của tôi".
- Sau khi nhấn → gọi POST /plans/generate → loading → redirect tới trang lộ trình.

### UR-05: Loading state
- Khi đang generate plan (POST) → nút disable, hiển thị spinner.
- Khi đang load tuần (GET week) → skeleton loader thay vì flash trống.

### UR-06: Không cho phép tạo lộ trình nếu chưa có profile
- FE kiểm tra userStore.profile trước khi gọi generate.
- Nếu profile là null → redirect `/profile/setup` kèm thông báo "Cần tạo hồ sơ trước".

---

## Security Rules

### SR-01: Chỉ xem lộ trình của chính mình
- `userId` lấy từ JWT token, không nhận từ request body hay query param.
- User không thể xem lộ trình của người khác.

### SR-02: Chỉ Admin quản lý thư viện bài tập
- POST/PUT/DELETE /exercises yêu cầu role `admin`.
- GET /exercises mở cho cả `user` và `admin`.

### SR-03: workout-service giao tiếp với user-service nội bộ
- Khi generate plan, workout-service gọi user-service qua Nginx internal route.
- JWT của user được forward để user-service xác thực đúng userId.
