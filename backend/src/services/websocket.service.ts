import { io } from '../index';

export const websocketService = {
  broadcastAQIUpdate: (data: any) => {
    io.emit('aqi:update', data);
  },

  broadcastWarning: (data: any) => {
    io.emit('warning:issued', data);
  },

  broadcastForecastUpdate: (data: any) => {
    io.emit('forecast:updated', data);
  },
};
