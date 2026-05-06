import axios from 'axios';
import { API_CONFIG } from '../config/constants';
import { supabase } from './supabaseClient';

const api = axios.create({
  baseURL: API_CONFIG.BACKEND_URL + '/api',
});

// Automatically attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const waqiService = {
  getFeed: async (city: string) => {
    const response = await api.get(`/aqi/feed/${city}`);
    return response.data.data;
  },
  getMapBounds: async (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const response = await api.get('/aqi/map', {
      params: { lat1, lon1, lat2, lon2 },
    });
    return response.data.data;
  },
};

export const owmService = {
  getPollutants: async (lat: number, lon: number) => {
    const response = await api.get('/aqi/pollutants', {
      params: { lat, lon },
    });
    return response.data.data;
  },
};

export const routeService = {
  findCleanRoute: async (start: [number, number], end: [number, number]) => {
    const response = await api.post('/routes/find', { start, end });
    return response.data.data;
  },
};

export const exposureService = {
  logExposure: async (data: { lat: number; lon: number; aqi: number; category: string; durationSec: number }) => {
    const response = await api.post('/exposure/log', data);
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/exposure/history');
    return response.data.data;
  }
};

export const nominatimService = {
  reverseGeocode: async (lat: number, lon: number) => {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon, format: 'json' },
    });
    return response.data;
  },
  search: async (query: string) => {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: query, format: 'json', limit: 5 },
    });
    return response.data;
  },
};

export default api;
