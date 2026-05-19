# TASK-017 — BE: Implement User Profile API Endpoints

## Description

Triển khai 4 endpoint REST cho `user-service`: GET/POST/PUT `/api/users/profile` và GET `/api/users/profile/bmi`. Tất cả endpoints phải xác thực JWT (userId lấy từ token, không từ body). Bao gồm service layer, controller, route, và validation middleware.

---

## Input

- `spec/features/user-profile/api.spec.md` — 4 endpoints, request/response contracts
- `spec/features/user-profile/rules.spec.md` — BR-01 đến BR-05, SR-01, SR-02, Validation Rules
- `spec/features/user-profile/schema.spec.md` — UserProfile model
- TASK-016 — UserProfile model + bmi.js đã sẵn sàng

---

## Output

```
BE/user-service/src/
  ├── middleware/
  │   ├── authenticate.js     # Verify JWT, set req.user = { userId, role }
  │   └── validateProfile.js  # Joi/manual validation cho POST + PUT body
  ├── services/
  │   └── profile.service.js  # Business logic: getProfile, createProfile, updateProfile, calcBmi
  ├── controllers/
  │   └── profile.controller.js
  └── routes/
      └── profile.routes.js   # Mount routes tại /profile

tests/
  ├── unit/
  │   └── profile.service.test.js
  └── integration/
      └── profile.api.test.js
```

---

## Steps

### 1. Middleware: authenticate.js
- Đọc `Authorization: Bearer <token>` header.
- Verify JWT bằng `JWT_SECRET` từ env (algorithm HS256 only).
- Set `req.user = { userId: payload.sub (hoặc payload.userId), role: payload.role }`.
- Trả `401` nếu token thiếu, sai, hoặc hết hạn.
- **Quan trọng:** `userId` phải lấy từ JWT payload, không bao giờ từ body/params.

### 2. Middleware: validateProfile.js
- Hàm `validateCreateProfile(body)`:
  - `height`: required, number, min 100, max 250
  - `weight`: required, number, min 20, max 300
  - `age`: required, integer, min 10, max 100
  - `gender`: required, enum ['male', 'female']
  - Reject nếu body chứa `bmi` hoặc `bodyClassification` (strip hoặc 400)
- Hàm `validateUpdateProfile(body)`:
  - Tất cả fields optional
  - Cùng range constraints như trên
  - Reject nếu body trống hoàn toàn → 400

### 3. Service: profile.service.js
- `getProfile(userId)` → UserProfile document hoặc `null`
- `createProfile(userId, data)` → tạo mới; throw `ConflictError` nếu đã tồn tại (BR-01)
- `updateProfile(userId, data)` → partial merge + save; throw `NotFoundError` nếu chưa tồn tại (BR-05)
- `calcBmi(height, weight)` → `{ bmi, bodyClassification }` (không lưu DB — dùng cho preview endpoint)

### 4. Controller: profile.controller.js
- `getProfile(req, res)` — gọi service.getProfile; 200 hoặc 404
- `createProfile(req, res)` — validate body → service.createProfile; 201 hoặc 409
- `updateProfile(req, res)` — validate body → service.updateProfile; 200 hoặc 404
- `getBmi(req, res)` — validate query params (height, weight required, same ranges) → service.calcBmi; 200

### 5. Routes: profile.routes.js
```
GET    /profile          → authenticate → getProfile
POST   /profile          → authenticate → validateCreateProfile → createProfile
PUT    /profile          → authenticate → validateUpdateProfile → updateProfile
GET    /profile/bmi      → authenticate → getBmi
```

### 6. Mount trong app.js
```js
app.use('/profile', profileRoutes)
// Full path qua gateway: /api/users/profile
```

### 7. Unit tests: profile.service.test.js (mock model)
- getProfile: found, not found
- createProfile: success (201), duplicate (409)
- updateProfile: success (200), not found (404), partial merge giữ giá trị cũ
- calcBmi: correct output cho underweight/normal/overweight/obese

### 8. Integration tests: profile.api.test.js (MongoMemoryServer + supertest)
- `GET /profile` — với token hợp lệ có profile → 200
- `GET /profile` — với token hợp lệ, chưa có profile → 404
- `GET /profile` — không có token → 401
- `POST /profile` — body hợp lệ → 201, bmi và bodyClassification được tính
- `POST /profile` — gọi lần 2 → 409
- `POST /profile` — thiếu field required → 400
- `POST /profile` — height ngoài range → 400
- `POST /profile` — body có `bmi` field → bị reject hoặc strip
- `PUT /profile` — partial update → 200, bmi được tính lại
- `PUT /profile` — chưa có profile → 404
- `GET /profile/bmi?height=165&weight=48` → 200 `{ bmi: 17.63, bodyClassification: 'underweight' }`
- `GET /profile/bmi` — thiếu params → 400

---

## Acceptance Criteria

- [ ] `userId` trong mọi operation lấy từ JWT, không từ request body
- [ ] POST trùng userId → 409, không tạo bản ghi mới
- [ ] PUT partial update giữ fields không gửi, tính lại bmi từ dữ liệu đã merge
- [ ] GET /profile/bmi không lưu DB
- [ ] Response không bao giờ expose email hay thông tin auth (SR-02)
- [ ] Tất cả integration tests xanh
- [ ] Coverage ≥ 80% cho service + controller
- [ ] `npm test` xanh toàn bộ

---

## Mapping

- API: `spec/features/user-profile/api.spec.md` — tất cả 4 endpoints
- Rules: `spec/features/user-profile/rules.spec.md` — BR-01, BR-02, BR-05, SR-01, SR-02, Validation Rules
- Schema: `spec/features/user-profile/schema.spec.md`
- Depends on: TASK-015 (scaffold), TASK-016 (model + bmi.js)
