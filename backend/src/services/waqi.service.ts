import axios from 'axios';
import { env } from '../config/env';
import { cacheService } from './cache.service';

const WAQI_BASE_URL = 'https://api.waqi.info';

export const waqiService = {
  getCityFeed: async (city: string): Promise<any> => {
    const cacheKey = `waqi:feed:${city}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    try {
      const response = await axios.get(`${WAQI_BASE_URL}/feed/${city}/`, {
        params: { token: env.WAQI_TOKEN },
        timeout: 10_000,
      });

      if (response.data.status === 'ok') {
        await cacheService.set(cacheKey, response.data.data, 900); // 15 mins
        return response.data.data;
      }
      
      throw new Error(`WAQI API status error: ${JSON.stringify(response.data.data)}`);
    } catch (error) {
      if (city.startsWith('geo:')) {
        const [lat, lon] = city.replace('geo:', '').split(';');
        if (lat && lon) {
          try {
            console.log(`WAQI geo lookup failed for ${city}, attempting reverse geocoding...`);
            const geoRes = await axios.get(`http://api.openweathermap.org/geo/1.0/reverse`, {
              params: { lat, lon, limit: 1, appid: env.OWM_API_KEY }
            });
            
            if (geoRes.data && geoRes.data.length > 0) {
              const cityName = geoRes.data[0].name;
              console.log(`Reverse geocoded to ${cityName}, retrying WAQI API...`);
              const fallbackData = await waqiService.getCityFeed(cityName);
              await cacheService.set(cacheKey, fallbackData, 900);
              return fallbackData;
            }
          } catch (fallbackError) {
            console.error('Reverse geocoding fallback failed:', fallbackError);
          }
        }
      } else if (!city.startsWith('@')) {
        // Fallback for regular text search (e.g. city name)
        try {
          console.log(`WAQI feed lookup failed for ${city}, attempting keyword search...`);
          const searchRes = await waqiService.searchStations(city);
          if (searchRes && searchRes.length > 0) {
            const bestMatch = searchRes[0];
            console.log(`Search found station ${bestMatch.uid} for ${city}, retrying...`);
            // Fetch by uid
            const fallbackData = await waqiService.getCityFeed(`@${bestMatch.uid}`);
            await cacheService.set(cacheKey, fallbackData, 900);
            return fallbackData;
          }
        } catch (searchError) {
          console.error('Keyword search fallback failed:', searchError);
        }
      }
      throw error;
    }
  },

  getMapBounds: async (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const cacheKey = `waqi:map:${lat1}:${lon1}:${lat2}:${lon2}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    // Retry up to 3 times with 1s delay to handle transient DNS/network errors
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await axios.get(`${WAQI_BASE_URL}/map/bounds/`, {
          params: {
            token: env.WAQI_TOKEN,
            latlng: `${lat1},${lon1},${lat2},${lon2}`,
          },
          timeout: 10_000,
        });

        if (response.data.status === 'ok') {
          await cacheService.set(cacheKey, response.data.data, 900);
          return response.data.data;
        }
        // Non-ok status — don't retry, just return empty
        console.warn(`[WAQI] Map bounds returned status: ${response.data.status}`);
        return [];
      } catch (err: any) {
        const isNetworkError = err.code === 'ENOTFOUND' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT';
        if (isNetworkError && attempt < MAX_RETRIES) {
          console.warn(`[WAQI] Map bounds network error (attempt ${attempt}/${MAX_RETRIES}), retrying...`);
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        // All retries exhausted — return empty so the map still renders
        console.error(`[WAQI] Map bounds failed after ${attempt} attempt(s):`, err.message);
        return [];
      }
    }
    return [];
  },

  searchStations: async (keyword: string) => {
    const response = await axios.get(`${WAQI_BASE_URL}/search/`, {
      params: {
        token: env.WAQI_TOKEN,
        keyword,
      },
      timeout: 10_000,
    });

    if (response.data.status === 'ok') {
      return response.data.data;
    }
    throw new Error(`WAQI API error: ${response.data.data}`);
  },
};
