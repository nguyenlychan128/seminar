# TASK-016 — BE: Create UserProfile Mongoose Model

## Description

Tạo Mongoose model `UserProfile` cho collection `userprofiles` với đầy đủ fields, validation, unique index trên `userId`, và 2 computed fields (`bmi`, `bodyClassification`). Model không nhận `bmi`/`bodyClassification` từ client — chúng được tính tự động bằng pre-save hook.

---

## Input

- `spec/features/user-profile/schema.spec.md` — collection `userprofiles`, 8 fields + computed
- `spec/features/user-profile/rules.spec.md` — validation ranges, BR-01, BR-02

---

## Output

```
BE/user-service/src/
  ├── models/
  │   └── UserProfile.js
  └── utils/
      └── bmi.js              # Pure functions: calculateBmi, classifyBmi
tests/
  └── unit/
      ├── UserProfile.test.js
      └── bmi.test.js
```

---

## Steps

1. Tạo `src/utils/bmi.js` với 2 pure functions:
   - `calculateBmi(height_cm, weight_kg)` → Number (làm tròn 2 chữ số thập phân)
   - `classifyBmi(bmi)` → `'underweight' | 'normal' | 'overweight' | 'obese'`
   - Ngưỡng: < 18.5 → underweight, 18.5–24.9 → normal, 25–29.9 → overweight, ≥ 30 → obese

2. Tạo `src/models/UserProfile.js` với Mongoose schema:
   - `userId`: String, required, unique (index)
   - `height`: Number, required, min: 100, max: 250
   - `weight`: Number, required, min: 20, max: 300
   - `age`: Number, required, integer, min: 10, max: 100
   - `gender`: String, required, enum: ['male', 'female']
   - `bmi`: Number (không required — set bởi hook)
   - `bodyClassification`: String, enum: ['underweight', 'normal', 'overweight', 'obese']
   - `timestamps: true`

3. Thêm Mongoose pre-save hook trong `UserProfile.js`:
   - Tính lại `this.bmi` và `this.bodyClassification` mỗi khi `height` hoặc `weight` thay đổi.
   - Dùng `calculateBmi` và `classifyBmi` từ `bmi.js`.

4. Viết `tests/unit/bmi.test.js`:
   - `calculateBmi`: test các boundary values (100cm/20kg, 165cm/48kg, 175cm/70kg, 180cm/100kg)
   - `classifyBmi`: test đầy đủ 4 nhánh + boundary (18.5, 24.9, 25.0, 29.9, 30.0)

5. Viết `tests/unit/UserProfile.test.js` (dùng MongoMemoryServer):
   - Tạo profile hợp lệ → bmi và bodyClassification được set tự động
   - POST với dữ liệu thiếu field required → ValidationError
   - POST trùng userId → duplicate key error (E11000)
   - height < 100 hoặc > 250 → ValidationError
   - weight < 20 hoặc > 300 → ValidationError
   - age < 10 hoặc > 100 → ValidationError
   - gender không trong enum → ValidationError
   - Client gửi `bmi` lên → bị ghi đè bởi hook (hook wins)

---

## Acceptance Criteria

- [x] `calculateBmi(165, 48)` → `17.63` ✅
- [x] `classifyBmi(17.63)` → `'underweight'` ✅
- [x] Pre-save hook tính lại bmi/bodyClassification khi height/weight thay đổi ✅
- [x] Client không thể override `bmi` qua save (hook luôn tính lại) ✅
- [x] Unique index trên `userId` hoạt động đúng ✅
- [x] Tất cả validation range hoạt động đúng ✅
- [x] Coverage ≥ 80% cho `bmi.js` và `UserProfile.js` (100% coverage) ✅
- [x] `npm test` xanh toàn bộ (114 tests passing) ✅
- [x] BR-02 guard: findOneAndUpdate on height/weight throws error ✅

## Test Results (TASK-016)

**Status:** ✅ Complete

**Test Coverage:**
- `src/utils/bmi.js`: 100% (14 tests)
- `src/models/UserProfile.js`: 100% (47 tests)
- **Total:** 61 tests for TASK-016 + 53 tests from TASK-015 = 114 tests passing
- **Overall Coverage:** 98.36% statements, 90.9% branches, 100% functions, 98.21% lines

**Implementation Details:**
- ✅ `src/utils/bmi.js`: 2 pure functions (calculateBmi, classifyBmi)
- ✅ `src/models/UserProfile.js`: Mongoose schema with pre-save hook + pre-findOneAndUpdate guard
- ✅ `tests/unit/bmi.test.js`: 14 test cases covering all branches and edge cases
- ✅ `tests/unit/UserProfile.test.js`: 47 test cases covering validation, hooks, BR-02

**Deployment Status:** Ready for TASK-017 (ProfileController & Routes)

---

## Mapping

- Schema: `spec/features/user-profile/schema.spec.md`
- Rules: `spec/features/user-profile/rules.spec.md` — BR-01 (unique), BR-02 (computed server-side), Validation Rules
- Depends on: TASK-015 (scaffold)
