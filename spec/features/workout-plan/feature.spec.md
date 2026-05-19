# Feature Spec: Workout Plan (Lộ trình tập luyện)

## Tổng quan

Hệ thống tạo và quản lý lộ trình tập luyện cá nhân hóa cho người dùng underweight. Lộ trình được sinh tự động dựa trên thể trạng (BMI, cân nặng, giới tính) và mục tiêu tăng cân/xây dựng cơ bắp. Người dùng có thể xem chi tiết từng ngày tập với bài tập, số set, số reps và thời gian nghỉ.

**Service phụ trách:** `workout-service` (port 3003)

**Phụ thuộc:**
- `auth-service` — JWT xác thực người dùng
- `user-service` — Lấy thông tin hồ sơ cơ thể (height, weight, gender, bmi, bodyClassification)

---

## User Stories liên quan

| ID | Story |
|----|-------|
| WP-01 | Là một người dùng, tôi muốn nhận được một lộ trình tập luyện cá nhân hóa để tăng cân và xây dựng cơ thể. |
| WP-02 | Là một người mới bắt đầu, tôi muốn lộ trình đơn giản, dễ hiểu để có thể theo dõi và thực hiện. |
| WP-03 | Là một người dùng, tôi muốn xem danh sách bài tập theo từng ngày với số set, reps và thời gian nghỉ cụ thể. |
| WP-04 | Khi hệ thống tạo lộ trình, nó cần phù hợp với mục tiêu tăng cân và thể trạng hiện tại của tôi. |

---

## Phạm vi (Scope)

### Bao gồm
- Thư viện bài tập (Exercise Library): Admin quản lý, User xem
- Tạo lộ trình tự động dựa trên hồ sơ người dùng
- Xem lộ trình theo tuần (7 ngày/tuần, 4 tuần/chu kỳ)
- Xem chi tiết từng ngày: bài tập, set, reps, thời gian nghỉ, hướng dẫn thực hiện
- Lộ trình được cá nhân hóa theo giới tính và mức độ (beginner mặc định)

### Không bao gồm
- Thực hiện và ghi lại kết quả tập (thuộc workout-execution)
- Điều chỉnh lộ trình theo tiến trình (thuộc adaptive-plan)
- Thay thế bài tập (thuộc exercise-replacement)
- Lịch sử các lộ trình cũ (ngoài scope hiện tại)

---

## Luồng chính (Main Flow)

1. Người dùng đăng nhập và đã có hồ sơ cơ thể (user-service)
2. Người dùng vào trang Dashboard / Workout
3. Frontend kiểm tra xem đã có lộ trình active chưa
4. Nếu chưa → gọi API generate lộ trình (workout-service lấy profile từ user-service)
5. Hệ thống tạo lộ trình 4 tuần, 3 ngày/tuần (hoặc 4 ngày) với bài tập phù hợp
6. Người dùng xem lộ trình theo tuần, chọn ngày để xem chi tiết bài tập

---

## Cấu trúc lộ trình mặc định

```
Lộ trình 4 tuần (1 chu kỳ):
  Tuần 1–4:
    Ngày A (Push): Ngực, Vai, Tay sau (Triceps)
    Ngày B (Pull): Lưng, Tay trước (Biceps)
    Ngày C (Legs): Chân, Mông
    Ngày nghỉ: Thứ 4, Thứ 6, Chủ Nhật

Tần suất: 3 ngày/tuần (Thứ 2, 4, 6) — có thể mở rộng sang 4 ngày
Số set/bài: 3–4 sets
Số reps: 8–12 (hypertrophy — phù hợp tăng cân)
Thời gian nghỉ: 60–90 giây giữa các set
```

---

## Liên kết

- API: [api.spec.md](./api.spec.md)
- Schema: [schema.spec.md](./schema.spec.md)
- Rules: [rules.spec.md](./rules.spec.md)
