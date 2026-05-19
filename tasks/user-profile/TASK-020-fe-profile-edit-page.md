# TASK-020 — FE: ProfilePage (View & Edit)

## Description

Tạo trang `ProfilePage` cho phép người dùng xem hồ sơ hiện tại và chỉnh sửa thông tin cơ thể. Reuse `ProfileForm` và `BmiResultCard` từ TASK-019. Sau khi cập nhật thành công, ở lại trang và hiển thị toast thông báo (không redirect).

---

## Input

- `spec/features/user-profile/schema.spec.md` — component structure
- `spec/features/user-profile/rules.spec.md` — UR-01, UR-06 (không redirect khi update), UR-02, UR-03
- `spec/features/user-profile/api.spec.md` — GET + PUT /api/users/profile
- TASK-018 — `useUserProfile` hook
- TASK-019 — `ProfileForm`, `BmiResultCard` components

---

## Output

```
FE/src/
  └── pages/profile/
      └── ProfilePage.jsx

FE/src/tests/
  └── pages/profile/
      └── ProfilePage.test.jsx
```

---

## Steps

### 1. Page: ProfilePage.jsx

Layout:
- **Header section:** Tiêu đề "Hồ sơ của tôi" + `BmiResultCard` hiển thị BMI/phân loại hiện tại
- **Edit section:** `ProfileForm` với `initialValues` từ profile hiện tại, `submitLabel="Cập nhật"`

Behaviors:
- Khi mount: gọi `fetchProfile()` nếu profile chưa có trong store
- Loading state khi fetch đang chạy
- Nếu profile không tồn tại (404) → redirect `/profile/setup`
- Khi submit form:
  1. Gọi `updateProfile(formData)`
  2. Thành công → cập nhật `BmiResultCard` ngay lập tức (UR-01) + hiển thị toast "Cập nhật thành công!" (UR-06)
  3. Thất bại → hiển thị error message, ở lại trang

Toast notification:
- Dùng component Toast đơn giản (hoặc tích hợp với design system hiện có)
- Tự động dismiss sau 3 giây
- Màu xanh lá (success)

### 2. Route Integration
- Thêm route `/profile` → `<ProfilePage />` vào router (đảm bảo wrapped trong `ProtectedRoute`)
- Thêm route `/profile/setup` → `<ProfileSetupPage />` (TASK-019, wrapped trong `ProtectedRoute`)
- Kiểm tra `useGetMe()` trong auth flow: nếu profile === null → redirect `/profile/setup`

### 3. Navbar Integration
- Thêm link "Hồ sơ" vào Navbar (chỉ cho User role, không phải Admin)
- Link trỏ tới `/profile`

### 4. Tests: ProfilePage.test.jsx (MSW)
- Render với profile tồn tại → hiển thị BmiResultCard và ProfileForm có pre-filled values
- Render khi profile loading → hiển thị loading state
- Render khi profile null → redirect /profile/setup
- Submit PUT thành công → toast xuất hiện, BmiResultCard cập nhật giá trị mới, form ở lại
- Submit PUT thất bại (400) → error message, toast không xuất hiện
- Toast tự dismiss sau 3 giây (fake timer)
- Navbar link "Hồ sơ" visible khi role=User

---

## Acceptance Criteria

- [ ] ProfilePage reuse `ProfileForm` và `BmiResultCard` từ TASK-019 (không duplicate code)
- [ ] Sau update thành công: toast hiển thị, BmiResultCard cập nhật ngay, ở lại trang (UR-06)
- [ ] Sau update: **không** redirect (khác với setup page)
- [ ] Profile null → redirect /profile/setup (BR-04)
- [ ] `/profile` và `/profile/setup` đều wrapped trong ProtectedRoute
- [ ] Navbar hiển thị link "Hồ sơ" cho User role
- [ ] Toast tự dismiss sau 3 giây
- [ ] Coverage ≥ 80%
- [ ] `npm test` xanh toàn bộ

---

## Mapping

- Feature: `spec/features/user-profile/feature.spec.md` — Main Flow, Scope
- API: `spec/features/user-profile/api.spec.md` — GET + PUT /api/users/profile
- Rules: `spec/features/user-profile/rules.spec.md` — UR-01, UR-06, BR-04
- Schema: `spec/features/user-profile/schema.spec.md` — Component Structure
- Depends on: TASK-018 (hook + store), TASK-019 (ProfileForm, BmiResultCard)
