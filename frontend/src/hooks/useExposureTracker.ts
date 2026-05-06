import { useState, useCallback, useRef } from 'react';
import { useExposureStore } from '../store/useExposureStore';
import { waqiService, exposureService } from '../services/api.service';
import { supabase } from '../services/supabaseClient';

export type TrackingStatus = 'idle' | 'requesting_permission' | 'tracking' | 'error';

interface LocationInfo {
  lat: number;
  lon: number;
  cityName?: string;
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await resp.json();
    return (
      data.address?.suburb ||
      data.address?.city_district ||
      data.address?.city ||
      data.address?.town ||
      data.address?.county ||
      'Your Location'
    );
  } catch {
    return 'Your Location';
  }
}

export const useExposureTracker = () => {
  const addLog = useExposureStore((state) => state.addLog);
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [currentAQI, setCurrentAQI] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTracking = status === 'tracking';

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus('idle');
    setCurrentAQI(null);
  }, []);

  const doTrack = useCallback(async (loc: LocationInfo) => {
    try {
      const data = await waqiService.getFeed(`geo:${loc.lat};${loc.lon}`);
      const aqi = typeof data.aqi === 'number' ? data.aqi : parseInt(data.aqi) || 0;
      setCurrentAQI(aqi);

      const log = {
        lat: loc.lat,
        lon: loc.lon,
        aqi,
        category: data.dominentpol || 'pm25',
        durationSec: 60,
        recordedAt: new Date().toISOString(),
      };

      // Always persist locally via Zustand (localStorage)
      addLog(log);

      // Sync to Supabase if authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        try {
          await exposureService.logExposure({
            lat: log.lat,
            lon: log.lon,
            aqi: log.aqi,
            category: log.category,
            durationSec: log.durationSec,
          });
        } catch (apiErr) {
          console.warn('[ExposureTracker] Backend sync failed:', apiErr);
        }
      }
    } catch (err) {
      console.error('[ExposureTracker] Track tick failed:', err);
    }
  }, [addLog]);

  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setStatus('error');
      return;
    }

    setStatus('requesting_permission');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Get human-readable location name
        const cityName = await reverseGeocode(lat, lon);
        const loc: LocationInfo = { lat, lon, cityName };
        setLocation(loc);
        setStatus('tracking');

        // First immediate reading
        await doTrack(loc);

        // Then every 60 seconds
        intervalRef.current = setInterval(() => doTrack(loc), 60_000);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission denied. Please allow location access in your browser settings and try again.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Your location could not be determined. Please check your GPS or network.');
        } else {
          setError('Location request timed out. Please try again.');
        }
        setStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0,
      }
    );
  }, [doTrack]);

  return {
    status,
    isTracking,
    error,
    location,
    currentAQI,
    startTracking,
    stopTracking,
  };
};
