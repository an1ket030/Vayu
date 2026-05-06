import axios from 'axios';
import { API_CONFIG } from '../config/constants';

const api = axios.create({
  baseURL: `${API_CONFIG.BACKEND_URL}/api/aqi`,
});

export const owmService = {
  getPollutants: async (lat: number, lon: number) => {
    const response = await api.get('/pollutants', {
      params: { lat, lon },
    });
    return response.data.data;
  },
};
