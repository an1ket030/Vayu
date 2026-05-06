from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import asyncio
from dotenv import load_dotenv
from models.predictor import Predictor
from models.trainer import Trainer, get_region_key, get_model_path

load_dotenv()

app = FastAPI(title="CleanAir ML Service")
predictor = Predictor()
trainer = Trainer()

# Track background training status per region
_training_status: dict = {}  # region_key -> "training" | "done" | "error:<msg>"


class PredictionRequest(BaseModel):
    station_id: str
    lat: Optional[float] = None   # If provided, use accurate location-specific model
    lon: Optional[float] = None


class TrainRequest(BaseModel):
    lat: Optional[float] = None   # Defaults to Delhi
    lon: Optional[float] = None


class PredictionResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    predictions: List[dict]
    next_24h: List[dict]
    next_7d: List[dict]
    warning_level: str
    model_accuracy: float         # R² of the model — always surfaced to frontend


@app.on_event("startup")
async def startup_event():
    """Load the default (Delhi) model on startup if it exists."""
    # Migrate legacy model to region-specific path if needed
    legacy_path = os.getenv("MODEL_PATH", "models/saved/xgboost_aqi.pkl")
    delhi_region_key = get_region_key(28.6139, 77.2090)
    delhi_region_path = get_model_path(delhi_region_key)

    if os.path.exists(legacy_path) and not os.path.exists(delhi_region_path):
        import shutil
        os.makedirs(os.path.dirname(delhi_region_path), exist_ok=True)
        shutil.copy2(legacy_path, delhi_region_path)
        print(f"[Startup] Migrated legacy model to {delhi_region_path}")

    loaded = predictor.load_model()
    if not loaded:
        print("[Startup] No default model found. Training Delhi model in background...")
        asyncio.create_task(_background_train(28.6139, 77.2090))


async def _background_train(lat: float, lon: float):
    """Run training in a background task without blocking the API."""
    region_key = get_region_key(lat, lon)
    _training_status[region_key] = "training"
    try:
        # Run in thread pool to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        metrics = await loop.run_in_executor(None, lambda: trainer.train(lat, lon))
        predictor.load_model(lat, lon)
        _training_status[region_key] = "done"
        print(f"[Startup] Training complete for {region_key}. R²={metrics['r2']:.3f}")
    except Exception as e:
        _training_status[region_key] = f"error:{str(e)}"
        print(f"[Startup] Training failed for {region_key}: {e}")


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "training_status": _training_status,
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Generate AQI forecast for a location.
    - Provide lat/lon for location-accurate predictions using the region's own model.
    - Falls back to station_id for backward compatibility.
    """
    try:
        # Use provided coordinates or fall back to Delhi
        lat = request.lat or 28.6139
        lon = request.lon or 77.2090
        region_key = get_region_key(lat, lon)

        # If a model for this region is still training, return a 202 status
        status = _training_status.get(region_key)
        if status == "training":
            raise HTTPException(
                status_code=202,
                detail={
                    "message": "Model training in progress for this region. Please retry in a few minutes.",
                    "region": region_key,
                    "status": "training"
                }
            )

        # If not trained at all, trigger training and return 202
        if not trainer.is_trained(lat, lon):
            if region_key not in _training_status:
                print(f"[API] No model for {region_key}. Triggering background training...")
                _training_status[region_key] = "training"
                asyncio.create_task(_background_train(lat, lon))
            raise HTTPException(
                status_code=202,
                detail={
                    "message": f"No model exists for this region yet. Training has been triggered. "
                               f"Estimated time: 3-5 minutes.",
                    "region": region_key,
                    "status": "training"
                }
            )

        results = predictor.predict(request.station_id, lat=lat, lon=lon)
        return results

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/train")
async def train(request: TrainRequest, background_tasks: BackgroundTasks):
    """
    Trigger training (or re-training) of the model for a region.
    Training runs in the background; use /status to check progress.
    """
    lat = request.lat or 28.6139
    lon = request.lon or 77.2090
    region_key = get_region_key(lat, lon)

    if _training_status.get(region_key) == "training":
        return {"status": "already_training", "region": region_key}

    _training_status[region_key] = "training"
    background_tasks.add_task(_background_train, lat, lon)

    return {
        "status": "training_started",
        "region": region_key,
        "message": "Training started in background. Check /health for progress."
    }


@app.get("/status/{region_key}")
def get_training_status(region_key: str):
    """Check training status for a region key."""
    status = _training_status.get(region_key, "unknown")
    metrics = None

    # Try to load saved metrics
    try:
        from models.trainer import get_metrics_path
        import json, os
        mp = get_metrics_path(region_key)
        if os.path.exists(mp):
            with open(mp) as f:
                metrics = json.load(f)
    except Exception:
        pass

    return {"region": region_key, "status": status, "metrics": metrics}
