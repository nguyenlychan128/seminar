# TASK-027 — FE: Workout Plan UI (WorkoutPlanPage & Components)

## Description

Implement giao diện trang lộ trình tập luyện: `WorkoutPlanPage` hiển thị tổng quan lộ trình và lịch tuần, `WorkoutDayPage` hiển thị chi tiết bài tập một ngày, và các component tái sử dụng (`WeekCalendar`, `DayCard`, `ExerciseCard`, `PlanSummaryCard`). Dùng TailwindCSS only, dark mode theo design system (`FE/DESIGN.md`).

---

## Input

- `spec/features/workout-plan/schema.spec.md` — FE Component Structure
- `spec/features/workout-plan/rules.spec.md` — UR-01 (xem theo tuần), UR-02 (highlight hôm nay), UR-03 (ExerciseCard info), UR-04 (onboarding nếu chưa có plan), UR-05 (loading states), UR-06 (redirect nếu không có profile)
- `FE/DESIGN.md` — Design system: dark slate background, emerald primary, amber accent
- `FE/src/hooks/useWorkoutPlan.js` — từ TASK-026

---

## Output

```
FE/src/
  ├── pages/
  │   └── workout/
  │       ├── WorkoutPlanPage.jsx     # Trang chính: summary + week calendar
  │       └── WorkoutDayPage.jsx      # Chi tiết bài tập một ngày
  └── components/
      └── workout/
          ├── PlanSummaryCard.jsx     # Tổng quan lộ trình
          ├── WeekCalendar.jsx        # Lịch 7 ngày trong tuần
          ├── DayCard.jsx             # Card một ngày (compact)
          └── ExerciseCard.jsx        # Card một bài tập

FE/src/tests/
  ├── pages/
  │   ├── WorkoutPlanPage.test.jsx
  │   └── WorkoutDayPage.test.jsx
  └── components/workout/
      ├── PlanSummaryCard.test.jsx
      ├── WeekCalendar.test.jsx
      ├── DayCard.test.jsx
      └── ExerciseCard.test.jsx
```

---

## Steps

### 1. Component: `PlanSummaryCard.jsx`

Props: `{ name, startDate, endDate, durationWeeks, daysPerWeek, status }`

Hiển thị:
- Tên lộ trình (`name`)
- Badge status: "Active" (emerald), "Completed" (gray), "Cancelled" (red)
- Thời gian: "May 18 – Jun 14, 2026" (format từ startDate/endDate)
- Tần suất: "4 weeks · 3 days/week"

Styling: dark card (`bg-slate-800`), border emerald, rounded-xl, padding.

### 2. Component: `WeekCalendar.jsx`

Props: `{ days, onDaySelect, selectedDayNumber }`

Hiển thị 7 ngày trong tuần theo hàng ngang:
- Mỗi ngày: tên ngày (Mon, Tue...), ngày tháng (19/5), badge "Push" / "Pull" / "Legs" / "Rest"
- Ngày tập: background emerald nhạt, border emerald
- Ngày nghỉ: background slate, text gray
- Ngày hôm nay: ring emerald, bold
- Ngày được chọn (`selectedDayNumber`): background emerald đậm
- Click vào ngày tập → gọi `onDaySelect(dayNumber)`
- Ngày nghỉ: không clickable

Badge color: Push = blue, Pull = purple, Legs = orange, Rest = gray (tất cả dùng Tailwind class).

### 3. Component: `DayCard.jsx`

Props: `{ day, isToday, onClick }`
- `day`: `{ dayNumber, dayLabel, isRestDay, exercises }`

Hiển thị:
- Label ngày: "Ngày A — Push"
- Số bài tập: "3 exercises" hoặc "Rest Day"
- Danh sách tóm tắt: tên 2–3 bài đầu tiên
- Nếu `isToday`: badge "Today" màu amber
- Nếu là ngày tập: clickable, hover effect

### 4. Component: `ExerciseCard.jsx`

Props: `{ exercise, showInstructions }`
- `exercise`: `{ name, muscleGroup, equipment, sets, reps, restSeconds, instructions, tips }`

Hiển thị (compact mode — `showInstructions = false`):
- Tên bài tập (bold, white)
- Badge nhóm cơ: chip màu (chest=red, back=blue, shoulders=yellow, arms=purple, legs=orange, core=green)
- Equipment icon/text: "Barbell", "Dumbbell", "Bodyweight"
- Sets × reps: "3 × 8-12"
- Rest time: "90s rest"

Hiển thị (detail mode — `showInstructions = true`):
- Thêm instructions text
- Tips list nếu có

### 5. Page: `WorkoutPlanPage.jsx`

Logic:
1. Mount: gọi `useWorkoutPlan()` lấy `{ plan, isLoading, hasActivePlan, currentWeekNumber, generatePlan, fetchWeek }`
2. Kiểm tra `userStore.profile` — nếu null → redirect `/profile/setup`
3. Nếu `isLoading` → hiển thị skeleton loader
4. Nếu `!hasActivePlan` → hiển thị onboarding screen:
   - Text: "You don't have a workout plan yet"
   - Nút "Create My Plan" → gọi `generatePlan()` → loading → plan load
5. Nếu có plan:
   - Render `<PlanSummaryCard />` ở trên
   - Render week navigation: nút `<` và `>` để chuyển tuần (state `selectedWeek`, default = `currentWeekNumber`)
   - Khi `selectedWeek` thay đổi: gọi `fetchWeek(selectedWeek)` nếu week data chưa có
   - Render `<WeekCalendar days={currentWeekDays} onDaySelect={handleDaySelect} />`
   - Click ngày → navigate sang `WorkoutDayPage`

Routes cần thêm vào `App.jsx` (hoặc router config):
- `/workout` → `<WorkoutPlanPage />` (protected, role: user)

### 6. Page: `WorkoutDayPage.jsx`

Route: `/workout/day/:weekNumber/:dayNumber`

Logic:
1. Lấy `weekNumber` và `dayNumber` từ route params
2. Dùng data từ workoutStore (đã load từ WorkoutPlanPage)
3. Tìm day trong `plan.weeks[weekNumber-1].days[dayNumber-1]`
4. Nếu `isRestDay` → hiển thị rest day screen ("Rest Day — Recovery is part of the plan 💪")
5. Nếu không: render danh sách `<ExerciseCard showInstructions={true} />` cho từng bài tập
6. Nút "Back" → navigate về `/workout`
7. Nút "Start Workout" (placeholder cho workout-execution Phase 3b)

### 7. Cập nhật Navbar

Thêm link "Workout" cho role `user` trong Navbar (sau "Profile").

### 8. Viết tests

**`WorkoutPlanPage.test.jsx`** (render + MSW):
- Hiển thị skeleton khi `isLoading = true`
- Hiển thị onboarding khi `plan = null`
- Click "Create My Plan" → gọi `generatePlan()`
- Redirect `/profile/setup` khi `profile = null`
- Hiển thị `PlanSummaryCard` khi có plan
- Navigation tuần: click `>` tăng selectedWeek

**`WorkoutDayPage.test.jsx`**:
- Hiển thị rest day message khi `isRestDay = true`
- Render ExerciseCard cho mỗi exercise khi không phải rest day
- Nút "Back" navigate về `/workout`

**Component tests** (unit):
- `PlanSummaryCard`: render đúng name, dates, badge status
- `WeekCalendar`: highlight hôm nay, disable click ngày nghỉ, callback onDaySelect
- `DayCard`: hiển thị "Rest Day" khi isRestDay, badge "Today" khi isToday
- `ExerciseCard`: hiển thị sets×reps, badge nhóm cơ đúng, instructions khi showInstructions=true

---

## Acceptance Criteria

- [ ] `WorkoutPlanPage` redirect `/profile/setup` khi chưa có profile
- [ ] Onboarding screen hiển thị khi chưa có plan, nút "Create My Plan" hoạt động
- [ ] `WeekCalendar` highlight ngày hôm nay, disable click ngày nghỉ
- [ ] `WorkoutDayPage` phân biệt rest day vs workout day
- [ ] `ExerciseCard` hiển thị đúng badge màu theo nhóm cơ
- [ ] Tất cả component dùng TailwindCSS only — không có inline style hay file CSS riêng
- [ ] Navbar có link "Workout" cho user role
- [ ] `npm test` xanh — ≥ 25 tests tổng cộng
- [ ] Coverage ≥ 80% cho pages và components

---

## Mapping

- Schema: `spec/features/workout-plan/schema.spec.md` — FE Component Structure
- Rules: `spec/features/workout-plan/rules.spec.md` — UR-01 đến UR-06
- API: `spec/features/workout-plan/api.spec.md` — FE Integration Points
- Depends on: TASK-026 (workout store/service/hook)
