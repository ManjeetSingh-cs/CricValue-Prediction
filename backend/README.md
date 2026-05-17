# CricValue AI Backend

FastAPI + MongoDB + ML backend for cricket player valuation.

## Structure

```text
backend/
|-- app/
|   |-- main.py
|   |-- database/
|   |   `-- mongodb.py
|   |-- repositories/
|   |   `-- player_repository.py
|   |-- routes/
|   |   |-- analytics.py
|   |   |-- player.py
|   |   `-- prediction.py
|   |-- services/
|   |   |-- analytics_service.py
|   |   |-- model_loader.py
|   |   |-- player_service.py
|   |   `-- prediction_service.py
|   |-- models/
|   |   `-- ml_model.pkl
|   `-- utils/
|       `-- preprocessing.py
|-- data/
|   |-- sample_t20_matches.csv
|   `-- sample_odi_matches.csv
|-- scripts/
|   |-- train_model.py
|   |-- seed_mongodb.py
|   `-- lstm_placeholder.py
`-- requirements.txt
```

## Pipeline

1. Load T20 and ODI CSV datasets.
2. Clean missing values and duplicates.
3. Engineer player-wise features:
   `matches`, `runs`, `avg`, `strike_rate`, `wickets`, `economy`, `recent_form`, `consistency`, `form_trend`.
4. Infer player role and create a role-aware target:
   - batsman: `runs*0.5 + strike_rate*0.3 + avg*0.12 + recent_form*0.08`
   - bowler: `wickets*0.6 + (1/economy)*100*0.4 + matches*0.08`
   - allrounder: weighted batting + bowling blend
5. Train Linear Regression, Random Forest, and XGBoost when installed.
6. Save the best model to `backend/app/models/ml_model.pkl`.
7. Seed processed players into `cricvalue_db.players` with PyMongo.

If XGBoost is not installed, training uses `GradientBoostingRegressor` as a local fallback.

## MongoDB

```bash
docker run --name cricvalue-mongo -p 27017:27017 -d mongo:7
```

Environment:

```text
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=cricvalue_db
MONGODB_PLAYERS_COLLECTION=players
```

## Run

```bash
cd /Users/manjeetsingh/Documents/Codex/2026-05-05/files-mentioned-by-the-user-cricvalue
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python backend/scripts/train_model.py
python backend/scripts/seed_mongodb.py
uvicorn app.main:app --app-dir backend --reload --port 8000
```

If MongoDB is not running, read APIs fall back to the local engineered CSV dataset for development.

## Test APIs

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/players
curl "http://127.0.0.1:8000/players?team=India&role=batsman&min_value=50"
curl -X POST http://127.0.0.1:8000/players \
  -H "Content-Type: application/json" \
  -d '{"name":"Rahul Sharma","team":"Mumbai Local","role":"Batsman","nationality":"India","currentValue":10,"matches":5,"stats":{"batting":{"average":42,"strikeRate":148,"totalRuns":720},"bowling":{"economy":8.2,"wickets":4}},"recentForm":[45,18,72,55,90]}'
curl http://127.0.0.1:8000/player/Virat%20Kohli
curl http://127.0.0.1:8000/player/Virat%20Kohli/charts
curl http://127.0.0.1:8000/player/Virat%20Kohli/trend
curl http://127.0.0.1:8000/player/Virat%20Kohli/analysis
curl http://127.0.0.1:8000/best-xi
curl http://127.0.0.1:8000/generate-report --output cricvalue-global-report.pdf
curl http://127.0.0.1:8000/ai-insights
curl -X POST http://127.0.0.1:8000/ai-strategy \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Find auction alpha and recommend budget allocation","budget":500}'
curl -X POST http://127.0.0.1:8000/ai-scout \
  -H "Content-Type: application/json" \
  -d '{"query":"Find explosive batsmen under 300M"}'
curl http://127.0.0.1:8000/player/Virat%20Kohli/career-forecast
curl http://127.0.0.1:8000/player/Virat%20Kohli/injury-risk
curl http://127.0.0.1:8000/player/Virat%20Kohli/explain
curl http://127.0.0.1:8000/sentiment
curl http://127.0.0.1:8000/team-chemistry?team=India
curl http://127.0.0.1:8000/undervalued
curl -X POST http://127.0.0.1:8000/auction \
  -H "Content-Type: application/json" \
  -d '{"budget":500,"max_players":11}'
curl -X POST http://127.0.0.1:8000/compare \
  -H "Content-Type: application/json" \
  -d '{"player_one":"Virat Kohli","player_two":"Babar Azam"}'
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"runs":600,"avg":36,"strike_rate":145,"wickets":12,"economy":7.8,"matches":20,"recent_form":42,"consistency":24,"form_trend":3}'
```

Swagger docs are available at:

```text
http://127.0.0.1:8000/docs
```

Live AI insight websocket:

```text
ws://127.0.0.1:8000/ws/live-insights
```

## AI Architecture

- `routes/ai.py`: PDF report, strategy copilot, scout agent, premium AI endpoints, websocket feed.
- `services/ai_orchestrator.py`: market reasoning, prompt readouts, scouting filters, forecasts, sentiment, explainability.
- `services/report_service.py`: matplotlib-backed multi-page PDF generation.
- Real LLM providers can be attached behind `ai_orchestrator.py` with `OPENAI_API_KEY` or `GEMINI_API_KEY`; the current implementation provides deterministic production-safe reasoning when provider keys are absent.
