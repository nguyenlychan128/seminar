# TASK-030-FE: Progress Dashboard UI Components

## Title
Create ProgressDashboard page with WeightInputForm, WeightChart, WeightStatistics components

## Description
Implement responsive Progress Tracking UI with 3 main components:
1. **ProgressDashboard (Page):** Layout page with form, chart, statistics
2. **WeightInputForm:** Form to log weight (with date picker)
3. **WeightChart:** Line chart visualization of weight trend
4. **WeightStatistics:** Display current weight, gain, averages

All styled with **TailwindCSS only** (no separate .css files), following FE/DESIGN.md design system.

## Input
- Spec: [schema.spec.md#FE Component Structure](../../spec/features/progress-tracking/schema.spec.md)
- Spec: [rules.spec.md#UI/UX Rules](../../spec/features/progress-tracking/rules.spec.md)
- Data layer: `progressStore`, `useProgress` hook (from TASK-030-FE step 2) ✅
- Design system: `FE/DESIGN.md` (colors, typography, spacing)

## Output
```
FE/src/
  ├── pages/
  │   └── progress/
  │       └── ProgressDashboard.jsx
  ├── components/
  │   ├── WeightInputForm.jsx
  │   ├── WeightChart.jsx
  │   └── WeightStatistics.jsx
  └── tests/
      └── progress/
          ├── ProgressDashboard.test.jsx
          ├── WeightInputForm.test.jsx
          ├── WeightChart.test.jsx
          └── WeightStatistics.test.jsx
```

With:
- 80+ tests covering all components
- 100% UI code path coverage
- Responsive design (mobile-first)
- TailwindCSS styling (no .css files)

## Steps

### 1. Create ProgressDashboard Page
File: `FE/src/pages/progress/ProgressDashboard.jsx`

**Component Structure:**
```jsx
function ProgressDashboard() {
  const { weightLogs, loading, error, currentWeight } = useProgress();
  
  useEffect(() => {
    // Fetch weight history on mount (last 30 days)
    fetchWeightHistory(null, null, 30);
  }, []);
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-400">Progress Tracking</h1>
        <p className="text-slate-400 mt-2">Monitor your weight journey</p>
      </header>
      
      {/* Error toast */}
      {error && <ErrorToast message={error} onDismiss={clearError} />}
      
      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar: Form + Stats */}
        <div className="lg:col-span-1 space-y-6">
          <WeightInputForm onSuccess={() => fetchWeightHistory(...)} />
          <WeightStatistics stats={{ current, gain, average }} />
        </div>
        
        {/* Main: Chart */}
        <div className="lg:col-span-2">
          <WeightChart data={weightLogs} />
        </div>
      </div>
    </div>
  );
}

export default ProgressDashboard;
```

**Features:**
- Fetch weight history on mount
- Responsive 2-column layout (form+stats left, chart right) on desktop
- Single column on mobile
- Error display with dismiss option
- Loading state (spinner)
- Real-time update after form submit

### 2. Create WeightInputForm Component
File: `FE/src/components/WeightInputForm.jsx`

**Props:**
- `onSuccess` (function) — callback after successful submit

**Internal State:**
- weight (string)
- date (Date)
- loading (boolean)
- error (string)

**UI Elements:**
- Input field: weight (number, placeholder "e.g., 65.5")
- Input field: date (date picker, pre-filled with today)
- Error message display (if validation fails)
- Submit button: "Log Weight"
  - Disabled while loading
  - Shows spinner while loading
- Success toast: auto-dismiss after 3 seconds

**Validation (Client-side):**
- Weight required, must be 30-200
- Date must be today or past (not future)
- Show inline error messages below fields

**Handlers:**
- onChange: update state
- onSubmit: validate → call logWeight → onSuccess callback → reset form

**Styling:**
- Card container: border, padding, rounded corners
- Form layout: stacked vertical
- Use Tailwind: `bg-slate-800`, `border-slate-700`, `text-emerald-400` (from DESIGN.md)
- Input focus: `focus:ring-2 focus:ring-emerald-500`
- Button: emerald green (primary color)

### 3. Create WeightChart Component
File: `FE/src/components/WeightChart.jsx`

**Props:**
- `data` (array) — weight logs: `[{ date, weight, trend }, ...]`

**Requirements:**
- Use Recharts library (or Chart.js if preferred)
- Line chart: X-axis = date (ISO format), Y-axis = weight (kg)
- Auto-scale Y-axis: min 30, max 200
- Show grid lines for readability
- Tooltip on hover: show date, weight, trend
- Responsive: adjust width based on container
- Color: line = emerald-500, area = emerald-500 with opacity

**Edge Cases:**
- Empty data: show placeholder message "No weight data yet"
- Single entry: show as single point (line with 1 point)
- Multiple entries: show trend line

**Implementation Tips:**
- Recharts: `<LineChart>`, `<Line>`, `<CartesianGrid>`, `<Tooltip>`, `<XAxis>`, `<YAxis>`
- Date formatting: use `d3-format` or simple date formatter
- Responsive: use `ResponsiveContainer` from Recharts

### 4. Create WeightStatistics Component
File: `FE/src/components/WeightStatistics.jsx`

**Props:**
- `stats` (object) — `{ currentWeight, previousWeight, totalGain, averageGain }`

**Statistics Displayed:**
1. **Current Weight:** Latest entry weight (big, prominent display)
   - Format: "XX.X kg"
   - Color: emerald-400
   
2. **Weight Gain:** Total gain from first to latest
   - Format: "+X.X kg" (green if positive, red if negative)
   - Calculation: current - first entry
   
3. **Average Daily Gain:** Total gain / number of entries
   - Format: "+X.X kg/day"
   - Color: based on positive/negative
   
4. **Last 7 Days Trend:** Average of last 7 daily trends
   - Format: "+X.X kg/week"
   - Interpretation: "Great progress!" if positive, "Keep going!" if not

**Styling:**
- 4 stat cards in 2x2 grid (mobile) or 4 columns (desktop)
- Each card: background, border, shadow, padding
- Use Tailwind: `bg-slate-800`, `border-slate-700`
- Highlight primary stat (current weight) larger
- Responsive: stack on mobile, grid on desktop

### 5. Create Supporting Components
File: `FE/src/components/ui/ErrorToast.jsx` (if doesn't exist)

- Display error message in toast/alert
- Auto-dismiss or manual dismiss button
- Color: red/amber for error
- Position: top or bottom of screen

### 6. Wire Routing
File: `FE/src/App.jsx` or `FE/src/routes/Routes.jsx`

- Add route: `/progress` → ProgressDashboard
- Protected route: requires authentication (User role)
- Add navbar link: "Progress" (visible for User role)

### 7. Write Component Tests
File: `FE/src/pages/progress/ProgressDashboard.test.jsx` + component tests

**Dashboard Tests:**
- ✅ Component mounts and fetches weight history
- ✅ Shows loading spinner while fetching
- ✅ Displays form, chart, statistics when data loaded
- ✅ Shows error message if fetch fails
- ✅ Dismisses error on button click
- ✅ Calls fetch on mount with default params (30 days)

**WeightInputForm Tests:**
- ✅ Renders form with weight + date inputs
- ✅ Validates weight: required, 30-200 range
- ✅ Validates date: not future
- ✅ Shows validation errors inline
- ✅ Submits with valid data → calls onSuccess
- ✅ Shows success toast after submit
- ✅ Resets form after successful submit
- ✅ Handles duplicate date error (409) → shows "Weight entry already exists for this date"
- ✅ Disables submit button while loading
- ✅ Pre-fills date with today

**WeightChart Tests:**
- ✅ Renders chart when data provided
- ✅ Shows placeholder when no data
- ✅ Displays all data points on line
- ✅ Shows tooltip on hover
- ✅ Responsive width adjusts to container
- ✅ Y-axis range is 30-200

**WeightStatistics Tests:**
- ✅ Renders all 4 statistics
- ✅ Current weight displays latest value
- ✅ Total gain calculates correctly
- ✅ Average gain calculates correctly
- ✅ Positive gain shows green color
- ✅ Negative gain shows red color

**Mock Data:**
- Use progressStore mock with sample weight logs
- Mock API calls with MSW (if needed)
- React Testing Library for component rendering

## Acceptance Criteria

✅ ProgressDashboard page exists at `FE/src/pages/progress/ProgressDashboard.jsx`  
✅ Page fetches weight history on mount (30-day default)  
✅ Page displays loading spinner while fetching  
✅ Page displays error message if fetch fails  
✅ Page has responsive 2-column layout (form+stats left, chart right on desktop)  
✅ WeightInputForm component exists and has weight + date inputs  
✅ Form validates weight 30-200 kg with inline error messages  
✅ Form validates date not in future with inline error messages  
✅ Form submits valid data and calls onSuccess callback  
✅ Form shows success toast after submit (3s auto-dismiss)  
✅ Form shows error for duplicate date entry (409 error)  
✅ Form pre-fills date with today  
✅ Form resets after successful submit  
✅ WeightChart component exists and displays line chart  
✅ Chart shows all data points correctly  
✅ Chart has tooltip on hover showing date, weight, trend  
✅ Chart shows placeholder when no data  
✅ WeightStatistics component exists and displays 4 stats  
✅ Stats show current weight, total gain, average daily gain, 7-day trend  
✅ Stats update in real-time when new entry logged  
✅ All components styled with TailwindCSS only (no .css files)  
✅ Responsive design: mobile (stacked), desktop (2-column)  
✅ Follows design system: emerald primary, slate background, proper spacing  
✅ All component tests pass: `npm test -- progress/`  
✅ Tests cover ≥100% UI code paths  
✅ `npm run lint` — zero warnings  
✅ Route added to App.jsx and appears in navbar  

## Mapping

- **Spec:** [schema.spec.md#FE Component Structure](../../spec/features/progress-tracking/schema.spec.md)
- **Spec:** [rules.spec.md#UI/UX Rules](../../spec/features/progress-tracking/rules.spec.md)
- **Design:** [FE/DESIGN.md](../../FE/DESIGN.md) — Color palette, typography, spacing

## Testing Strategy

**Component Testing with React Testing Library:**
1. Render component with mock props/store
2. Assert UI elements exist
3. Simulate user interactions (type, click)
4. Assert state/store updates correctly
5. Assert API calls made (mocked with MSW)
6. Test error scenarios

**Example Test:**
```javascript
test('WeightInputForm submits valid data', async () => {
  const onSuccess = jest.fn();
  const { getByRole, getByPlaceholderText } = render(
    <WeightInputForm onSuccess={onSuccess} />
  );
  
  // Fill form
  await userEvent.type(getByPlaceholderText(/weight/i), '65.5');
  
  // Submit
  await userEvent.click(getByRole('button', { name: /log weight/i }));
  
  // Assert
  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalled();
  });
});
```

## Dependencies
- ✅ React (already in FE)
- ✅ Zustand + useProgress hook (TASK-030-FE)
- ✅ Recharts (line chart library) or Chart.js
- ✅ TailwindCSS (styling)
- ✅ React Testing Library (testing)

## Estimated Time: 35-40 minutes
