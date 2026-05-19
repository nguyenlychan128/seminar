# API Spec: Workout Execution

Base path: `/api/workouts` (qua Nginx gateway → workout-service port 3003)

Tất cả endpoint yêu cầu header: `Authorization: Bearer <access_token>`

---

## POST /api/workouts/sessions

**Ghi lại kết quả tập luyện của một buổi tập.**

### Auth
Required (User)

### Request Body

```json
{
  "planId": "507f1f77bcf86cd799439011",
  "weekNumber": 1,
  "dayNumber": 1,
  "sessionDate": "2026-05-18",
  "exercises": [
    {
      "exerciseId": "507f1f77bcf86cd799439012",
      "name": "Bench Press",
      "muscleGroup": "chest",
      "status": "completed",
      "plannedSets": 3,
      "plannedReps": "8-12",
      "sets": [
        {
          "setNumber": 1,
          "actualReps": 10,
          "weight": 80,
          "rpe": 7,
          "notes": "Felt good"
        },
        {
          "setNumber": 2,
          "actualReps": 9,
          "weight": 80,
          "rpe": 8,
          "notes": ""
        },
        {
          "setNumber": 3,
          "actualReps": 8,
          "weight": 80,
          "rpe": 9,
          "notes": "Last set tough"
        }
      ],
      "notes": "Shoulder felt tight at start"
    },
    {
      "exerciseId": "507f1f77bcf86cd799439013",
      "name": "Incline Dumbbell Press",
      "muscleGroup": "chest",
      "status": "skipped",
      "plannedSets": 3,
      "plannedReps": "8-10",
      "sets": [],
      "notes": "Skipped due to shoulder pain"
    }
  ],
  "totalDuration": 45,
  "mood": "good",
  "notes": "Great session overall"
}
```

### Response 201: Success

```json
{
  "success": true,
  "data": {
    "sessionId": "507f1f77bcf86cd799439014",
    "userId": "user001",
    "planId": "507f1f77bcf86cd799439011",
    "weekNumber": 1,
    "dayNumber": 1,
    "sessionDate": "2026-05-18",
    "exercises": [
      {
        "exerciseId": "507f1f77bcf86cd799439012",
        "name": "Bench Press",
        "muscleGroup": "chest",
        "status": "completed",
        "plannedSets": 3,
        "plannedReps": "8-12",
        "sets": [
          {
            "setNumber": 1,
            "actualReps": 10,
            "weight": 80,
            "rpe": 7,
            "notes": "Felt good"
          },
          {
            "setNumber": 2,
            "actualReps": 9,
            "weight": 80,
            "rpe": 8,
            "notes": ""
          },
          {
            "setNumber": 3,
            "actualReps": 8,
            "weight": 80,
            "rpe": 9,
            "notes": "Last set tough"
          }
        ],
        "notes": "Shoulder felt tight at start"
      },
      {
        "exerciseId": "507f1f77bcf86cd799439013",
        "name": "Incline Dumbbell Press",
        "muscleGroup": "chest",
        "status": "skipped",
        "plannedSets": 3,
        "plannedReps": "8-10",
        "sets": [],
        "notes": "Skipped due to shoulder pain"
      }
    ],
    "totalDuration": 45,
    "mood": "good",
    "notes": "Great session overall",
    "completedAt": "2026-05-18T15:30:00Z",
    "createdAt": "2026-05-18T15:30:00Z"
  }
}
```

### Response 400: Validation Error

```json
{
  "success": false,
  "message": "Validation failed: actualReps must be between 0 and 100"
}
```

**Common validation errors:**
- `sessionDate` in the future
- `actualReps` < 0 or > 100
- `weight` < 0 or > 500
- `rpe` < 1 or > 10 (if provided)
- Completed exercise with 0 sets
- Missing required fields

### Response 401: Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized - invalid or missing token"
}
```

### Response 409: Duplicate Session

```json
{
  "success": false,
  "message": "Duplicate session - already logged for this date/plan/week/day"
}
```

---

## FE Integration Points

| Page/Component | Action | Endpoint |
|---|---|---|
| WorkoutDayPage | Submit form | POST /api/workouts/sessions |

---

## Error Handling

| Status | Meaning | FE Action |
|--------|---------|-----------|
| 201 | Success | Show toast, close modal, reset form |
| 400 | Validation | Show error message below form field |
| 401 | Auth expired | Redirect to login |
| 409 | Duplicate | Show error "Already logged for this date" |
| 500 | Server error | Show generic error message |
