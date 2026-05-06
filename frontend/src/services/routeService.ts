import axios from 'axios';
import { API_CONFIG } from '../config/constants';

const api = axios.create({
  baseURL: `${API_CONFIG.BACKEND_URL}/api/routes`,
});

export const routeService = {
  findCleanRoute: async (start: [number, number], end: [number, number]) => {
    const response = await api.post('/find', { start, end });
    return response.data.data;
  },
};
