# Feature Spec: User Profile (Hồ sơ người dùng)

## Tổng quan

Cho phép người dùng nhập và quản lý thông tin cơ thể cá nhân. Hệ thống tính toán BMI và phân loại thể trạng để phục vụ cá nhân hóa lộ trình tập luyện.

**Service phụ trách:** `user-service` (port 3002)

**Phụ thuộc:**
- `auth-service` — JWT xác thực người dùng
- `workout-service` — nhận thông tin thể trạng để tạo lộ trình

---

## User Stories liên quan

| ID | Story |
|----|-------|
| UP-01 | Là một người dùng, tôi muốn nhập thông tin cơ thể (chiều cao, cân nặng, tuổi, giới tính) để hệ thống đánh giá thể trạng. |
| UP-02 | Khi tôi nhập thông tin, hệ thống cần tính toán BMI và phân loại thể trạng tương ứng. |
| UP-03 | Là một người dùng gầy, tôi muốn biết mình thuộc nhóm underweight để hiểu rõ tình trạng hiện tại. |

---

## Phạm vi (Scope)

### Bao gồm
- Tạo/cập nhật hồ sơ cơ thể người dùng
- Tính BMI tự động từ chiều cao và cân nặng
- Phân loại thể trạng (Underweight / Normal / Overweight / Obese)
- Xem lại hồ sơ hiện tại
- Hiển thị UI hồ sơ với form nhập và kết quả chỉ số

### Không bao gồm
- Lịch sử thay đổi hồ sơ (thuộc progress-service)
- Tính toán TDEE / macro (thuộc workout-service)
- Quản lý tài khoản / password (thuộc auth-service)

---

## Luồng chính (Main Flow)

1. Người dùng đăng nhập thành công (auth-service trả JWT)
2. Frontend kiểm tra xem hồ sơ đã tồn tại chưa
3. Nếu chưa → redirect tới trang tạo hồ sơ
4. Người dùng nhập: chiều cao, cân nặng, tuổi, giới tính
5. Backend tính BMI và phân loại thể trạng, lưu vào DB
6. Frontend hiển thị kết quả BMI và phân loại

---

## Liên kết

- API: [api.spec.md](./api.spec.md)
- Schema: [schema.spec.md](./schema.spec.md)
- Rules: [rules.spec.md](./rules.spec.md)
