# Schema Spec: User Profile

---

## Backend — MongoDB Model (`user-service`)

### Collection: `userprofiles`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | MongoDB default |
| `userId` | String | Yes | Unique. Maps to `_id` từ auth-service |
| `height` | Number | Yes | cm, range: 100–250 |
| `weight` | Number | Yes | kg, range: 20–300 |
| `age` | Number | Yes | years, range: 10–100 |
| `gender` | String | Yes | enum: `"male"`, `"female"` |
| `bmi` | Number | computed | Tính từ height/weight, lưu cache để query nhanh |
| `bodyClassification` | String | computed | enum: `"underweight"`, `"normal"`, `"overweight"`, `"obese"` |
| `createdAt` | Date | auto | mongoose timestamps |
| `updatedAt` | Date | auto | mongoose timestamps |

**Indexes:**
- `userId` — unique index

---

## Computed Fields

BMI và `bodyClassification` **không do client gửi lên**. Backend tự tính khi tạo/cập nhật hồ sơ.

**BMI formula:**
```
bmi = weight (kg) / (height (m))^2
```

**Body Classification:**
| BMI | Classification |
|-----|---------------|
| < 18.5 | underweight |
| 18.5 – 24.9 | normal |
| 25 – 29.9 | overweight |
| ≥ 30 | obese |

---

## Frontend — Zustand Store (`userStore`)

```js
// stores/user.store.js
{
  profile: {
    userId: string | null,
    height: number | null,
    weight: number | null,
    age: number | null,
    gender: 'male' | 'female' | null,
    bmi: number | null,
    bodyClassification: 'underweight' | 'normal' | 'overweight' | 'obese' | null,
    updatedAt: string | null,
  } | null,
  isLoading: boolean,
  error: string | null,
}
```

**Actions:**
- `fetchProfile()` — GET /api/users/profile
- `createProfile(data)` — POST /api/users/profile
- `updateProfile(data)` — PUT /api/users/profile
- `clearProfile()` — reset store (khi logout)

---

## Frontend — Component Structure

```
pages/profile/
  ├── ProfileSetupPage.jsx    # Trang tạo hồ sơ lần đầu (form)
  └── ProfilePage.jsx         # Trang xem + chỉnh sửa hồ sơ

components/profile/
  ├── ProfileForm.jsx          # Form chiều cao/cân nặng/tuổi/giới tính
  └── BmiResultCard.jsx        # Hiển thị BMI + phân loại + mô tả
```
