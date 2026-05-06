import { Router } from 'express';
import {
  getLiveAQIByCity,
  getMapData,
  getPollutantBreakdown,
  getAQIHistory,
} from '../controllers/aqi.controller';

const router = Router();

router.get('/feed/:city', getLiveAQIByCity);
router.get('/map', getMapData);
router.get('/pollutants', getPollutantBreakdown);
router.get('/history', getAQIHistory);       // NEW: GET /api/aqi/history?lat=&lon=&days=

export default router;
