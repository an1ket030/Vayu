import axios from 'axios';
import { env } from '../config/env';
import { cacheService } from './cache.service';

const OWM_BASE_URL = 'http://api.openweathermap.org/data/2.5';

export const owmService = {
  getCurrentAirPollution: async (lat: number, lon: number) => {
    const cacheKey = `owm:pollution:${lat}:${lon}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    const response = await axios.get(`${OWM_BASE_URL}/air_pollution`, {
      params: {
        lat,
        lon,
        appid: env.OWM_API_KEY,
      },
    });

    await cacheService.set(cacheKey, response.data, 900); // 15 mins
    return response.data;
  },

  getForecastAirPollution: async (lat: number, lon: number) => {
    const cacheKey = `owm:forecast:pollution:${lat}:${lon}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    const response = await axios.get(`${OWM_BASE_URL}/air_pollution/forecast`, {
      params: {
        lat,
        lon,
        appid: env.OWM_API_KEY,
      },
    });

    await cacheService.set(cacheKey, response.data, 21600); // 6 hours
    return response.data;
  },

  getWeatherForecast: async (lat: number, lon: number) => {
    const cacheKey = `owm:weather:${lat}:${lon}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    const response = await axios.get(`${OWM_BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        appid: env.OWM_API_KEY,
        units: 'metric',
      },
    });

    await cacheService.set(cacheKey, response.data, 10800); // 3 hours
    return response.data;
  },
};
