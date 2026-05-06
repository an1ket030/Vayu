import { Router } from 'express';
import { getForecast, getForecastByLocation } from '../controllers/forecast.controller';

const router = Router();

// GET /api/forecast/:stationId?lat=&lon=   — backward-compatible city-name route
router.get('/:stationId', getForecast);

// POST /api/forecast/location  { lat, lon }  — GPS-accurate route from frontend
router.post('/location', getForecastByLocation);

export default router;
