# TASK-030-FE: Progress Store & Axios Service

## Title
Create Zustand store for weight history + Axios API service client

## Description
Implement data layer for progress tracking:
- **Zustand Store (progressStore.js):** State management for weight logs
  - State: weightLogs, loading, error
  - Actions: fetchWeightHistory, logWeight, clearError
  - Computed: currentWeight, totalGain, averageGain
- **Axios Service (weightLog.service.js):** HTTP client for weight API
  - Methods: POST weight log, GET weight history
  - Error mapping from backend (400, 409, 401)
- **Custom Hook (useProgress.js):** Subscribe to store + expose computed properties

## Input
- Spec: [schema.spec.md#Frontend State](../../spec/features/progress-tracking/schema.spec.md)
- Spec: [api.spec.md#FE Integration Points](../../spec/features/progress-tracking/api.spec.md)
- API endpoints: `POST /api/progress/weight`, `GET /api/progress/weight`

## Output
```
FE/src/
  ├── stores/
  │   └── progressStore.js
  ├── services/
  │   └── weightLog.service.js
  └── hooks/
      └── useProgress.js
```

With:
- 60+ tests covering store actions, API calls, error handling
- MSW mocking for API calls (no real backend needed)
- 100% store + service code coverage

## Steps

### 1. Create Axios Service
File: `FE/src/services/weightLog.service.js`

**Methods:**

#### `createWeightLog(weight, date = null)`
- Call: `POST /api/progress/weight`
- Body: `{ weight, date }`
- Return: Promise<WeightLogEntry> with fields: _id, weight, date, trend, createdAt
- Error mapping:
  - 400 (invalid weight/date) → throw { code: 'VALIDATION_ERROR', message, field }
  - 409 (duplicate date) → throw { code: 'DUPLICATE_ENTRY', message }
  - 401 (unauthorized) → throw { code: 'UNAUTHORIZED', message }
  - 500 → throw { code: 'SERVER_ERROR', message }

#### `getWeightHistory(startDate = null, endDate = null, limit = 30)`
- Call: `GET /api/progress/weight?startDate=...&endDate=...&limit=...`
- Query params: only include if provided (don't send undefined)
- Return: Promise<{ data: [], count, startDate, endDate }>
- Error mapping: same as above

### 2. Create Zustand Store
File: `FE/src/stores/progressStore.js`

**State:**
```javascript
{
  // Data
  weightLogs: [],        // array of { _id, date, weight, trend, createdAt }
  loading: false,        // true while fetching
  error: null,           // error message if any
  
  // Computed (selectorsthey automatically recalculate)
  currentWeight: null,        // latest entry weight (or null if no entries)
  previousWeight: null,       // second latest entry weight
  totalGain: null,            // current - first entry (or null)
  averageGain: null,          // total gain / number of entries (or null)
  
  // Actions
  setWeightLogs(logs),
  setLoading(isLoading),
  setError(message),
  clearError(),
  fetchWeightHistory(startDate, endDate, limit),
  logWeight(weight, date),
}
```

**Implementation Details:**

1. **Store Creation:**
   - Use `create()` from zustand
   - Define state object with initial values
   - Define actions that update state
   - Export as default

2. **Actions - fetchWeightHistory:**
   - Set loading = true
   - Call service: `weightLogService.getWeightHistory(startDate, endDate, limit)`
   - On success: `setWeightLogs(response.data)`; `setLoading(false)`
   - On error: `setError(error.message)`; `setLoading(false)`
   - Throw error so components can handle if needed

3. **Actions - logWeight:**
   - Call service: `weightLogService.createWeightLog(weight, date)`
   - On success: add to weightLogs array, recalculate computed values
   - On error: `setError(error.message)`; throw error
   - Optional: auto-refresh history after successful log

4. **Computed Properties (getters):**
   - `currentWeight` = weightLogs[0]?.weight ?? null (latest, descending sort assumed from API)
   - `previousWeight` = weightLogs[1]?.weight ?? null
   - `totalGain` = currentWeight - (weightLogs[weightLogs.length - 1]?.weight) ?? null
   - `averageGain` = totalGain / weightLogs.length ?? null
   - These update automatically when weightLogs changes

5. **Error Handling:**
   - `clearError()` action to dismiss error message
   - Actions throw errors so components can respond
   - Store persists error state for UI to display

### 3. Create Custom Hook
File: `FE/src/hooks/useProgress.js`

```javascript
import { useCallback } from 'react';
import progressStore from '../stores/progressStore';

export const useProgress = () => {
  const {
    weightLogs,
    loading,
    error,
    currentWeight,
    previousWeight,
    totalGain,
    averageGain,
    fetchWeightHistory,
    logWeight,
    clearError,
  } = progressStore();
  
  // Optional: wrap actions to add additional logic
  const handleFetchHistory = useCallback(async (startDate, endDate, limit) => {
    try {
      await fetchWeightHistory(startDate, endDate, limit);
    } catch (err) {
      console.error('Failed to fetch weight history:', err);
    }
  }, [fetchWeightHistory]);
  
  const handleLogWeight = useCallback(async (weight, date) => {
    try {
      await logWeight(weight, date);
    } catch (err) {
      console.error('Failed to log weight:', err);
    }
  }, [logWeight]);
  
  return {
    // State
    weightLogs,
    loading,
    error,
    
    // Computed
    currentWeight,
    previousWeight,
    totalGain,
    averageGain,
    
    // Actions
    fetchWeightHistory: handleFetchHistory,
    logWeight: handleLogWeight,
    clearError,
  };
};
```

### 4. Write Tests
File: `FE/src/stores/progressStore.test.js` + `FE/src/services/weightLog.service.test.js` + `FE/src/hooks/useProgress.test.js`

**Service Tests (weightLog.service.test.js):**
- ✅ createWeightLog calls POST /api/progress/weight
- ✅ createWeightLog returns correct response format
- ✅ createWeightLog maps 400 error → VALIDATION_ERROR
- ✅ createWeightLog maps 409 error → DUPLICATE_ENTRY
- ✅ createWeightLog maps 401 error → UNAUTHORIZED
- ✅ getWeightHistory calls GET /api/progress/weight with query params
- ✅ getWeightHistory returns correct response format
- ✅ getWeightHistory handles error responses

**Store Tests (progressStore.test.js):**
- ✅ Initial state is correct (empty weightLogs, no error, not loading)
- ✅ setWeightLogs updates state
- ✅ setLoading updates state
- ✅ setError updates state
- ✅ clearError clears error message
- ✅ fetchWeightHistory sets loading, calls service, updates weightLogs
- ✅ fetchWeightHistory on error sets error message
- ✅ logWeight calls service, updates weightLogs
- ✅ logWeight on error sets error message
- ✅ currentWeight returns latest weight
- ✅ previousWeight returns second latest
- ✅ totalGain calculates correctly (current - first)
- ✅ averageGain calculates correctly (total / count)
- ✅ Computed properties recalculate when weightLogs changes

**Hook Tests (useProgress.test.js):**
- ✅ useProgress hook returns all store values
- ✅ useProgress actions work correctly
- ✅ useProgress handles errors gracefully

**Mock API (MSW or simple mock):**
- Mock `POST /api/progress/weight` → returns 201 with sample weight log
- Mock `GET /api/progress/weight` → returns 200 with sample history
- Mock error responses (400, 409, 401)

## Acceptance Criteria

✅ Service file exists: `FE/src/services/weightLog.service.js`  
✅ Service has createWeightLog(weight, date) method  
✅ Service has getWeightHistory(startDate, endDate, limit) method  
✅ Service maps errors correctly (VALIDATION_ERROR, DUPLICATE_ENTRY, UNAUTHORIZED)  
✅ Store file exists: `FE/src/stores/progressStore.js`  
✅ Store has state: weightLogs, loading, error  
✅ Store has actions: fetchWeightHistory, logWeight, clearError, setWeightLogs, setLoading, setError  
✅ Store computes: currentWeight, previousWeight, totalGain, averageGain  
✅ Hook file exists: `FE/src/hooks/useProgress.js`  
✅ Hook exposes all store state and computed properties  
✅ Hook wraps actions with error handling  
✅ All tests pass: `npm test -- progressStore.test.js`  
✅ All tests pass: `npm test -- weightLog.service.test.js`  
✅ Tests cover ≥95% store + service code paths  
✅ No external API calls during testing (MSW mocked)  
✅ `npm run lint` — zero warnings  

## Mapping

- **Spec:** [schema.spec.md#Frontend State](../../spec/features/progress-tracking/schema.spec.md)
- **Spec:** [schema.spec.md#FE Component Structure](../../spec/features/progress-tracking/schema.spec.md)
- **Spec:** [api.spec.md#FE Integration Points](../../spec/features/progress-tracking/api.spec.md)

## Testing Strategy

**Unit Tests with MSW:**
1. Setup MSW server to mock API endpoints
2. Test service methods call correct endpoints
3. Test service error mapping
4. Test store state updates
5. Test store computed properties
6. Test hook integration
7. No real API calls (all mocked with MSW)

## Dependencies
- ✅ Zustand (already in FE/package.json)
- ✅ Axios (already in FE/package.json)
- ✅ MSW (Mock Service Worker, for testing)
- ✅ Vitest or Jest (test runner)
- ✅ React (for hooks)

## Estimated Time: 20-25 minutes
