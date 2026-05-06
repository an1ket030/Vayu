import axios from 'axios';
import { API_CONFIG } from '../config/constants';

const api = axios.create({
  baseURL: `${API_CONFIG.BACKEND_URL}/api/aqi`,
});

export const waqiService = {
  getFeed: async (city: string) => {
    const response = await api.get(`/feed/${city}`);
    return response.data.data;
  },
  getMapBounds: async (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const response = await api.get('/map', {
      params: { lat1, lon1, lat2, lon2 },
    });
    return response.data.data;
  },
};
