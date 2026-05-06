export const API_CONFIG = {
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000',
  WAQI_TOKEN: import.meta.env.VITE_WAQI_TOKEN,
  OWM_API_KEY: import.meta.env.VITE_OWM_API_KEY,
};

export const AQI_LEVELS = [
  { min: 0, max: 50, label: 'Good', color: '#00e400', textColor: '#000' },
  { min: 51, max: 100, label: 'Moderate', color: '#ffff00', textColor: '#000' },
  { min: 101, max: 150, label: 'Unhealthy for Sensitive Groups', color: '#ff7e00', textColor: '#fff' },
  { min: 151, max: 200, label: 'Unhealthy', color: '#ff0000', textColor: '#fff' },
  { min: 201, max: 300, label: 'Very Unhealthy', color: '#8f3f97', textColor: '#fff' },
  { min: 301, max: 500, label: 'Hazardous', color: '#7e0023', textColor: '#fff' },
];

export const WHO_LIMITS = {
  PM25: 15, // 24h mean
  PM10: 45, // 24h mean
};

export const DELHI_BOUNDS = {
  sw: [28.40, 76.84],
  ne: [28.88, 77.35],
};
