# TASK-024 — BE: Exercise Library API (CRUD Endpoints)

## Description

Implement 5 REST endpoints cho thư viện bài tập: GET list (với filter), GET detail, POST tạo mới, PUT cập nhật, DELETE soft-delete. Áp dụng RBAC: User chỉ được đọc, Admin mới được ghi. Tích hợp middleware xác thực JWT từ auth-service pattern.

---

## Input

- `spec/features/workout-plan/api.spec.md` — 5 exercise endpoints: GET list, GET detail, POST, PUT, DELETE
- `spec/features/workout-plan/rules.spec.md` — BR-08 (soft delete, không xóa khi đang dùng), SR-02 (Admin only write), Validation Rules (Exercise)
- `BE/workout-service/src/models/Exercise.js` — từ TASK-022

---

## Output

```
BE/workout-service/src/
  ├── middleware/
  │   └── authenticate.js         # JWT validation (port từ auth-service pattern)
  ├── controllers/
  │   └── exercise.controller.js  # 5 handler functions
  ├── routes/
  │   └── exercise.routes.js      # Route definitions với middleware
  └── validators/
      └── exercise.validator.js   # Validation middleware cho POST/PUT body

BE/workout-service/tests/
  └── integration/
      └── exercise.api.test.js    # API integration tests với Supertest
```

---

## Steps

### 1. Tạo `src/middleware/authenticate.js`

Copy pattern từ `BE/auth-service/src/middleware/authenticate.js`:
- Extract `Authorization: Bearer <token>` header
- Verify JWT với `JWT_SECRET` từ env, algorithm HS256 only
- Attach `req.user = { userId, email, role }` vào request
- Lỗi: 401 nếu thiếu/invalid token, reject nếu algorithm không phải HS256

Tạo thêm `authorize(allowedRoles)` middleware:
- Kiểm tra `req.user.role` có trong `allowedRoles`
- Lỗi: 403 nếu role không đủ quyền

### 2. Tạo `src/validators/exercise.validator.js`

`validateCreateExercise` middleware (dùng cho POST):
- `name`: required, string, 2–100 ký tự
- `muscleGroup`: required, enum check
- `equipment`: required, enum check
- `difficulty`: required, enum check
- `instructions`: required, string, 10–2000 ký tự
- `tips`: optional, array, mỗi item ≤ 200 ký tự
- Lỗi: 400 `{ success: false, errors: [...] }`

`validateUpdateExercise` middleware (dùng cho PUT):
- Tất cả fields optional, nhưng nếu có mặt thì validate như trên
- Lỗi: 400 nếu field nào có mặt nhưng sai format

### 3. Tạo `src/controllers/exercise.controller.js`

**`getExercises(req, res)`** — GET /exercises:
- Query DB với filter từ query params: `muscleGroup`, `equipment`, `difficulty`
- Chỉ lấy exercise có `isActive: true`
- Return: `{ exercises: [...], total: N }`

**`getExerciseById(req, res)`** — GET /exercises/:exerciseId:
- Tìm theo `_id` và `isActive: true`
- Return: exercise object đầy đủ (incl. tips)
- 404 nếu không tìm thấy

**`createExercise(req, res)`** — POST /exercises (Admin only):
- Insert document mới vào DB
- 409 nếu `name` đã tồn tại (E11000 unique index error)
- Return 201 với exercise vừa tạo

**`updateExercise(req, res)`** — PUT /exercises/:exerciseId (Admin only):
- Tìm exercise theo `_id` và `isActive: true`
- 404 nếu không tìm thấy
- Partial update (chỉ update fields có trong body)
- Return 200 với exercise đã cập nhật

**`deleteExercise(req, res)`** — DELETE /exercises/:exerciseId (Admin only):
- Tìm exercise theo `_id` và `isActive: true`
- 404 nếu không tìm thấy
- Kiểm tra xem exercise có trong plan nào `status: active` không (BR-08): query `WorkoutPlan` collection
- 409 nếu đang được dùng trong active plan
- Nếu không: set `isActive = false` (soft delete)
- Return 200 `{ success: true, message: "Exercise deleted" }`

### 4. Cập nhật `src/routes/exercise.routes.js`

```
GET    /                        → authenticate, getExercises
GET    /:exerciseId             → authenticate, getExerciseById
POST   /                        → authenticate, authorize(['admin']), validateCreateExercise, createExercise
PUT    /:exerciseId             → authenticate, authorize(['admin']), validateUpdateExercise, updateExercise
DELETE /:exerciseId             → authenticate, authorize(['admin']), deleteExercise
```

### 5. Viết `tests/integration/exercise.api.test.js`

Dùng Supertest + MongoMemoryServer. Tạo JWT test tokens (user + admin) bằng cách ký thủ công với `JWT_SECRET` test.

Test cases cần cover:
- GET / → 200, trả danh sách exercises (đã seed)
- GET / với filter `?muscleGroup=chest` → chỉ trả chest exercises
- GET / với filter `?equipment=barbell` → chỉ trả barbell exercises
- GET /:id → 200, trả đầy đủ exercise kể cả tips
- GET /:id với id không tồn tại → 404
- POST / không có token → 401
- POST / với user token → 403
- POST / với admin token + valid body → 201, trả exercise mới
- POST / với admin token + trùng tên → 409
- POST / với admin token + thiếu required field → 400
- PUT /:id với admin token → 200, chỉ update fields đã gửi
- PUT /:id không tồn tại → 404
- DELETE /:id với admin token, không dùng → 200, isActive = false
- DELETE /:id đang dùng trong active plan → 409
- DELETE /:id không tồn tại → 404

---

## Acceptance Criteria

- [ ] `GET /exercises` với filter params hoạt động đúng
- [ ] `POST /exercises` bị chặn với User token (403)
- [ ] `POST /exercises` tạo thành công với Admin token
- [ ] `DELETE /exercises/:id` soft delete (isActive = false, không xóa khỏi DB)
- [ ] `DELETE /exercises/:id` trả 409 nếu đang dùng trong active plan
- [ ] `npm test` xanh — exercise.api.test.js ≥ 15 tests
- [ ] Coverage ≥ 80% cho `controllers/exercise.controller.js`

---

## Mapping

- API: `spec/features/workout-plan/api.spec.md` — Exercise Library endpoints
- Rules: `spec/features/workout-plan/rules.spec.md` — BR-08, SR-02, Validation Rules (Exercise)
- Schema: `spec/features/workout-plan/schema.spec.md` — Collection `exercises`
- Depends on: TASK-021 (scaffold), TASK-022 (Exercise model)
