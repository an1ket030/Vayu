import axios from 'axios';
import { env } from '../config/env';
import { cacheService } from './cache.service';

const ORS_BASE_URL = 'https://api.openrouteservice.org';

export const orsService = {
  getDirections: async (coordinates: number[][], profile = 'driving-car') => {
    const cacheKey = `ors:directions:${JSON.stringify(coordinates)}:${profile}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    const response = await axios.post(
      `${ORS_BASE_URL}/v2/directions/${profile}/geojson`,
      {
        coordinates,
        alternative_routes: {
          share_factor: 0.6,
          target_count: 3,
          weight_factor: 1.6,
        },
      },
      {
        headers: {
          Authorization: env.ORS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    await cacheService.set(cacheKey, response.data, 1800); // 30 mins
    return response.data;
  },
};
