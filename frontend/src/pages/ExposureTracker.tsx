import { useExposureStore } from '@/store/useExposureStore';
import { useExposureTracker } from '@/hooks/useExposureTracker';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  Download, Info, ShieldCheck, Play, Square, MapPin,
  Loader2, AlertCircle, Wifi, WifiOff
} from 'lucide-react';
import jsPDF from 'jspdf';
import { cn } from '@/utils/cn';

const getExposureStatus = (multiplier: number) => {
  if (multiplier < 1) return { label: 'Within safe limits', color: '#10b981', emoji: '🟢' };
  if (multiplier < 3) return { label: 'Moderate exposure', color: '#f59e0b', emoji: '🟡' };
  if (multiplier < 7) return { label: 'High exposure', color: '#f97316', emoji: '🟠' };
  return { label: 'Hazardous exposure', color: '#ef4444', emoji: '🔴' };
};

const getAQIColor = (aqi: number) => {
  if (aqi <= 50) return '#10b981';
  if (aqi <= 100) return '#84cc16';
  if (aqi <= 150) return '#f59e0b';
  if (aqi <= 200) return '#f97316';
  if (aqi <= 300) return '#ef4444';
  return '#7c3aed';
};

const ExposureTracker = () => {
  const { status, isTracking, error, location, currentAQI, startTracking, stopTracking } =
    useExposureTracker();
  const { dailyExposure, logs } = useExposureStore();

  const exposureStatus = getExposureStatus(dailyExposure);
  const chartData = [
    { name: 'Exposed', value: Math.min(dailyExposure, 10) },
    { name: 'Remaining', value: Math.max(0, 10 - dailyExposure) },
  ];

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('CleanAir Personal Exposure Report', 15, 20);
    doc.setFontSize(12);
    doc.text(`Daily Exposure Multiplier: ${dailyExposure.toFixed(2)}x WHO Safe Limit`, 15, 35);
    doc.text(`Status: ${exposureStatus.label}`, 15, 45);
    doc.text(`Total Logs Today: ${logs.length}`, 15, 55);
    if (location) doc.text(`Location: ${location.cityName || 'Unknown'} (${location.lat.toFixed(4)}, ${location.lon.toFixed(4)})`, 15, 65);
    doc.save('cleanair-exposure-report.pdf');
  };

  // Status indicator for the tracking state
  const StatusIndicator = () => {
    if (status === 'idle') return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <WifiOff size={14} /> Not tracking
      </div>
    );
    if (status === 'requesting_permission') return (
      <div className="flex items-center gap-2 text-yellow-500 text-sm">
        <Loader2 size={14} className="animate-spin" /> Requesting location…
      </div>
    );
    if (status === 'tracking') return (
      <div className="flex items-center gap-2 text-green-500 text-sm">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <Wifi size={14} />
        Live tracking{location?.cityName ? ` · ${location.cityName}` : ''}
        {currentAQI !== null && (
          <span className="ml-1 font-bold" style={{ color: getAQIColor(currentAQI) }}>
            AQI {currentAQI}
          </span>
        )}
      </div>
    );
    if (status === 'error') return (
      <div className="flex items-center gap-2 text-destructive text-sm">
        <AlertCircle size={14} /> Location error
      </div>
    );
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight">Personal Exposure Tracker</h2>
          <p className="text-muted-foreground mt-1">
            Monitoring your cumulative pollution intake based on WHO guidelines
          </p>
          <div className="mt-2">
            <StatusIndicator />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Start / Stop button */}
          {!isTracking ? (
            <button
              id="start-tracking-btn"
              onClick={startTracking}
              disabled={status === 'requesting_permission'}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                status === 'requesting_permission'
                  ? 'bg-surface-container text-muted-foreground cursor-wait'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 glow-primary border border-primary/20'
              )}
            >
              {status === 'requesting_permission' ? (
                <><Loader2 size={16} className="animate-spin" /> Waiting…</>
              ) : (
                <><Play size={16} /> Start Tracking</>
              )}
            </button>
          ) : (
            <button
              id="stop-tracking-btn"
              onClick={stopTracking}
              className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md text-sm font-medium transition-colors"
            >
              <Square size={16} /> Stop Tracking
            </button>
          )}

          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container hover:bg-surface-dim rounded-md text-sm font-medium transition-colors border border-border"
          >
            <Download size={16} /> Export PDF
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 mb-6 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Location Access Required</p>
            <p className="mt-0.5 text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      {/* Not tracking prompt */}
      {status === 'idle' && logs.length === 0 && (
        <div className="data-card border-dashed p-10 text-center mb-8">
          <MapPin size={40} className="mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="font-semibold text-lg mb-2 font-display">Start tracking your air quality exposure</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
            Grant location permission to begin monitoring. Your data is private and stored securely on your device.
          </p>
          <button
            onClick={startTracking}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <Play size={16} /> Start Tracking
          </button>
        </div>
      )}

      {/* Main cards — always shown once logs exist */}
      {(logs.length > 0 || isTracking) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Donut chart */}
          <div className="data-card p-8 flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-muted-foreground mb-6">
              Today's Intake
            </h3>
            <div className="relative w-48 h-48 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill={exposureStatus.color} />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black font-display">{dailyExposure.toFixed(1)}x</span>
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">WHO Limit</span>
              </div>
            </div>
            <div
              className="px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2"
              style={{ backgroundColor: exposureStatus.color + '20', color: exposureStatus.color }}
            >
              <span>{exposureStatus.emoji}</span>
              {exposureStatus.label}
            </div>

            {/* Current live AQI */}
            {currentAQI !== null && (
              <div className="mt-4 text-sm font-medium" style={{ color: getAQIColor(currentAQI) }}>
                Current AQI: <span className="font-black text-lg">{currentAQI}</span>
              </div>
            )}

            {/* Location tag */}
            {location?.cityName && (
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin size={10} />
                {location.cityName}
              </div>
            )}
          </div>

          {/* Info cards */}
          <div className="flex flex-col gap-6">
            <div className="bg-surface-container/50 border border-border rounded-2xl p-6 flex gap-4">
              <ShieldCheck className="text-primary shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-sm mb-1 font-display">Health Recommendation</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {dailyExposure > 7
                    ? 'Hazardous exposure detected. Stay indoors, run air purifier at max, and wear N95 when going outside.'
                    : dailyExposure > 3
                    ? 'Your exposure has exceeded moderate levels. We recommend an N95 mask outdoors and using an air purifier tonight.'
                    : 'Your exposure is within manageable levels. Stay updated on changing conditions.'}
                </p>
              </div>
            </div>

            <div className="data-card p-6 flex-1">
              <h4 className="font-bold text-sm mb-4 flex items-center gap-2 font-display">
                <Info size={16} className="text-muted-foreground" />
                How it's calculated
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Your location is sampled every minute and cross-referenced with the nearest WAQI station. Your score represents the cumulative dose vs. the WHO annual PM2.5 mean of 5 µg/m³.
              </p>
              <div className="bg-surface-dim rounded-lg p-3">
                <code className="text-[10px] font-mono text-primary">
                  Dose = Σ (AQI_i × duration_i) / (WHO_Limit × total_time)
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Table */}
      {logs.length > 0 && (
        <div className="data-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm font-display">Exposure Log</h3>
            <span className="text-xs font-mono text-muted-foreground">{logs.length} readings today</span>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-dim text-muted-foreground text-[10px] font-mono font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">AQI</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.slice(0, 15).map((log, i) => {
                const s = getExposureStatus(log.aqi / 25);
                return (
                  <tr key={i} className="hover:bg-surface-container transition-colors border-t border-border/50">
                    <td className="px-6 py-4 font-mono font-medium">
                      {new Date(log.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {log.lat.toFixed(4)}, {log.lon.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 font-bold" style={{ color: getAQIColor(log.aqi) }}>
                      {log.aqi}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="w-2 h-2 rounded-full inline-block mr-2"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-xs">{s.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExposureTracker;
