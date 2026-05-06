import { Request, Response } from 'express';
import axios from 'axios';
import { redisConnection } from '../config/redis';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours

// Helper to safely use Redis (may not be connected)
const safeRedis = () => {
  try {
    return redisConnection.status === 'ready' ? redisConnection : null;
  } catch {
    return null;
  }
};

export const getForecast = async (req: Request, res: Response) => {
  const { stationId } = req.params;
  // Accept optional lat/lon query params for location-accurate predictions
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
  const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;

  // Cache key includes location if provided
  const cacheKey = lat && lon
    ? `forecast:${stationId}:${Math.round(lat * 10) / 10}:${Math.round(lon * 10) / 10}`
    : `forecast:${stationId}`;

  try {
    const redis = safeRedis();

    // Try cache first
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`[Forecast] Cache hit for ${cacheKey}`);
        return res.json({ ...JSON.parse(cached), cached: true });
      }
    }

    // Call ML service
    const payload: Record<string, any> = { station_id: stationId };
    if (lat !== undefined) payload.lat = lat;
    if (lon !== undefined) payload.lon = lon;

    console.log(`[Forecast] Calling ML service at ${ML_SERVICE_URL}/predict for ${cacheKey}`);
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, payload, {
      timeout: 15000,
    });

    const data = mlResponse.data;

    // Cache the result
    if (redis) {
      await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(data));
    }

    return res.json({ ...data, cached: false });
  } catch (error: any) {
    // Handle 202 "training in progress" from ML service
    if (error?.response?.status === 202) {
      const detail = error.response.data?.detail;
      console.log(`[Forecast] ML model training in progress for ${cacheKey}`);
      return res.status(202).json({
        status: 'training',
        message: detail?.message || 'Model training in progress. Please retry in a few minutes.',
        region: detail?.region,
      });
    }

    const status = error?.response?.status || 503;
    const msg = error?.response?.data?.detail || error.message || 'ML service unreachable';
    console.error(`[Forecast] ML service error (${status}) for ${cacheKey}: ${msg}`);

    return res.status(status).json({
      error: 'Forecast unavailable',
      detail: msg,
      mlServiceUrl: ML_SERVICE_URL,
    });
  }
};

/**
 * POST /api/forecast/location
 * Body: { lat: number, lon: number }
 * Used by GPS-aware pages that don't have a named city.
 */
export const getForecastByLocation = async (req: Request, res: Response) => {
  const { lat, lon } = req.body;
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return res.status(400).json({ error: 'lat and lon must be numbers in request body' });
  }

  const cacheKey = `forecast:geo:${Math.round(lat * 10) / 10}:${Math.round(lon * 10) / 10}`;

  try {
    const redis = safeRedis();
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`[Forecast] Cache hit for ${cacheKey}`);
        return res.json({ ...JSON.parse(cached), cached: true });
      }
    }

    console.log(`[Forecast] Calling ML /predict for geo:${lat.toFixed(2)},${lon.toFixed(2)}`);
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
      station_id: 'location',
      lat,
      lon,
    }, { timeout: 15000 });

    const data = mlResponse.data;
    if (redis) await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(data));
    return res.json({ ...data, cached: false });

  } catch (error: any) {
    if (error?.response?.status === 202) {
      const detail = error.response.data?.detail;
      console.log(`[Forecast] ML training in progress for ${cacheKey}`);
      return res.status(202).json({
        status: 'training',
        message: detail?.message || 'Model training in progress. Please retry in a few minutes.',
        region: detail?.region,
      });
    }
    const status = error?.response?.status || 503;
    const msg = error?.response?.data?.detail || error.message || 'ML service unreachable';
    console.error(`[Forecast] ML error (${status}) for ${cacheKey}: ${msg}`);
    return res.status(status).json({ error: 'Forecast unavailable', detail: msg });
  }
};
