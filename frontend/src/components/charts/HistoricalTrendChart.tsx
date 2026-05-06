import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_CONFIG } from '@/config/constants';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { getColorForAQI } from '@/utils/colorMapper';
import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HistoryPoint {
  date: string;
  aqi: number;
  pm25: number;
  pm10: number;
}

interface Props {
  lat: number;
  lon: number;
  days?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as HistoryPoint;
  const { label: aqiLabel, color } = getColorForAQI(d.aqi);
  return (
    <div style={{ background: 'rgba(27,32,36,0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)' }} className="rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[148px] font-mono">
      <p className="font-bold text-foreground text-[11px]">
        {new Date(label).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
      </p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">AQI</span>
        <span className="font-black" style={{ color }}>{d.aqi} <span className="font-normal text-muted-foreground opacity-70">({aqiLabel})</span></span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">PM2.5</span>
        <span className="font-semibold">{d.pm25} µg/m³</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">PM10</span>
        <span className="font-semibold">{d.pm10} µg/m³</span>
      </div>
    </div>
  );
};

const HistoricalTrendChart = ({ lat, lon, days = 30 }: Props) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['aqi-history', lat, lon, days],
    queryFn: async (): Promise<HistoryPoint[]> => {
      const resp = await axios.get(`${API_CONFIG.BACKEND_URL}/api/aqi/history`, {
        params: { lat, lon, days },
      });
      return resp.data.data;
    },
    staleTime: 3 * 60 * 60 * 1000, // 3 hours
    retry: 1,
    enabled: !!lat && !!lon,
  });

  if (isLoading) {
    return (
      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <History size={18} className="text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Historical AQI Trend
          </h3>
        </div>
        <div className="h-56 flex items-center justify-center">
          <div className="animate-pulse space-y-2 w-full px-4">
            {[60, 80, 40, 90, 55].map((h, i) => (
              <div key={i} className="bg-muted rounded" style={{ height: `${h * 0.3}px` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data?.length) {
    return (
      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <History size={18} className="text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Historical AQI Trend
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Historical data is unavailable for this location. Data will appear once the backend has fetched OWM history.
        </p>
      </div>
    );
  }

  // Compute stats
  const aqiValues = data.map((d) => d.aqi);
  const avg = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);
  const worst = Math.max(...aqiValues);
  const best = Math.min(...aqiValues);
  const recent = aqiValues.slice(-7);
  const older = aqiValues.slice(0, 7);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  const trendPct = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;
  const isRising = trendPct > 3;
  const isFalling = trendPct < -3;

  // Gradient stop color based on average AQI
  const { color: avgColor } = getColorForAQI(avg);

  return (
    <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <History size={18} className="text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            {days}-Day AQI History
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {isRising ? (
            <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
              <TrendingUp size={11} /> +{trendPct}% last 7d
            </span>
          ) : isFalling ? (
            <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
              <TrendingDown size={11} /> {trendPct}% last 7d
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              <Minus size={11} /> Stable
            </span>
          )}
        </div>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-3 gap-px bg-border mx-6 mb-5 rounded-xl overflow-hidden">
        {[
          { label: 'Period Avg', value: avg, color: getColorForAQI(avg).color },
          { label: 'Best Day', value: best, color: getColorForAQI(best).color },
          { label: 'Worst Day', value: worst, color: getColorForAQI(worst).color },
        ].map((s) => (
          <div key={s.label} className="bg-card px-4 py-3 text-center">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-52 px-2 pb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 16, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="aqi-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={avgColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={avgColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => {
                const d = new Date(v);
                return d.getDate() % 5 === 0
                  ? d.toLocaleDateString([], { month: 'short', day: 'numeric' })
                  : '';
              }}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontFamily: 'JetBrains Mono, monospace' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontFamily: 'JetBrains Mono, monospace' }}
              domain={[0, Math.max(worst + 50, 200)]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={100} stroke="#ffff00" strokeDasharray="3 3" strokeOpacity={0.7} />
            <ReferenceLine y={150} stroke="#ff7e00" strokeDasharray="3 3" strokeOpacity={0.7} />
            <ReferenceLine y={200} stroke="#ff0000" strokeDasharray="3 3" strokeOpacity={0.7} />
            <Area
              type="monotone"
              dataKey="aqi"
              stroke={avgColor}
              strokeWidth={1.5}
              fill="url(#aqi-gradient)"
              dot={false}
              activeDot={{ r: 4, fill: avgColor, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HistoricalTrendChart;
