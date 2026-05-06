import axios from 'axios';

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
