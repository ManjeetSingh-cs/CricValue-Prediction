# CricValue AI Integration Guide

## Backend endpoints

- `GET /players`: returns all player cards with nested stats and chart-ready trends.
- `GET /players?team=India&role=batsman&min_value=50`: filtered players.
- `POST /players`: validates, predicts, and saves a registered player.
- `GET /player/{name}`: returns one player by id or name.
- `GET /player/{name}/charts`: returns performance and valuation trends for charts.
- `GET /player/{name}/trend`: same chart-ready trend data.
- `GET /player/{name}/analysis`: performance score, strengths, weaknesses, trend, and risk.
- `POST /predict`: predicts valuation from numeric features.
- `GET /best-xi`: top 11 players by predicted value.
- `POST /auction`: suggested squad within budget.
- `GET /undervalued`: players where predicted value exceeds actual value.
- `POST /compare`: player-to-player stat comparison.
- `GET /generate-report`: downloads a professional PDF market report.
- `POST /ai-strategy`: AI auction strategy and budget allocation readout.
- `POST /ai-scout`: natural-language scouting agent.
- `GET /ai-insights`: autonomous insights feed.
- `GET /player/{name}/career-forecast`: 1-year and 3-year valuation forecast.
- `GET /player/{name}/injury-risk`: workload-based injury risk.
- `GET /player/{name}/explain`: explainable valuation feature importance.
- `GET /sentiment`: NLP-style market sentiment snapshot.
- `GET /team-chemistry?team=India`: role-fit and chemistry recommendation.
- `WS /ws/live-insights`: live autonomous AI insight stream.

Example prediction request:

```json
{
  "runs": 600,
  "avg": 36,
  "strike_rate": 145,
  "wickets": 12,
  "economy": 7.8,
  "matches": 20,
  "recent_form": 42,
  "consistency": 24,
  "form_trend": 3
}
```

Example prediction response:

```json
{
  "predicted_value": 238.42,
  "predictedValue": 238.42,
  "confidence": 0.86,
  "model_name": "xgboost",
  "reasoning": "Valuation is based on aggregate batting, bowling, recent form, consistency, and trend features."
}
```

## Axios frontend service

Use `frontend-integration/api.ts` as the replacement pattern for `src/services/api.ts`.

Set `.env`:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Then call:

```ts
await playerService.getPlayers();
await playerService.createPlayer({
  name: 'Rahul Sharma',
  team: 'Mumbai Local',
  role: 'Batsman',
  nationality: 'India',
  currentValue: 10,
  matches: 5,
  stats: {
    batting: { average: 42, strikeRate: 148, totalRuns: 720 },
    bowling: { economy: 8.2, wickets: 4 }
  },
  recentForm: [45, 18, 72, 55, 90]
});
await playerService.getPlayer('Virat Kohli');
await playerService.getPlayerAnalysis('Virat Kohli');
await playerService.getPlayerTrend('Virat Kohli');
await playerService.getBestXI();
await playerService.runAuction(500);
await playerService.getUndervaluedPlayers();
await playerService.comparePlayers('Virat Kohli', 'Babar Azam');
await playerService.getAIInsights();
await playerService.analyzeStrategy('Find auction alpha and risky players', 500);
const reportBlob = await playerService.generateReport();
await playerService.predictValue({
  runs: 600,
  avg: 36,
  strike_rate: 145,
  wickets: 12,
  economy: 7.8,
});
```

The backend also accepts the existing frontend style:

```ts
await playerService.predictExistingPlayer('1');
```
