# Progress Tracking — Schema & Data Model

---

## Backend Models

### Weight Log (MongoDB)

```javascript
// Mongoose Schema
const weightLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weight: {
    type: Number,
    required: true,
    min: 30,
    max: 200,
    validate: {
      validator: (v) => v % 0.1 === 0 || true,  // allow decimals
      message: 'Weight must be a valid number'
    }
  },
  date: {
    type: Date,
    required: true,
    default: () => new Date().toISOString().split('T')[0]
  },
  trend: {
    type: Number,
    default: 0  // calculated: current - previous day
  },
  notes: {
    type: String,
    maxlength: 200,
    trim: true
  }
}, {
  timestamps: true
});

// Unique constraint: one weight log per user per day
weightLogSchema.index({ userId: 1, date: 1 }, { unique: true });
weightLogSchema.index({ userId: 1, date: -1 });
```

---

## Frontend State (Zustand Store)

### Progress Store Structure

```typescript
// stores/progressStore.js
{
  // State
  weightLogs: [
    { _id: '...', date: '2026-05-18', weight: 65.5, trend: 0.5 },
    { _id: '...', date: '2026-05-17', weight: 65.0, trend: 0.2 }
  ],
  loading: false,
  error: null,
  
  // Computed
  currentWeight: 65.5,        // latest entry weight
  previousWeight: 65.0,       // second latest
  totalGain: 2.5,             // current - first entry
  
  // Actions
  fetchWeightHistory(startDate, endDate),
  logWeight(weight, date),
  clearError()
}
```

---

## FE Component Structure

### ProgressDashboard (Page)
- **Location:** `FE/src/pages/progress/`
- **Children:**
  - `<WeightInputForm />` — form ghi cân nặng
  - `<WeightChart />` — line chart
  - `<WeightStatistics />` — hiển thị current, gain, average

### WeightInputForm (Component)
- **Props:** `onSuccess` (callback after submit)
- **State:** weight, date, loading, error
- **Handlers:** validate input → POST → refresh list

### WeightChart (Component)
- **Props:** `data` (weightLogs array)
- **Library:** Recharts / Chart.js
- **Axes:** X = date, Y = weight (kg)
- **Hover:** show weight + trend

### WeightStatistics (Component)
- **Display:**
  - Current weight
  - Weight gain (total)
  - Average daily gain
  - Last 7 days trend

---

## Data Flow

```
User Input (Form)
    ↓
validate locally
    ↓
POST /api/progress/weight
    ↓
Backend: save + calculate trend
    ↓
Response: new log entry
    ↓
Update progressStore
    ↓
Re-render Chart + Stats
```

