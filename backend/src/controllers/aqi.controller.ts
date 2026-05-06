import { Request, Response, NextFunction } from 'express';
import { waqiService } from '../services/waqi.service';
import { owmService } from '../services/owm.service';
import { cacheService } from '../services/cache.service';
import axios from 'axios';
import { env } from '../config/env';

export const getLiveAQIByCity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city } = req.params;
    const data = await waqiService.getCityFeed(city);
    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getMapData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat1, lon1, lat2, lon2 } = req.query;
    if (!lat1 || !lon1 || !lat2 || !lon2) {
      return res.status(400).json({ status: 'error', message: 'Missing coordinates' });
    }
    const data = await waqiService.getMapBounds(
      Number(lat1), Number(lon1), Number(lat2), Number(lon2)
    );
    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getPollutantBreakdown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ status: 'error', message: 'Missing coordinates' });
    }
    const data = await owmService.getCurrentAirPollution(Number(lat), Number(lon));
    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/aqi/history?lat=&lon=&days=
 * Returns daily average AQI for the past N days (default 30)
 * using OWM Air Pollution History API — free, accurate, no extra key.
 */
export const getAQIHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 28.6139;
    const lon = parseFloat(req.query.lon as string) || 77.2090;
    const days = Math.min(parseInt(req.query.days as string) || 30, 90); // cap at 90

    const cacheKey = `aqi:history:${Math.round(lat * 10) / 10}:${Math.round(lon * 10) / 10}:${days}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return res.json({ status: 'success', data: cached });

    // OWM Air Pollution History API — free tier, up to 1 year back
    const endTs = Math.floor(Date.now() / 1000);
    const startTs = endTs - days * 86400;

    const response = await axios.get('http://api.openweathermap.org/data/2.5/air_pollution/history', {
      params: {
        lat,
        lon,
        start: startTs,
        end: endTs,
        appid: env.OWM_API_KEY,
      },
    });

    const list: Array<{ dt: number; main: { aqi: number }; components: Record<string, number> }> =
      response.data?.list || [];

    // Group into daily averages
    const dailyMap: Record<string, { aqiSum: number; count: number; pm25Sum: number; pm10Sum: number }> = {};

    for (const entry of list) {
      const date = new Date(entry.dt * 1000).toISOString().split('T')[0];
      if (!dailyMap[date]) dailyMap[date] = { aqiSum: 0, count: 0, pm25Sum: 0, pm10Sum: 0 };

      // OWM AQI is 1-5 scale; convert to 0-500 US AQI approximation using PM2.5
      const pm25 = entry.components?.pm2_5 ?? 0;
      const approximateAqi = pm25ToAQI(pm25);

      dailyMap[date].aqiSum += approximateAqi;
      dailyMap[date].pm25Sum += pm25;
      dailyMap[date].pm10Sum += entry.components?.pm10 ?? 0;
      dailyMap[date].count += 1;
    }

    const history = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        aqi: Math.round(v.aqiSum / v.count),
        pm25: Math.round((v.pm25Sum / v.count) * 10) / 10,
        pm10: Math.round((v.pm10Sum / v.count) * 10) / 10,
      }));

    // Cache for 3 hours (history doesn't change frequently)
    await cacheService.set(cacheKey, history, 10800);
    res.json({ status: 'success', data: history });
  } catch (error) {
    next(error);
  }
};

/**
 * Convert PM2.5 (µg/m³) to US AQI using EPA breakpoints.
 * This gives a much more accurate and recognizable AQI value than OWM's 1-5 scale.
 */
function pm25ToAQI(pm25: number): number {
  const breakpoints = [
    { cLow: 0.0,   cHigh: 12.0,  iLow: 0,   iHigh: 50  },
    { cLow: 12.1,  cHigh: 35.4,  iLow: 51,  iHigh: 100 },
    { cLow: 35.5,  cHigh: 55.4,  iLow: 101, iHigh: 150 },
    { cLow: 55.5,  cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
    { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
  ];

  const bp = breakpoints.find((b) => pm25 >= b.cLow && pm25 <= b.cHigh);
  if (!bp) return pm25 > 500 ? 500 : 0;

  return Math.round(
    ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow
  );
}
