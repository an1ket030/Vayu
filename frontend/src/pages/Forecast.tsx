import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '@/config/constants';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';
import { getColorForAQI } from '@/utils/colorMapper';
import { Calendar, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, Clock, MapPin, Loader2 } from 'lucide-react';

async function getCityName(lat: number, lon: number): Promise<string> {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await resp.json();
    return data.address?.city || data.address?.town || data.address?.state || 'Your Location';
  } catch { return 'Your Location'; }
}

const Forecast = () => {
  const [location, setLocation] = useState<{ lat: number; lon: number; city: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: 28.6139, lon: 77.209, city: 'Delhi, India' });
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const city = await getCityName(lat, lon);
        setLocation({ lat, lon, city });
        setLocationLoading(false);
      },
      () => {
        setLocation({ lat: 28.6139, lon: 77.209, city: 'Delhi, India' });
        setLocationLoading(false);
      },
      { timeout: 5000, maximumAge: 300_000 }
    );
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['forecast', location?.lat, location?.lon],
    queryFn: async () => {
      const resp = await axios.post(`${API_CONFIG.BACKEND_URL}/api/forecast/location`, {
        lat: location!.lat,
        lon: location!.lon,
      });
      // Handle 202 training status gracefully
      if (resp.status === 202 || resp.data?.status === 'training') {
        return { _training: true, ...resp.data };
      }
      return resp.data.data ?? resp.data;
    },
    enabled: !!location,
    refetchInterval: 6 * 60 * 60 * 1000,
    retry: false,
  });

  if (locationLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-3">
        <Loader2 className="animate-spin text-primary" size={24} />
        <span className="text-muted-foreground text-lg">Detecting your location&hellip;</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-3">
        <RefreshCw className="animate-spin text-primary" size={24} />
        <span className="text-muted-foreground text-lg">Loading ML predictions for {location?.city}&hellip;</span>
      </div>
    );
  }

  if (error || !data) {
    // Check if it's a training-in-progress 202 response
    const axiosErr = error as any;
    const isTraining = axiosErr?.response?.status === 202 || data?._training;
    if (isTraining) {
      return (
        <div className="p-8 border-2 border-blue-500/30 rounded-2xl bg-blue-500/5 max-w-lg mx-auto mt-20">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="animate-spin text-blue-500" size={20} />
            <h2 className="text-xl font-bold text-blue-600">Training model for {location?.city}</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            This is your first forecast request for this location. The AI model is training on
            90 days of OWM historical data — this usually takes 3–5 minutes.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium"
          >
            <RefreshCw size={14} /> Check Again
          </button>
        </div>
      );
    }
    return (
      <div className="p-8 border-2 border-destructive/50 rounded-2xl bg-destructive/5 max-w-lg mx-auto mt-20">
        <h2 className="text-xl font-bold text-destructive mb-2">ML Service Unavailable</h2>
        <p className="text-muted-foreground text-sm">
          The prediction service could not be reached. Ensure the ML microservice is running.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const next7d: Array<{ timestamp: string; aqi: number; confidence: number }> = data?.next_7d || [];
  const next24h: Array<{ timestamp: string; aqi: number; confidence: number }> = data?.next_24h || [];

  // Compute summary stats from real data
  const aqiValues = next7d.map((d) => d.aqi);
  const peakAqi = aqiValues.length > 0 ? Math.max(...aqiValues) : null;
  const weeklyAvg = aqiValues.length > 0 ? Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length) : null;
  const peakAqiDay = next7d.find((d) => d.aqi === peakAqi);

  // Trend: compare first half vs second half of week
  const firstHalf = aqiValues.slice(0, Math.ceil(aqiValues.length / 2));
  const secondHalf = aqiValues.slice(Math.ceil(aqiValues.length / 2));
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
  const trendPct = avgFirst > 0 ? Math.round(((avgSecond - avgFirst) / avgFirst) * 100) : 0;
  const isTrendUp = trendPct > 0;

  const peakColor = peakAqi ? getColorForAQI(peakAqi).color : '#888';
  const avgColor = weeklyAvg ? getColorForAQI(weeklyAvg).color : '#888';

  // Worst day label
  const worstDay = peakAqiDay
    ? new Date(peakAqiDay.timestamp).toLocaleDateString([], { weekday: 'long' })
    : null;

  const rawWarningLevel: string = data?.warning_level || 'NONE';
  // Map ML service levels to human-friendly display labels and colors
  const LEVEL_LABELS: Record<string, { label: string; color: string }> = {
    NONE:                { label: 'Good',           color: 'text-green-500' },
    GOOD:                { label: 'Good',           color: 'text-green-500' },
    MODERATE:            { label: 'Moderate',       color: 'text-yellow-400' },
    UNHEALTHY_SENSITIVE: { label: 'Unhealthy (Sensitive)', color: 'text-orange-400' },
    UNHEALTHY:           { label: 'Unhealthy',      color: 'text-orange-500' },
    VERY_UNHEALTHY:      { label: 'Very Unhealthy', color: 'text-red-500' },
    HAZARDOUS:           { label: 'Hazardous',      color: 'text-red-700' },
    WATCH:               { label: 'Watch',          color: 'text-yellow-400' },
    WARNING:             { label: 'Warning',        color: 'text-orange-500' },
    EMERGENCY:           { label: 'Emergency',      color: 'text-red-600' },
  };
  const levelInfo = LEVEL_LABELS[rawWarningLevel] ?? { label: rawWarningLevel, color: 'text-muted-foreground' };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight">7-Day Air Quality Forecast</h2>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 font-mono text-xs">
            <MapPin size={14} />
            {location?.city} &middot; XGBoost predictions from OWM historical patterns
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-surface-container hover:bg-surface-dim rounded-md text-sm font-medium transition-colors border border-border"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="data-card p-6 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
            7-Day Peak AQI
          </span>
          <div className="mt-2">
            <span className="text-4xl font-black" style={{ color: peakColor }}>
              {peakAqi !== null ? Math.round(peakAqi) : '—'}
            </span>
            <span className="text-xs font-bold text-muted-foreground ml-2">AQI</span>
          </div>
          {worstDay && (
            <div className="flex items-center gap-2 mt-4 text-muted-foreground text-xs font-bold">
              <Calendar size={14} />
              Expected on {worstDay}
            </div>
          )}
        </div>

        <div className="data-card p-6 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
            Weekly Average
          </span>
          <div className="mt-2">
            <span className="text-4xl font-black" style={{ color: avgColor }}>
              {weeklyAvg !== null ? weeklyAvg : '—'}
            </span>
            <span className="text-xs font-bold text-muted-foreground ml-2">AQI</span>
          </div>
          {trendPct !== 0 && (
            <div
              className={`flex items-center gap-2 mt-4 text-xs font-bold ${isTrendUp ? 'text-red-500' : 'text-green-600'}`}
            >
              {isTrendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(trendPct)}% {isTrendUp ? 'rising' : 'falling'} vs start of week
            </div>
          )}
        </div>

        <div className="data-card p-6 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
            Alert Status
          </span>
          <div className="mt-2">
            <span className={`text-xl font-black ${levelInfo.color}`}>
              {levelInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-4 text-muted-foreground text-xs font-bold">
            <Clock size={14} />
            Next 24h outlook
          </div>
        </div>

        <div className="md:col-span-1 bg-surface-container/50 border border-border rounded-xl p-6 flex items-start gap-3">
          <AlertTriangle className="text-primary shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-sm mb-1 font-display">Model Info</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Predictions use XGBoost trained on 24-month OWM historical data with lag & rolling features.
            </p>
          </div>
        </div>
      </div>

      {/* Next 24h Line Chart */}
      {next24h.length > 0 && (
        <div className="data-card p-8">
          <h3 className="text-lg font-display font-bold mb-6 flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            24-Hour Hourly AQI Prediction
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={next24h}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(val) =>
                    new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-mono)' }}
                  interval={3}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-mono)' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  cursor={{ stroke: 'hsl(var(--border))' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                  }}
                  labelFormatter={(val) =>
                    new Date(val).toLocaleTimeString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
                  }
                  formatter={(val: number) => [Math.round(val), 'AQI']}
                />
                <ReferenceLine y={150} stroke="#ff7e00" strokeDasharray="4 4" label={{ value: 'Unhealthy', fontSize: 10, fill: '#ff7e00' }} />
                <ReferenceLine y={300} stroke="#7e0023" strokeDasharray="4 4" label={{ value: 'Hazardous', fontSize: 10, fill: '#7e0023' }} />
                <Line
                  type="monotone"
                  dataKey="aqi"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 7-Day Bar Chart */}
      {next7d.length > 0 && (
        <div className="data-card p-8">
          <h3 className="text-lg font-display font-bold mb-8 flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Weekly AQI Outlook
          </h3>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={next7d}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(val) =>
                    new Date(val).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
                  }
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-mono)' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-mono)' }}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                  }}
                  labelFormatter={(val) =>
                    new Date(val).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
                  }
                  formatter={(val: number) => [Math.round(val), 'AQI']}
                />
                <Bar dataKey="aqi" radius={[6, 6, 0, 0]} barSize={40}>
                  {next7d.map((entry, index) => (
                    <Cell key={index} fill={getColorForAQI(entry.aqi).color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Day Cards */}
      {next7d.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {next7d.map((day, i) => {
            const { label, color } = getColorForAQI(day.aqi);
            return (
              <div
                key={i}
                className="data-card p-4 flex flex-col items-center text-center hover:bg-surface-container transition-colors"
              >
                <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground mb-2">
                  {new Date(day.timestamp).toLocaleDateString([], { weekday: 'short' })}
                </span>
                <span className="text-2xl font-black mb-1 font-display" style={{ color }}>
                  {Math.round(day.aqi)}
                </span>
                <div className="w-full h-1.5 rounded-full mb-2" style={{ backgroundColor: color }} />
                <span className="text-[9px] font-mono font-bold uppercase leading-tight text-muted-foreground">
                  {label}
                </span>
                <span className="text-[9px] text-muted-foreground mt-1 font-mono">
                  {Math.round(day.confidence * 100)}% conf.
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Forecast;
