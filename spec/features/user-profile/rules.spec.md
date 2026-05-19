# Rules Spec: User Profile

---

## Business Rules

### BR-01: Một người dùng — một hồ sơ
- Mỗi `userId` chỉ có một bản ghi hồ sơ duy nhất.
- POST sẽ trả `409 Conflict` nếu hồ sơ đã tồn tại.

### BR-02: BMI và phân loại tính phía backend
- Client không được gửi `bmi` hoặc `bodyClassification` lên.
- Backend luôn tính lại khi tạo hoặc cập nhật hồ sơ.

### BR-03: Phân loại underweight là điều kiện chính
- Ứng dụng FitGainer phục vụ chủ yếu người dùng `underweight` (BMI < 18.5).
- Hệ thống không chặn người dùng có BMI cao hơn, nhưng lộ trình được thiết kế cho underweight.

### BR-04: Hồ sơ phải tồn tại trước khi tạo lộ trình
- `workout-service` yêu cầu `userId` có hồ sơ hợp lệ trước khi generate lộ trình.
- Nếu chưa có hồ sơ → frontend redirect sang `/profile/setup`.

### BR-05: Cập nhật một phần được cho phép
- PUT chấp nhận subset của fields (partial update).
- Fields không gửi lên giữ nguyên giá trị cũ.
- BMI và phân loại được tính lại từ dữ liệu sau merge.

---

## Validation Rules

### Chiều cao (`height`)
- Kiểu: số nguyên hoặc thập phân, đơn vị cm
- Min: 100 cm — Max: 250 cm
- Required khi POST; optional khi PUT

### Cân nặng (`weight`)
- Kiểu: số nguyên hoặc thập phân, đơn vị kg
- Min: 20 kg — Max: 300 kg
- Required khi POST; optional khi PUT

### Tuổi (`age`)
- Kiểu: số nguyên
- Min: 10 — Max: 100
- Required khi POST; optional khi PUT

### Giới tính (`gender`)
- Enum: `"male"` | `"female"`
- Required khi POST; optional khi PUT

---

## UI Rules

### UR-01: Hiển thị kết quả ngay sau lưu
- Sau khi POST/PUT thành công, UI hiển thị BMI và phân loại ngay trên trang (không cần reload).

### UR-02: Nhãn phân loại thân thiện
| bodyClassification | Hiển thị tiếng Việt |
|---|---|
| underweight | Thiếu cân |
| normal | Bình thường |
| overweight | Thừa cân |
| obese | Béo phì |

### UR-03: Màu sắc cảnh báo theo phân loại
| bodyClassification | Màu badge |
|---|---|
| underweight | Vàng / Amber |
| normal | Xanh lá / Green |
| overweight | Cam / Orange |
| obese | Đỏ / Red |

### UR-04: Inline validation
- Lỗi validation hiển thị dưới field tương ứng ngay khi blur (không chờ submit).
- Thông báo lỗi bằng tiếng Việt, ngắn gọn.

### UR-05: Loading state
- Nút submit hiển thị spinner và disable trong khi đang gọi API.

### UR-06: Redirect sau setup
- Sau khi tạo hồ sơ lần đầu thành công → redirect tới `/dashboard`.
- Sau khi cập nhật hồ sơ → ở lại trang profile, hiển thị toast thành công.

---

## Security Rules

### SR-01: Chỉ xem/sửa hồ sơ của chính mình
- `userId` lấy từ JWT token, **không** lấy từ request body hay query param.
- Không có endpoint admin xem hồ sơ của người khác (ngoài scope hiện tại).

### SR-02: Không expose userId nhạy cảm
- Response trả `userId` dạng string (ObjectId), không expose email hay thông tin auth.
