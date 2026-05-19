# Progress Tracking — API Specification

**Service:** `progress-service` (Port 3004)  
**Gateway Route:** `/api/progress/*` → `progress-service:3004/*`

---

## 1. Create Weight Log

```
POST /progress/weight
Authorization: Bearer <token>
Content-Type: application/json

{
  "weight": 65.5,           // kg, required, number
  "date": "2026-05-18"      // optional, ISO date (default: today)
}
```

**Validation:**
- `weight`: 30-200, required
- `date`: ISO format, optional (default: today)
- Prevent duplicate entries for same date (same user)

**Response (201 Created):**
```json
{
  "_id": "670a1b2c...",
  "userId": "user123",
  "weight": 65.5,
  "date": "2026-05-18",
  "trend": 0.5,              // difference from previous day (kg)
  "createdAt": "2026-05-18T10:00:00Z"
}
```

**Error Responses:**
- 400: Invalid weight (out of range) or invalid date format
- 409: Weight entry already exists for this date
- 401: Unauthorized

---

## 2. Get Weight History

```
GET /progress/weight?startDate=2026-04-18&endDate=2026-05-18&limit=30
Authorization: Bearer <token>
```

**Query Params:**
- `startDate`: ISO date (optional, default: 30 days ago)
- `endDate`: ISO date (optional, default: today)
- `limit`: number (optional, default: 30)

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "670a1b2c...",
      "weight": 65.5,
      "date": "2026-05-18",
      "trend": 0.5,
      "createdAt": "2026-05-18T10:00:00Z"
    },
    {
      "_id": "670a1a2c...",
      "weight": 65.0,
      "date": "2026-05-17",
      "trend": 0.2,
      "createdAt": "2026-05-17T10:00:00Z"
    }
  ],
  "count": 2,
  "startDate": "2026-04-18",
  "endDate": "2026-05-18"
}
```

**Sorting:** descending by date (newest first)

---

## 3. Database Schema

**Collection:** `weight_logs`

```javascript
{
  _id: ObjectId,
  userId: String (ref: users),           // required
  weight: Number,                        // 30-200, required
  date: Date,                            // required, unique per user
  trend: Number,                         // calculated field (weight - prev_day)
  notes: String,                         // optional, max 200 chars
  createdAt: Date,
  updatedAt: Date
}

// Index
db.weight_logs.createIndex({ userId: 1, date: -1 })
db.weight_logs.createIndex({ userId: 1, date: 1 }, { unique: true })
```

---

## 4. FE Integration Points

| Action | Endpoint | Used By |
|--------|----------|---------|
| Log weight | `POST /api/progress/weight` | Weight Input Form |
| Fetch history | `GET /api/progress/weight?startDate=...&endDate=...` | Progress Dashboard (on mount) |
| Display chart | History data → Chart Component | Weight Chart |

