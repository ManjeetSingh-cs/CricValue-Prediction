# Database

CricValue AI uses MongoDB through PyMongo.

```bash
docker run --name cricvalue-mongo -p 27017:27017 -d mongo:7
python backend/scripts/seed_mongodb.py
```

Database:

- `cricvalue_db`

Collections:

- `players`: engineered player stats, role, recent form, actual value, and predicted value.

See [backend/DATABASE_SCHEMA.md](../backend/DATABASE_SCHEMA.md).
