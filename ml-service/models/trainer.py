import os
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
from data.fetch_historical import fetch_historical_data
from models.feature_engineer import create_features

MODEL_SAVE_DIR = os.getenv("MODEL_SAVE_DIR", "models/saved")

def get_region_key(lat: float, lon: float) -> str:
    """
    Quantize lat/lon to a 1-degree grid cell (~111km resolution).
    This ensures each distinct city/region gets its own dedicated model
    without creating an infinite number of models for minor GPS jitter.
    """
    grid_lat = round(lat)
    grid_lon = round(lon)
    return f"region_{grid_lat}_{grid_lon}"

def get_model_path(region_key: str) -> str:
    return os.path.join(MODEL_SAVE_DIR, f"xgboost_{region_key}.pkl")

def get_metrics_path(region_key: str) -> str:
    return os.path.join(MODEL_SAVE_DIR, f"metrics_{region_key}.json")

FEATURES = [
    'co', 'no', 'no2', 'o3', 'so2', 'pm2_5', 'pm10', 'nh3',
    'hour_sin', 'hour_cos', 'day_of_week', 'month',
    'pm25_lag_3h', 'pm25_lag_6h', 'pm25_lag_12h', 'pm25_lag_24h',
    'pm25_rolling_6h', 'pm25_rolling_12h', 'pm25_rolling_24h'
]

class Trainer:
    def __init__(self):
        os.makedirs(MODEL_SAVE_DIR, exist_ok=True)
        # Keep the legacy path for backward compat with startup load
        self.model_path = os.getenv("MODEL_PATH", os.path.join(MODEL_SAVE_DIR, "xgboost_aqi.pkl"))
        self.default_lat = float(os.getenv("TRAINING_LAT", 28.6139))
        self.default_lon = float(os.getenv("TRAINING_LON", 77.2090))

    def train(self, lat: float = None, lon: float = None):
        """Train a model for a specific region. Defaults to Delhi."""
        lat = lat if lat is not None else self.default_lat
        lon = lon if lon is not None else self.default_lon
        region_key = get_region_key(lat, lon)
        model_path = get_model_path(region_key)

        print(f"[Trainer] Starting training for region {region_key} (lat={lat:.2f}, lon={lon:.2f})")
        print(f"[Trainer] Fetching 90 days of historical OWM data...")

        df_raw = fetch_historical_data(lat, lon, days=90)

        if len(df_raw) < 200:
            raise ValueError(
                f"Insufficient training data for region {region_key}: "
                f"only {len(df_raw)} records fetched. Need at least 200. "
                f"OWM historical data may be limited for this region."
            )

        print(f"[Trainer] Fetched {len(df_raw)} records. Engineering features...")
        df = create_features(df_raw)

        if len(df) < 100:
            raise ValueError(
                f"After feature engineering, only {len(df)} usable rows remain for {region_key}. "
                f"Data may be too sparse for this region."
            )

        X = df[FEATURES]
        y = df['target_aqi_24h']

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, shuffle=False  # time-series order preserved
        )

        print(f"[Trainer] Training XGBoost on {len(X_train)} samples, validating on {len(X_test)}...")
        model = xgb.XGBRegressor(
            n_estimators=1000,
            learning_rate=0.05,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=3,
            gamma=0.1,
            reg_alpha=0.1,
            reg_lambda=1.0,
            n_jobs=-1,
            random_state=42,
        )

        model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            early_stopping_rounds=50,
            verbose=False
        )

        y_pred = model.predict(X_test)
        metrics = {
            "region_key": region_key,
            "lat": lat,
            "lon": lon,
            "n_train": len(X_train),
            "n_test": len(X_test),
            "mse": float(mean_squared_error(y_test, y_pred)),
            "rmse": float(np.sqrt(mean_squared_error(y_test, y_pred))),
            "r2": float(r2_score(y_test, y_pred)),
            "best_iteration": int(model.best_iteration),
        }

        if metrics["r2"] < 0.70:
            print(
                f"[Trainer] WARNING: Model for {region_key} has R²={metrics['r2']:.2f}, "
                f"which is below the quality threshold of 0.70. "
                f"This may indicate insufficient/noisy data for this region."
            )

        print(f"[Trainer] Training complete for {region_key}. Metrics: {metrics}")

        # Save model and metrics
        joblib.dump(model, model_path)

        import json
        with open(get_metrics_path(region_key), "w") as f:
            json.dump(metrics, f, indent=2)

        # Also save as the legacy default model if this is the Delhi region
        if region_key == get_region_key(self.default_lat, self.default_lon):
            joblib.dump(model, self.model_path)
            print(f"[Trainer] Also saved as legacy default model at {self.model_path}")

        return metrics

    def is_trained(self, lat: float, lon: float) -> bool:
        """Check if a model already exists for this region."""
        region_key = get_region_key(lat, lon)
        return os.path.exists(get_model_path(region_key))

    def get_metrics(self, lat: float, lon: float) -> dict | None:
        """Return saved training metrics for a region, or None if untrained."""
        import json
        region_key = get_region_key(lat, lon)
        metrics_path = get_metrics_path(region_key)
        if os.path.exists(metrics_path):
            with open(metrics_path) as f:
                return json.load(f)
        return None
