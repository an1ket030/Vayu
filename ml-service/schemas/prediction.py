from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PredictionItem(BaseModel):
    timestamp: datetime
    aqi: float
    confidence: float

class PredictionResponse(BaseModel):
    predictions: List[PredictionItem]
    next_24h: List[PredictionItem]
    next_7d: List[PredictionItem]
    warning_level: str
