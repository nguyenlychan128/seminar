# API Spec: User Profile

Base path: `/api/users` (qua Nginx gateway)

Tất cả endpoint yêu cầu header: `Authorization: Bearer <access_token>`

---

## Endpoints

### GET /api/users/profile

Lấy hồ sơ cơ thể của người dùng hiện tại.

**Auth:** Required (User)

**Response 200:**
```json
{
  "userId": "string",
  "height": 165,
  "weight": 48,
  "age": 22,
  "gender": "male",
  "bmi": 17.63,
  "bodyClassification": "underweight",
  "updatedAt": "2026-05-17T10:00:00Z"
}
```

**Response 404:** Hồ sơ chưa tồn tại

---

### POST /api/users/profile

Tạo hồ sơ cơ thể lần đầu.

**Auth:** Required (User)

**Request Body:**
```json
{
  "height": 165,
  "weight": 48,
  "age": 22,
  "gender": "male"
}
```

**Response 201:**
```json
{
  "userId": "string",
  "height": 165,
  "weight": 48,
  "age": 22,
  "gender": "male",
  "bmi": 17.63,
  "bodyClassification": "underweight",
  "updatedAt": "2026-05-17T10:00:00Z"
}
```

**Response 409:** Hồ sơ đã tồn tại (dùng PUT để cập nhật)

---

### PUT /api/users/profile

Cập nhật hồ sơ cơ thể (có thể cập nhật một phần).

**Auth:** Required (User)

**Request Body** (tất cả field là optional):
```json
{
  "height": 166,
  "weight": 50,
  "age": 22,
  "gender": "male"
}
```

**Response 200:** Trả về hồ sơ đã cập nhật (cùng format GET)

**Response 404:** Hồ sơ chưa tồn tại (dùng POST trước)

---

### GET /api/users/profile/bmi

Tính BMI tức thời từ query params (không lưu DB — dùng cho preview UI).

**Auth:** Required (User)

**Query params:** `?height=165&weight=48`

**Response 200:**
```json
{
  "bmi": 17.63,
  "bodyClassification": "underweight"
}
```

---

## FE Integration Points

| Tình huống | Hành động |
|---|---|
| Sau login, hồ sơ chưa có (404) | Redirect `/profile/setup` |
| Sau login, hồ sơ đã có | Cho phép vào `/dashboard` |
| Lưu hồ sơ thành công | Hiển thị BMI + phân loại, redirect `/dashboard` |
| Validation lỗi (4xx) | Hiển thị lỗi inline dưới field tương ứng |
