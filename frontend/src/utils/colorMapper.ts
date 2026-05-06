import { AQI_LEVELS } from '../config/constants';

export const getColorForAQI = (aqi: number) => {
  const level = AQI_LEVELS.find((l) => aqi >= l.min && aqi <= l.max);
  return level || AQI_LEVELS[AQI_LEVELS.length - 1];
};

export const getAQICategory = (aqi: number) => {
  const level = AQI_LEVELS.find((l) => aqi >= l.min && aqi <= l.max);
  return level ? level.label : 'Unknown';
};
