# Models

Model artifacts are generated under:

```text
backend/app/models/
```

Training command:

```bash
python backend/scripts/train_model.py
```

The pipeline trains XGBoost when available. In lightweight local environments without XGBoost installed, it falls back to scikit-learn gradient boosting so the backend remains runnable.
