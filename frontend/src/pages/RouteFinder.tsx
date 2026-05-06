import { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import RouteLayer from '@/components/map/RouteLayer';
import { nominatimService, routeService, waqiService } from '@/services/api.service';
import { useRouteStore } from '@/store/useRouteStore';
import { Search, Navigation, AlertCircle, Wind, Clock, Ruler, Loader2 } from 'lucide-react';
import { getColorForAQI } from '@/utils/colorMapper';

const RouteFinder = () => {
  const [originText, setOriginText] = useState('');
  const [destText, setDestText] = useState('');
  const [loading, setLoading] = useState(false);
  const [routeAQIs, setRouteAQIs] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const { setRoutes, setPoints, routes, origin, destination } = useRouteStore();

  /**
   * Sample N points along a GeoJSON LineString and look up AQI at each point
   * by querying the nearest WAQI station from the backend map bounds endpoint.
   */
  const computeRouteAQI = async (coords: number[][]): Promise<number> => {
    // Sample every ~5th point for performance
    const step = Math.max(1, Math.floor(coords.length / 5));
    const samples = coords.filter((_, i) => i % step === 0).slice(0, 5);

    const aqiValues: number[] = [];
    for (const [lon, lat] of samples) {
      try {
        const stations = await waqiService.getMapBounds(
          lat - 0.05,
          lon - 0.05,
          lat + 0.05,
          lon + 0.05
        );
        if (stations && stations.length > 0) {
          const validAQI = stations
            .map((s: any) => parseInt(s.aqi))
            .filter((a: number) => !isNaN(a));
          if (validAQI.length > 0) {
            aqiValues.push(Math.min(...validAQI)); // take nearest/best
          }
        }
      } catch {
        // skip failed point
      }
    }

    return aqiValues.length > 0
      ? Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length)
      : 0;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originText.trim() || !destText.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setRouteAQIs([]);

    try {
      const [originData, destData] = await Promise.all([
        nominatimService.search(originText),
        nominatimService.search(destText),
      ]);

      if (!originData[0] || !destData[0]) {
        setErrorMsg('Could not find one or both locations. Try being more specific.');
        return;
      }

      const start: [number, number] = [
        parseFloat(originData[0].lon),
        parseFloat(originData[0].lat),
      ];
      const end: [number, number] = [
        parseFloat(destData[0].lon),
        parseFloat(destData[0].lat),
      ];

      setPoints(start, end);
      const routeData = await routeService.findCleanRoute(start, end);
      const features = routeData.features || [];
      setRoutes(features);

      // Compute live AQI for each returned route alternative
      const aqiResults = await Promise.all(
        features.map((f: any) => computeRouteAQI(f.geometry.coordinates))
      );
      setRouteAQIs(aqiResults);
    } catch (error: any) {
      console.error('Routing failed:', error);
      setErrorMsg(
        error?.response?.data?.message ||
          'Routing service error. Ensure the backend is running and ORS_API_KEY is set.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Sort routes by AQI (cleanest first)
  const sortedRouteIndices = routeAQIs
    .map((aqi, i) => ({ aqi, i }))
    .sort((a, b) => a.aqi - b.aqi)
    .map((x) => x.i);

  return (
    <div className="h-full flex gap-6">
      {/* Left Panel */}
      <div className="w-80 flex flex-col gap-4 overflow-y-auto">
        {/* Route Search */}
        <div className="data-card p-6">
          <h3 className="text-sm font-display font-semibold mb-4 flex items-center gap-2">
            <Navigation size={18} className="text-primary" />
            Find Cleanest Route
          </h3>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-muted-foreground mb-1 block">
                Origin
              </label>
              <div className="flex items-center gap-2 bg-surface-dim px-3 py-2 rounded-md">
                <Search size={14} className="text-muted-foreground shrink-0" />
                <input
                  value={originText}
                  onChange={(e) => setOriginText(e.target.value)}
                  placeholder="e.g. Connaught Place, Delhi"
                  className="bg-transparent border-none outline-none text-sm w-full"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-muted-foreground mb-1 block">
                Destination
              </label>
              <div className="flex items-center gap-2 bg-surface-dim px-3 py-2 rounded-md">
                <Search size={14} className="text-muted-foreground shrink-0" />
                <input
                  value={destText}
                  onChange={(e) => setDestText(e.target.value)}
                  placeholder="e.g. India Gate, Delhi"
                  className="bg-transparent border-none outline-none text-sm w-full"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 glow-primary border border-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Calculating...
                </>
              ) : (
                'Find Cleanest Route'
              )}
            </button>
          </form>

          {errorMsg && (
            <p className="mt-3 text-xs text-destructive bg-destructive/10 rounded-md p-2">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Route Results */}
        {routes.length > 0 && (
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground px-1">
              {routes.length} Routes Found
            </h4>
            {sortedRouteIndices.map((routeIdx, rank) => {
              const route = routes[routeIdx];
              const avgAQI = routeAQIs[routeIdx] ?? null;
              const { label: aqiLabel, color: aqiColor } = avgAQI !== null ? getColorForAQI(avgAQI) : { label: 'Loading...', color: '#888' };
              const isCleanest = rank === 0 && avgAQI !== null;
              const distKm = (route.properties.summary.distance / 1000).toFixed(1);
              const durationMin = (route.properties.summary.duration / 60).toFixed(0);

              return (
                <div
                  key={routeIdx}
                  className={`data-card p-4 transition-all ${
                    isCleanest ? 'border-green-500 ring-1 ring-green-400/30 glow-primary' : 'hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        isCleanest
                          ? 'bg-green-100 text-green-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCleanest ? '✓ Cleanest' : `Route ${rank + 1}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <Ruler size={12} className="mx-auto text-muted-foreground mb-1" />
                      <p className="text-[10px] font-mono text-muted-foreground">Distance</p>
                      <p className="text-sm font-display font-bold">{distKm} km</p>
                    </div>
                    <div>
                      <Clock size={12} className="mx-auto text-muted-foreground mb-1" />
                      <p className="text-[10px] font-mono text-muted-foreground">Duration</p>
                      <p className="text-sm font-display font-bold">{durationMin} min</p>
                    </div>
                    <div>
                      <Wind size={12} className="mx-auto text-muted-foreground mb-1" />
                      <p className="text-[10px] font-mono text-muted-foreground">Avg AQI</p>
                      {avgAQI !== null ? (
                        <p className="text-sm font-display font-bold" style={{ color: aqiColor }}>
                          {avgAQI}
                        </p>
                      ) : (
                        <Loader2 size={12} className="mx-auto animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {avgAQI !== null && (
                    <div className="mt-3 h-1 rounded-full w-full" style={{ backgroundColor: aqiColor + '33' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min((avgAQI / 500) * 100, 100)}%`,
                          backgroundColor: aqiColor,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-surface-container/50 border border-border p-4 rounded-xl flex gap-3">
          <AlertCircle className="text-primary shrink-0" size={18} />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Routes are ranked by average AQI sampled from live WAQI stations along the path. The
            cleanest route minimises total PM2.5 exposure dose.
          </p>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 data-card overflow-hidden !p-0">
        <MapContainer
          center={[28.6139, 77.209]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RouteLayer />
        </MapContainer>
      </div>
    </div>
  );
};

export default RouteFinder;
