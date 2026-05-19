# TASK-029: Frontend — Workout Execution Form (Complete)

**Status:** Pending  
**Priority:** High  
**Estimated effort:** 18 hours

---

## 📝 Description

Implement the complete frontend for workout execution:
1. WorkoutExecutionForm component (state, validation, UI)
2. ExerciseCard sub-component
3. API client (workoutSession.service.js)
4. Integrate "Start Workout" button in WorkoutDayPage
5. Comprehensive tests (unit + integration, >80% coverage)

---

## 📥 Input / References

**Spec Files:**
- `spec/features/workout-execution/feature.spec.md`
- `spec/features/workout-execution/api.spec.md`
- `spec/features/workout-execution/schema.spec.md`
- `spec/features/workout-execution/rules.spec.md`
- `FE/DESIGN.md` (design system)

---

## 📤 Output Files

```
FE/src/
  ├── components/workout/
  │   ├── WorkoutExecutionForm.jsx
  │   ├── ExerciseCard.jsx
  │   └── __tests__/
  │       ├── WorkoutExecutionForm.test.js
  │       └── ExerciseCard.test.js
  ├── services/
  │   └── workoutSession.service.js
  ├── pages/workout/
  │   └── WorkoutDayPage.jsx (modified — add button + modal)
  └── tests/integration/
      └── workoutSession.e2e.test.js
```

---

## 🎯 Acceptance Criteria

### 1. WorkoutExecutionForm Component

**Props:**
- [x] exercises (array with exerciseId, name, muscleGroup, plannedSets, plannedReps)
- [x] planId, weekNumber, dayNumber, sessionDate (YYYY-MM-DD)
- [x] onSuccess callback (close modal after save)
- [x] onError callback (optional error handler)

**State:**
```javascript
{
  exercises: [{ exerciseId, status, sets: [], notes }, ...],
  totalDuration: null,
  mood: null,
  notes: "",
  isLoading: false,
  error: null,
  successMessage: null
}
```

**Form Display:**
- [x] Show ExerciseCard for each exercise (status toggle, sets, notes)
- [x] Session summary section:
  - Duration input (0-300 minutes, optional)
  - Mood selector (great/good/ok/tired, optional)
  - Notes textarea (max 500 chars, optional)
- [x] Save button (disabled while loading, "Đang lưu..." text while submitting)

**Exercise Status Toggle (UR-01):**
- [x] Default: "Hoàn thành" (completed)
- [x] Toggle between "Hoàn thành" / "Bỏ qua"
- [x] If completed: show set inputs (required)
- [x] If skipped: hide sets, show only notes

**Set Inputs (UR-02, UR-03):**
- [x] For completed: show N rows (plannedSets)
- [x] Each row: setNumber, reps (0-100), weight (0-500), rpe (1-10 optional), notes (max 200 optional)
- [x] Real-time validation: error messages below fields if out of range
- [x] Prevent submit if validation fails

**Form Submission:**
- [x] POST /api/workouts/sessions with payload:
  ```javascript
  {
    planId, weekNumber, dayNumber, sessionDate,
    exercises: [{ exerciseId, name, muscleGroup, status, plannedSets, plannedReps, sets, notes }],
    totalDuration, mood, notes
  }
  ```
- [x] Authorization header included (via axios interceptor)

**Success (UR-05):**
- [x] On 201: show toast "Bài tập đã được lưu"
- [x] Call onSuccess to close modal
- [x] Auto-dismiss after 3 seconds

**Error (UR-05):**
- [x] On 400/409/500: show alert with error message
- [x] Keep form open for retry
- [x] Parse error from response.data.message

**Form Reset (UR-06):**
- [x] After success: clear all fields
- [x] Allow same workout logged again (no cache)

### 2. ExerciseCard Sub-component

- [x] Props: exercise data, formData, onChange callback
- [x] Shows: name, muscle group, status toggle
- [x] Conditional: sets visible if completed, hidden if skipped
- [x] onChange called for status changes and input updates

### 3. workoutSession.service.js

- [x] `createSession(sessionData)` — POST /api/workouts/sessions
  - Returns Promise<response.data>
  - Throws on error

### 4. WorkoutDayPage Integration

- [x] Replace "Start Workout (Coming Soon)" with real button
- [x] Button opens WorkoutExecutionForm in modal
- [x] Modal can be closed (discard changes)
- [x] On success: auto-close modal

### 5. Styling

- [x] TailwindCSS only (no separate CSS files)
- [x] Follow FE/DESIGN.md (emerald/amber palette, dark mode support)
- [x] Responsive (mobile-friendly)
- [x] Use shadcn/ui Button, Input, Textarea, Select components

### 6. Tests

**Unit Tests: WorkoutExecutionForm**
- [x] Renders with required props
- [x] Toggle status (completed ↔ skipped)
- [x] Set inputs visible/hidden based on status
- [x] Input validation (reps 0-100, weight 0-500, rpe 1-10)
- [x] Form submit calls API with correct payload
- [x] Success message shown on 201
- [x] Error message shown on 400/409/500
- [x] Form reset after success

**Unit Tests: ExerciseCard**
- [x] Renders exercise name and toggle
- [x] Toggle changes status
- [x] Conditional set input display

**Integration Tests: API + Form**
- [x] Valid submission → success toast
- [x] Validation errors → error alert, form stays open
- [x] API errors (400, 409, 500) → proper error messages
- [x] Network errors → handled gracefully
- [x] Multiple exercises (completed + skipped) → correct payload

**Coverage: >= 80% for components**

---

## 🧪 Testing Strategy (TDD)

1. **Before implementation:** Write tests based on this spec
2. **During implementation:** Run tests, fix failures
3. **After:** Verify >= 80% coverage, all tests green

Use:
- Vitest or Jest for test runner
- React Testing Library for component testing
- MSW (Mock Service Worker) for API mocking
- @testing-library/user-event for user interactions

---

## 🔗 Dependencies

- Depends on: TASK-028 (API must exist)
- Blocks: Nothing

---

## 📋 Implementation Notes

- Keep component logic simple — delegate validation to service
- Exercise name/muscleGroup from props (already denormalized)
- Do NOT fetch exercise details from API — use props data
- Use component state or Zustand for form state (keep it simple)
- Real-time validation: validate as user types
- Make modal scrollable for mobile (many inputs)
- Consider showing "last session" hint (optional Phase 2)

---

## 🎨 Design Guidelines

- Use design system from FE/DESIGN.md
- Light mode default, dark mode support (via Tailwind dark: utilities)
- Input labels clear, spacing consistent
- Buttons: shadcn/ui with variant="primary"
- Responsive: stack on mobile, grid on desktop
- Error messages in red, success in green

