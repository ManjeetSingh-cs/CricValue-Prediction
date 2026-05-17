# Database Schema

MongoDB database: `cricvalue_db`

Collection: `players`

```json
{
  "player_name": "Virat Kohli",
  "team": "India",
  "role": "batsman",
  "runs": 424,
  "avg": 70.67,
  "strike_rate": 114.59,
  "wickets": 0,
  "economy": 0,
  "matches": 8,
  "recent_form": [1, 92, 101, 35, 78],
  "recent_form_avg": 61.4,
  "consistency": 34.71,
  "form_trend": 14.1,
  "predicted_value": 287.7,
  "actual_value": 264.68,
  "performance_trend": [
    { "date": "2026-01-02", "score": 44 }
  ]
}
```

Indexes:

- Unique `player_name`
- Compound `team`, `role`, `predicted_value`
