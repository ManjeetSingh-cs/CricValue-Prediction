from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any

from app.config import (
    MONGODB_DB_NAME,
    MONGODB_PLAYERS_COLLECTION,
    MONGODB_TIMEOUT_MS,
    MONGODB_URI,
)

logger = logging.getLogger(__name__)

try:
    from pymongo import ASCENDING, MongoClient
    from pymongo.collection import Collection
except ImportError:  # pragma: no cover - exercised only when dependency missing locally.
    ASCENDING = 1
    MongoClient = None
    Collection = Any


@lru_cache(maxsize=1)
def get_mongo_client() -> MongoClient:
    if MongoClient is None:
        raise RuntimeError("PyMongo is not installed. Run: pip install -r backend/requirements.txt")

    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=MONGODB_TIMEOUT_MS)
    client.admin.command("ping")
    return client


def get_players_collection() -> Collection:
    client = get_mongo_client()
    database = client[MONGODB_DB_NAME]
    collection = database[MONGODB_PLAYERS_COLLECTION]
    collection.create_index([("player_name", ASCENDING)], unique=True)
    collection.create_index([("team", ASCENDING), ("role", ASCENDING), ("predicted_value", ASCENDING)])
    return collection


def is_mongodb_available() -> bool:
    try:
        get_players_collection()
        return True
    except Exception as exc:
        logger.warning("MongoDB unavailable; using local dataset fallback. Reason: %s", exc)
        return False
