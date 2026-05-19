# TASK-018 — FE: User Profile Zustand Store & API Service

## Description

Tạo lớp data layer cho feature user-profile phía frontend: Axios service gọi các endpoint của `user-service` và Zustand store quản lý state hồ sơ. Đây là nền tảng cho tất cả các component FE của feature này.

---

## Input

- `spec/features/user-profile/schema.spec.md` — Zustand store shape, actions
- `spec/features/user-profile/api.spec.md` — 4 endpoints + FE integration points
- Pattern từ `FE/src/stores/auth.store.js` và `FE/src/services/auth.service.js` (reference)

---

## Output

```
FE/src/
  ├── services/
  │   └── user.service.js     # Axios calls tới /api/users/profile
  ├── stores/
  │   └── user.store.js       # Zustand store: profile state + actions
  └── hooks/
      └── useUserProfile.js   # Custom hook bao gói store actions

FE/src/tests/
  ├── services/
  │   └── user.service.test.js
  ├── stores/
  │   └── user.store.test.js
  └── hooks/
      └── useUserProfile.test.js
```

---

## Steps

### 1. Service: user.service.js
Dùng Axios instance hiện có (với interceptor tự động attach Bearer token).

- `getProfile()` → GET `/api/users/profile` → trả profile object hoặc throw
- `createProfile(data)` → POST `/api/users/profile` → trả profile object hoặc throw
- `updateProfile(data)` → PUT `/api/users/profile` → trả profile object hoặc throw
- `calcBmi(height, weight)` → GET `/api/users/profile/bmi?height=X&weight=Y` → trả `{ bmi, bodyClassification }`
- Error handling thống nhất: map HTTP status codes → error messages tiếng Việt:
  - 404 → "Hồ sơ chưa tồn tại"
  - 409 → "Hồ sơ đã tồn tại"
  - 400 → message từ server hoặc "Dữ liệu không hợp lệ"
  - 401 → "Phiên đăng nhập hết hạn"

### 2. Store: user.store.js (Zustand)
State shape (theo schema.spec.md):
```js
{
  profile: null,   // UserProfile object hoặc null
  isLoading: false,
  error: null,
}
```

Actions:
- `fetchProfile()` — gọi service.getProfile(); set profile, xử lý 404 (set profile = null, không throw)
- `createProfile(data)` — gọi service.createProfile(); set profile sau khi thành công
- `updateProfile(data)` — gọi service.updateProfile(); merge vào state hiện tại
- `clearProfile()` — reset profile = null (gọi khi logout, hook vào auth store's logout action)

Tất cả actions set `isLoading = true` trước khi call, reset sau khi xong.

### 3. Hook: useUserProfile.js
```js
// Expose từ store:
const { profile, isLoading, error, fetchProfile, createProfile, updateProfile, clearProfile } = useUserProfile()
```
- Tự động gọi `fetchProfile()` khi mount nếu `profile === null && user đã login`
- Trả thêm computed values:
  - `hasProfile` — boolean
  - `isUnderweight` — `profile?.bodyClassification === 'underweight'`

### 4. Tests: user.service.test.js (MSW mock)
- getProfile: 200 → trả profile; 404 → throw với message VN
- createProfile: 201 → trả profile; 409 → throw "Hồ sơ đã tồn tại"
- updateProfile: 200 → trả profile; 404 → throw
- calcBmi: 200 → `{ bmi, bodyClassification }`

### 5. Tests: user.store.test.js
- fetchProfile: success → profile set; 404 → profile = null (không error)
- createProfile: success → profile updated
- updateProfile: partial update → merge đúng
- clearProfile: profile = null
- isLoading: true trong khi gọi API, false sau khi xong

### 6. Tests: useUserProfile.test.js
- Hook trả đúng profile, isLoading, error từ store
- `hasProfile` true/false theo profile
- `isUnderweight` đúng theo bodyClassification
- Auto-fetch khi mount và user đã login

---

## Acceptance Criteria

- [ ] `clearProfile()` được gọi khi user logout (integrate với auth store)
- [ ] `fetchProfile()` với 404 không gây error state (profile = null là hợp lệ)
- [ ] `isLoading` đúng trong suốt vòng đời async
- [ ] Error messages bằng tiếng Việt, ngắn gọn
- [ ] Tất cả MSW mock tests xanh
- [ ] Coverage ≥ 80% cho service, store, hook
- [ ] Không có direct `localStorage` access (token do auth layer quản lý)

---

## Mapping

- Schema: `spec/features/user-profile/schema.spec.md` — Zustand Store section
- API: `spec/features/user-profile/api.spec.md` — FE Integration Points
- Depends on: TASK-015–017 (BE endpoints phải đã được spec, FE mock theo contract)
