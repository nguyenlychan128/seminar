# Progress Tracking — Business Rules & Validation

---

## Business Rules

### BR-1: Weight Entry Constraints
- **One entry per day per user** — không được tạo 2 entry cho cùng 1 user trong cùng 1 ngày
- **Valid weight range:** 30-200 kg
- **Date format:** ISO date (YYYY-MM-DD), default = today
- **Resolution:** decimal (0.1 kg) e.g., 65.5, 66.2

### BR-2: Trend Calculation
- **Trend** = current weight - previous day weight
- If no previous entry → trend = 0
- Updated when new entry is created

### BR-3: History Retention
- **Default query:** last 30 days
- **Max range:** 365 days
- Older entries kept indefinitely in database

### BR-4: Data Accuracy
- Prevent user from editing past entries (create only, not update)
- Manual entry only (no auto-sync from wearables in Phase 1)

---

## Validation Rules

### Input Validation (Frontend & Backend)

| Field | Rule | Error Message |
|-------|------|---------------|
| `weight` | 30 ≤ weight ≤ 200 | "Weight must be between 30-200 kg" |
| `weight` | Required | "Weight is required" |
| `weight` | Number only | "Weight must be a number" |
| `date` | ISO format (YYYY-MM-DD) | "Invalid date format" |
| `date` | Not future date | "Date cannot be in the future" |
| `date` | Unique per user | "Weight entry already exists for this date" |

### Backend Business Validation

- Check user is authenticated (JWT valid)
- Check weight is from the authenticated user's profile
- Reject if duplicate date exists for this user

---

## Authorization

- **Endpoint:** All weight endpoints require `Authorization: Bearer <JWT>`
- **Scope:** Users can only view/create their own weight logs
- Users cannot create weight logs for other users

---

## Error Handling

| Status | Scenario | Response |
|--------|----------|----------|
| 400 | Invalid weight value (out of range) | `{ error: "Weight must be between 30-200 kg" }` |
| 400 | Invalid date format | `{ error: "Invalid date format" }` |
| 409 | Duplicate weight entry same date | `{ error: "Weight entry already exists for this date" }` |
| 401 | No authentication token | `{ error: "Unauthorized" }` |
| 500 | Database error | `{ error: "Failed to save weight log" }` |

---

## Performance Considerations

- **Default limit:** 30 entries per request
- **Indexing:** `userId + date` for fast queries
- **Pagination:** future enhancement (not in Phase 1)

---

## UI/UX Rules

### Weight Input Form
- Pre-fill date with today
- Allow user to select past date (for catch-up logging)
- Disable future dates
- Show validation errors inline
- Show success toast after submit

### Weight Chart
- Auto-scale Y-axis based on data range
- Minimum Y-axis: 30 kg, Maximum: 200 kg
- Show grid lines for readability
- Tooltip on hover showing: date, weight, trend
- Color: positive trend (green), negative (red), zero (gray)

### Weight Statistics
- **Current:** Latest weight entry
- **Total Gain:** Current - First entry weight
- **Average Daily:** Total gain / number of days
- **Last 7 Days Trend:** Average of last 7 daily trends
- Update in real-time when new entry added

