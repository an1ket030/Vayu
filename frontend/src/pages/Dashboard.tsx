import { useAQI } from '@/hooks/useAQI';
import { useAQIStore } from '@/store/useAQIStore';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import AQIGauge from '@/components/aqi/AQIGauge';
import PollutantGrid from '@/components/aqi/PollutantGrid';
import EarlyWarningBanner from '@/components/aqi/EarlyWarningBanner';
import HealthAdvisory from '@/components/aqi/HealthAdvisory';
import HistoricalTrendChart from '@/components/charts/HistoricalTrendChart';
import { getColorForAQI } from '@/utils/colorMapper';
import { Wind, Thermometer, Droplets, Eye, RefreshCw, MapPin, Loader2, Globe } from 'lucide-react';
import axios from 'axios';
import { API_CONFIG } from '@/config/constants';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// Reverse geocode using Nominatim — builds a human-readable address
async function getCityName(lat: number, lon: number): Promise<string> {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=14`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await resp.json();
    const addr = data.address || {};

    // Build: "Suburb, City, State" for maximum accuracy
    const parts: string[] = [];
    if (addr.suburb || addr.neighbourhood || addr.quarter)
      parts.push(addr.suburb || addr.neighbourhood || addr.quarter);
    if (addr.city || addr.town || addr.village || addr.county)
      parts.push(addr.city || addr.town || addr.village || addr.county);
    if (addr.state) parts.push(addr.state);
    if (addr.country_code?.toUpperCase()) parts.push(addr.country_code.toUpperCase());

    return parts.length > 0 ? parts.join(', ') : (data.display_name?.split(',')[0] || 'Your Location');
  } catch {
    return 'Your Location';
  }
}

import { useSearchParams } from 'react-router-dom';

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const cityParam = searchParams.get('city');

  // Location state — try user GPS first, fall back to Delhi
  const [userLocation, setUserLocation] = useState<{
    lat: number; lon: number; cityName: string; isUserLocation: boolean;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // The AQI feed key: city param first, geo:lat;lon for GPS, 'delhi' for fallback
  const feedKey = cityParam
    ? cityParam.trim()
    : userLocation
    ? `geo:${userLocation.lat};${userLocation.lon}`
    : 'delhi'; // default until geolocation resolves

  const { data, isLoading, error, refetch } = useAQI(feedKey);
  const setAQIData = useAQIStore((state) => state.setAQIData);

  // Detect user location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: 28.6139, lon: 77.2090, cityName: 'Delhi, India', isUserLocation: false });
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const cityName = await getCityName(lat, lon);
        setUserLocation({ lat, lon, cityName, isUserLocation: true });
        setLocationLoading(false);
      },
      () => {
        // Permission denied or unavailable — silently use Delhi
        setUserLocation({ lat: 28.6139, lon: 77.2090, cityName: 'Delhi, India', isUserLocation: false });
        setLocationLoading(false);
      },
      { timeout: 8000, maximumAge: 10_000, enableHighAccuracy: true }  // 10s cache, high accuracy
    );
  }, []);

  const { data: forecastData } = useQuery({
    queryKey: ['forecast', feedKey, userLocation?.lat, userLocation?.lon],
    queryFn: async () => {
      const params = new URLSearchParams({ });
      if (userLocation?.lat) params.set('lat', String(userLocation.lat));
      if (userLocation?.lon) params.set('lon', String(userLocation.lon));
      const response = await axios.get(
        `${API_CONFIG.BACKEND_URL}/api/forecast/${feedKey.replace(':', '_')}?${params}`
      );
      return response.data;
    },
    enabled: !!userLocation,
    refetchInterval: 6 * 60 * 60 * 1000, // 6 hours
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setAQIData({
        aqi: data.aqi,
        name: data.city?.name || userLocation?.cityName || 'Delhi',
        pollutants: data.iaqi,
      });
    }
  }, [data, setAQIData, userLocation]);

  if (locationLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-3">
        <Loader2 className="animate-spin text-primary" size={24} />
        <span className="text-muted-foreground text-lg">Detecting your location…</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-3">
        <Loader2 className="animate-spin text-primary" size={24} />
        <span className="text-muted-foreground text-lg">Fetching live AQI data…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4 p-5 border-2 border-destructive/40 rounded-2xl bg-destructive/5">
          <div className="flex-1">
            <h2 className="text-base font-bold text-destructive">Could not load air quality data</h2>
            <p className="text-muted-foreground text-sm mt-1">
              The backend returned no data for <code className="bg-muted px-1 rounded">{feedKey}</code>.
              Ensure <code className="bg-muted px-1 rounded">WAQI_TOKEN</code> is set in <code className="bg-muted px-1 rounded">backend/.env</code> and the backend container is running.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const aqi = typeof data.aqi === 'number' ? data.aqi : parseInt(data.aqi) || 0;
  const { label, color } = getColorForAQI(aqi);
  const cityName = data.city?.name || userLocation?.cityName || 'Delhi';
  const lastUpdated = data.time?.s
    ? new Date(data.time.s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  const pollutants = {
    pm25: data.iaqi?.pm25?.v,
    pm10: data.iaqi?.pm10?.v,
    no2: data.iaqi?.no2?.v,
    o3: data.iaqi?.o3?.v,
    so2: data.iaqi?.so2?.v,
    co: data.iaqi?.co?.v,
  };

  const next24h = forecastData?.next_24h?.slice(0, 12) || [];

  // Normalize ML service warning levels to the banner's accepted enum
  const WARNING_LEVEL_MAP: Record<string, 'NONE' | 'WATCH' | 'WARNING' | 'EMERGENCY'> = {
    NONE: 'NONE',
    GOOD: 'NONE',
    MODERATE: 'NONE',
    UNHEALTHY_SENSITIVE: 'WATCH',
    UNHEALTHY: 'WATCH',
    VERY_UNHEALTHY: 'WARNING',
    HAZARDOUS: 'EMERGENCY',
    // pass-through for already-normalized values
    WATCH: 'WATCH',
    WARNING: 'WARNING',
    EMERGENCY: 'EMERGENCY',
  };
  const rawWarningLevel: string = forecastData?.warning_level || 'NONE';
  const warningLevel: 'NONE' | 'WATCH' | 'WARNING' | 'EMERGENCY' =
    WARNING_LEVEL_MAP[rawWarningLevel] ?? 'NONE';

  const warningMessages: Record<string, string> = {
    WATCH: 'AQI is predicted to reach unhealthy levels. Limit prolonged outdoor exposure, especially for sensitive groups.',
    WARNING: 'AQI predicted to exceed 200 (Very Unhealthy). Sensitive groups should avoid outdoor activity.',
    EMERGENCY: 'EMERGENCY: AQI predicted to exceed 300 (Hazardous). Avoid all outdoor activity. N95 mask mandatory.',
  };
  // Model accuracy from ML service (e.g. 0.93 = 93%)
  const modelAccuracy = forecastData?.model_accuracy;
  // Check if forecast is training
  const forecastTraining = forecastData?.status === 'training';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">Air Quality Dashboard</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted-foreground flex items-center gap-1">
              <MapPin size={14} />
              {cityName} · Updated at {lastUpdated}
            </p>
            {userLocation?.isUserLocation ? (
              <span className="text-[10px] bg-green-500/10 text-green-600 border border-green-500/20 px-2 py-0.5 rounded-full font-medium">
                📍 Your Location
              </span>
            ) : (
              <span className="text-[10px] bg-surface-dim border border-white/5 text-muted-foreground px-2 py-0.5 rounded-full font-mono">
                Default location
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-surface-dim hover:bg-white/5 border border-white/5 rounded-md text-sm font-medium transition-colors font-mono"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Warning Banner */}
      {warningLevel !== 'NONE' && (
        <EarlyWarningBanner
          level={warningLevel}
          message={warningMessages[warningLevel] || 'Air quality alert active.'}
        />
      )}

      {/* Forecast training notice */}
      {forecastTraining && (
        <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-xl px-4 py-3 text-sm">
          <Loader2 size={16} className="animate-spin shrink-0" />
          <span>
            <strong>Training AI model for {cityName}…</strong> This usually takes 3–5 minutes for a new location.
            Forecast will appear automatically when ready.
          </span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AQI Gauge Card */}
        <div className="data-card p-6 flex flex-col items-center">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Current AQI
          </span>
          <AQIGauge aqi={aqi} />
          <div
            className="mt-4 px-5 py-1.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: color + '22', color }}
          >
            {label}
          </div>
          {modelAccuracy && (
            <p className="text-[10px] text-muted-foreground mt-3">
              <Globe size={9} className="inline mr-1" />
              Forecast model accuracy: <strong>{(modelAccuracy * 100).toFixed(0)}% R²</strong>
            </p>
          )}
        </div>

        {/* Pollutant Breakdown */}
        <div className="md:col-span-2 data-card p-6">
          <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Pollutant Breakdown
          </h3>
          <PollutantGrid pollutants={pollutants} />
        </div>
      </div>

      {/* Weather Attribution Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Wind size={18} />, label: 'Wind Speed', value: data.iaqi?.w ? `${data.iaqi.w.v} m/s` : 'N/A' },
          { icon: <Thermometer size={18} />, label: 'Temperature', value: data.iaqi?.t ? `${data.iaqi.t.v}°C` : 'N/A' },
          { icon: <Droplets size={18} />, label: 'Humidity', value: data.iaqi?.h ? `${data.iaqi.h.v}%` : 'N/A' },
          { icon: <Eye size={18} />, label: 'Dominant Pollutant', value: data.dominentpol?.toUpperCase() || 'PM2.5' },
        ].map((item) => (
          <div key={item.label} className="data-card p-4 flex gap-3 items-start">
            <div className="p-2 bg-surface-container rounded-lg text-primary">{item.icon}</div>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
              <p className="text-sm font-display font-bold mt-0.5">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Health Advisory — always shown based on current AQI */}
      <HealthAdvisory aqi={aqi} />

      {/* Historical Trend — real 30d data from OWM */}
      {userLocation && (
        <HistoricalTrendChart
          lat={userLocation.lat}
          lon={userLocation.lon}
          days={30}
        />
      )}

      {/* 24h Forecast Trend */}
      {next24h.length > 0 && (
        <div className="data-card p-6">
          <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-muted-foreground mb-6">
            Next 12-Hour AQI Trend
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={next24h}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                  }}
                  formatter={(v: any, name: string) => [
                    `${Math.round(v)} AQI`,
                    name === 'aqi' ? 'Predicted AQI' : name,
                  ]}
                  labelFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
                <Line
                  type="monotone"
                  dataKey="aqi"
                  stroke={color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
