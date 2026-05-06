import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/constants';
import { useAQIStore } from '../store/useAQIStore';
import { useNotificationStore } from '../store/useNotificationStore';

// AQI thresholds that trigger notifications
const WARNING_THRESHOLDS = [
  { aqi: 300, type: 'emergency' as const, label: 'Hazardous' },
  { aqi: 200, type: 'warning' as const, label: 'Very Unhealthy' },
  { aqi: 150, type: 'warning' as const, label: 'Unhealthy' },
];

// Track which stations we've already warned about to avoid repeated alerts
const _warnedStations = new Map<string, number>(); // stationId -> last warned AQI level

export const useWebSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket: Socket = io(API_CONFIG.BACKEND_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to CleanAir backend');
    });

    socket.on('disconnect', (reason) => {
      console.warn('[WebSocket] Disconnected:', reason);
    });

    // --- AQI real-time update ---
    socket.on('aqi:update', (data: any[]) => {
      useAQIStore.getState().setStations(data);

      // Check each station for threshold crossings
      const addNotification = useNotificationStore.getState().addNotification;

      for (const station of data) {
        const stationAqi = typeof station.aqi === 'number' ? station.aqi : parseInt(station.aqi);
        if (!stationAqi || isNaN(stationAqi)) continue;

        const stationId = station.uid || station.station?.name || 'Unknown';
        const stationName = station.station?.name || `Station ${stationId}`;

        // Find the highest applicable threshold
        const trigger = WARNING_THRESHOLDS.find((t) => stationAqi >= t.aqi);
        if (!trigger) continue;

        // Only notify once per threshold per station (avoid repeated alerts for same condition)
        const lastWarned = _warnedStations.get(stationId) ?? 0;
        if (stationAqi <= lastWarned + 20) continue; // must rise 20 more to re-trigger

        _warnedStations.set(stationId, stationAqi);

        addNotification({
          type: trigger.type,
          title: `${trigger.label} Air Quality — ${stationName}`,
          message: `AQI has reached ${stationAqi}. ${
            trigger.aqi >= 300
              ? 'Stay indoors and avoid all outdoor activity. Run air purifier at maximum.'
              : trigger.aqi >= 200
              ? 'Everyone may experience health effects. Avoid prolonged outdoor exertion.'
              : 'Sensitive groups should limit outdoor activity. Wear N95 if going outside.'
          }`,
          station: stationName,
          aqi: stationAqi,
        });
      }
    });

    // --- Warning issued by backend ---
    socket.on('warning:issued', (payload: any) => {
      useNotificationStore.getState().addNotification({
        type: payload.level === 'EMERGENCY' ? 'emergency' : 'warning',
        title: `Air Quality Alert: ${payload.station || 'Your Area'}`,
        message: payload.message || `AQI reached ${payload.aqi}. Take precautions.`,
        station: payload.station,
        aqi: payload.aqi,
      });
    });

    // --- Forecast updated ---
    socket.on('forecast:updated', (payload: any) => {
      useNotificationStore.getState().addNotification({
        type: 'info',
        title: '7-Day Forecast Updated',
        message: `New AI forecast available${payload?.station ? ` for ${payload.station}` : ''}. Check the forecast tab for details.`,
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);
};
