# TASK-019 — FE: ProfileSetupPage & ProfileForm Component

## Description

Tạo trang `ProfileSetupPage` để người dùng nhập thông tin cơ thể lần đầu sau khi đăng nhập. Bao gồm component `ProfileForm` (dùng chung cho cả setup và edit) với inline validation, BMI preview real-time, và redirect tới `/dashboard` sau khi lưu thành công.

---

## Input

- `spec/features/user-profile/schema.spec.md` — component structure
- `spec/features/user-profile/rules.spec.md` — Validation Rules, UR-01 đến UR-06
- `spec/features/user-profile/api.spec.md` — POST /api/users/profile, FE integration points
- TASK-018 — `useUserProfile` hook sẵn sàng

---

## Output

```
FE/src/
  ├── pages/profile/
  │   └── ProfileSetupPage.jsx
  ├── components/profile/
  │   ├── ProfileForm.jsx
  │   └── BmiResultCard.jsx

FE/src/tests/
  ├── pages/profile/
  │   └── ProfileSetupPage.test.jsx
  └── components/profile/
      ├── ProfileForm.test.jsx
      └── BmiResultCard.test.jsx
```

---

## Steps

### 1. Component: BmiResultCard.jsx
Props: `{ bmi, bodyClassification }` (có thể null khi chưa có data)

- Hiển thị giá trị BMI (1 chữ số thập phân, vd: "17.6")
- Hiển thị nhãn tiếng Việt theo UR-02:
  - underweight → "Thiếu cân"
  - normal → "Bình thường"
  - overweight → "Thừa cân"
  - obese → "Béo phì"
- Màu badge theo UR-03 (dùng CSS class hoặc TailwindCSS):
  - underweight → amber/yellow
  - normal → green
  - overweight → orange
  - obese → red
- Khi `bmi === null` → hiển thị placeholder "Nhập thông tin để xem chỉ số BMI"

### 2. Component: ProfileForm.jsx
Props: `{ initialValues, onSubmit, isLoading, submitLabel }`

Fields:
- **Chiều cao (cm)**: number input, min 100, max 250
- **Cân nặng (kg)**: number input, min 20, max 300
- **Tuổi**: number input (integer), min 10, max 100
- **Giới tính**: radio hoặc select — "Nam" (male) / "Nữ" (female)

Behaviors:
- Inline validation on blur (UR-04): hiển thị lỗi ngay dưới field, thông báo tiếng Việt
  - Ví dụ: "Chiều cao phải từ 100 đến 250 cm", "Vui lòng chọn giới tính"
- Submit button: disabled + spinner khi `isLoading` (UR-05)
- Gọi `onSubmit(formData)` khi submit và form hợp lệ

Validation logic (client-side, thuần JS):
- `validateProfileForm(values)` → `{ isValid, errors: { height?, weight?, age?, gender? } }`

### 3. Page: ProfileSetupPage.jsx
- Dùng `useUserProfile()` hook
- Nếu user đã có profile → redirect `/dashboard` (không hiển thị form)
- Render `ProfileForm` với `submitLabel="Lưu hồ sơ"`
- Khi submit:
  1. Gọi `createProfile(formData)`
  2. Thành công → hiển thị `BmiResultCard` với kết quả → sau 1.5s redirect `/dashboard` (UR-06)
  3. Thất bại (4xx) → hiển thị error message dưới form (không redirect)
- Loading state toàn trang khi đang `fetchProfile()` lúc mount (kiểm tra profile)

### 4. Tests: BmiResultCard.test.jsx
- Render với bmi=17.63, bodyClassification='underweight' → hiển thị "17.6", "Thiếu cân", amber class
- Render với bmi=null → hiển thị placeholder
- Test đủ 4 phân loại với màu/label đúng

### 5. Tests: ProfileForm.test.jsx
- Render đầy đủ 4 fields
- Blur field trống → hiển thị error message tiếng Việt
- Nhập height = 50 (< min) → hiển thị lỗi range
- Submit khi form hợp lệ → gọi onSubmit với đúng data
- Submit khi form invalid → không gọi onSubmit
- isLoading=true → button disabled, spinner hiển thị

### 6. Tests: ProfileSetupPage.test.jsx (MSW)
- User chưa có profile: hiển thị form
- User đã có profile: redirect /dashboard
- Submit hợp lệ → gọi POST API → hiển thị BmiResultCard → redirect
- Submit lỗi server 400 → hiển thị error, không redirect
- Đang fetch profile → hiển thị loading state

---

## Acceptance Criteria

- [ ] `ProfileForm` reusable (dùng được cho cả setup lẫn edit, chỉ khác props)
- [ ] Inline validation hiển thị đúng sau blur, tiếng Việt
- [ ] Submit button disabled khi isLoading
- [ ] Redirect `/dashboard` sau setup thành công (UR-06)
- [ ] `BmiResultCard` hiển thị đúng màu và nhãn cho cả 4 phân loại
- [ ] Không submit khi form invalid
- [ ] Coverage ≥ 80%
- [ ] `npm test` xanh toàn bộ

---

## Mapping

- Feature: `spec/features/user-profile/feature.spec.md` — Main Flow bước 3–6
- API: `spec/features/user-profile/api.spec.md` — POST /api/users/profile, FE Integration Points
- Rules: `spec/features/user-profile/rules.spec.md` — UR-01 đến UR-06, Validation Rules
- Schema: `spec/features/user-profile/schema.spec.md` — Component Structure
- Depends on: TASK-018 (hook + store)
