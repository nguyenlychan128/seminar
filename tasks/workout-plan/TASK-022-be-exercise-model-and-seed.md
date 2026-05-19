# TASK-022 — BE: Exercise Model & Seed Data

## Description

Tạo Mongoose model `Exercise` cho thư viện bài tập và seed data ban đầu với ít nhất 5 bài tập cho mỗi nhóm cơ chính (chest, back, shoulders, arms, legs, core). Seed data là điều kiện cần để `planGenerator` (TASK-023) có thể hoạt động.

---

## Input

- `spec/features/workout-plan/schema.spec.md` — Collection `exercises`, tất cả fields và indexes
- `spec/features/workout-plan/rules.spec.md` — BR-08 (soft delete), Validation Rules (Exercise)

---

## Output

```
BE/workout-service/src/
  ├── models/
  │   └── Exercise.js          # Mongoose schema + model
  └── scripts/
      └── seedExercises.js     # Script seed dữ liệu ban đầu

BE/workout-service/tests/
  └── integration/
      └── exercise.model.test.js   # Integration tests với MongoMemoryServer
```

---

## Steps

### 1. Tạo `src/models/Exercise.js`

Schema fields:
- `name` — String, required, unique, trim, minlength 2, maxlength 100
- `muscleGroup` — String, required, enum: `['chest', 'back', 'shoulders', 'arms', 'legs', 'core']`
- `secondaryMuscles` — [String], default: []
- `equipment` — String, required, enum: `['barbell', 'dumbbell', 'bodyweight', 'cable', 'machine']`
- `difficulty` — String, required, enum: `['beginner', 'intermediate', 'advanced']`
- `instructions` — String, required, minlength 10, maxlength 2000
- `tips` — [String], default: [], validate: mỗi tip maxlength 200
- `imageUrl` — String, default: null
- `isActive` — Boolean, required, default: true
- timestamps: true

Indexes:
- `name`: unique
- `muscleGroup`: 1
- `equipment`: 1
- `difficulty`: 1

### 2. Tạo `src/scripts/seedExercises.js`

Seed tối thiểu **5 bài/nhóm cơ** cho 6 nhóm = 30 bài tập, difficulty: `beginner`, các equipment phân bổ hợp lý:

**Chest (5 bài):** Bench Press (barbell), Dumbbell Flyes (dumbbell), Push-Up (bodyweight), Incline Dumbbell Press (dumbbell), Cable Crossover (cable)

**Back (5 bài):** Deadlift (barbell), Pull-Up (bodyweight), Barbell Row (barbell), Dumbbell Row (dumbbell), Lat Pulldown (cable)

**Shoulders (5 bài):** Overhead Press (barbell), Dumbbell Lateral Raise (dumbbell), Front Raise (dumbbell), Arnold Press (dumbbell), Face Pull (cable)

**Arms (5 bài):** Barbell Curl (barbell), Tricep Dips (bodyweight), Hammer Curl (dumbbell), Skull Crusher (barbell), Cable Curl (cable)

**Legs (5 bài):** Squat (barbell), Romanian Deadlift (barbell), Leg Press (machine), Dumbbell Lunge (dumbbell), Calf Raise (bodyweight)

**Core (5 bài):** Plank (bodyweight), Crunch (bodyweight), Leg Raise (bodyweight), Russian Twist (bodyweight), Cable Woodchop (cable)

Script phải:
- Kết nối MongoDB
- Upsert theo `name` (không tạo trùng khi chạy lại)
- Log số lượng upserted
- Ngắt kết nối sau khi xong

### 3. Viết `tests/integration/exercise.model.test.js`

Test cases cần cover:
- Schema tạo thành công với đủ required fields
- `name` unique — tạo 2 bài cùng tên → lỗi
- `muscleGroup` invalid enum → lỗi validation
- `equipment` invalid enum → lỗi validation
- `difficulty` invalid enum → lỗi validation
- `instructions` quá ngắn (< 10 ký tự) → lỗi
- `isActive` default = true
- `secondaryMuscles` default = []
- `tips` mỗi item > 200 ký tự → lỗi
- timestamps `createdAt` và `updatedAt` tự tạo
- Soft delete: set `isActive = false`, document vẫn tồn tại trong DB

---

## Acceptance Criteria

- [ ] `Exercise.js` model export thành công, có đủ 11 fields
- [ ] Tất cả 4 indexes được tạo trên collection
- [ ] `npm test` xanh — exercise.model.test.js ≥ 12 tests
- [ ] `node src/scripts/seedExercises.js` chạy thành công, log "Seeded X exercises"
- [ ] Sau seed: DB có ≥ 30 bài tập, ≥ 5 bài mỗi nhóm cơ
- [ ] Chạy seed lần 2 không tạo trùng (idempotent)
- [ ] Coverage ≥ 80% cho `models/Exercise.js`

---

## Mapping

- Schema: `spec/features/workout-plan/schema.spec.md` — Collection `exercises`
- Rules: `spec/features/workout-plan/rules.spec.md` — BR-08 (soft delete), Validation Rules (Exercise)
- API sẽ dùng model này: `spec/features/workout-plan/api.spec.md` — GET/POST/PUT/DELETE /exercises
