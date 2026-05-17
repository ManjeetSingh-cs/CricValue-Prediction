# CricValue AI

React frontend plus FastAPI, MongoDB, and ML backend for cricket player valuation and analytics.

## Run Frontend

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set `VITE_API_BASE_URL="http://127.0.0.1:8000"` in `.env.local`
3. Run the app:
   `npm run dev`

## Run Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
docker run --name cricvalue-mongo -p 27017:27017 -d mongo:7
python backend/scripts/train_model.py
python backend/scripts/seed_mongodb.py
uvicorn app.main:app --app-dir backend --reload --port 8000
```

Backend docs:

- [Backend README](backend/README.md)
- [Integration Guide](INTEGRATION_GUIDE.md)
- [Optional Database Schema](backend/DATABASE_SCHEMA.md)
