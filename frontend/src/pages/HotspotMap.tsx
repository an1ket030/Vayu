import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import StationMarkers from '@/components/map/StationMarkers';
import HeatmapLayer from '@/components/map/HeatmapLayer';
import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MapPin } from 'lucide-react';

// Inner component that re-centers the map when coords change
function MapRecenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], 11, { animate: true });
  }, [lat, lon, map]);
  return null;
}

const DELHI = { lat: 28.6139, lon: 77.209 };

const HotspotMap = () => {
  const [viewMode, setViewMode] = useState<'stations' | 'heatmap'>('stations');
  const [center, setCenter] = useState<{ lat: number; lon: number }>(DELHI);
  const [isLocating, setIsLocating] = useState(true);
  const [locationLabel, setLocationLabel] = useState<string>('Delhi, India (default)');

  useEffect(() => {
    if (!navigator.geolocation) {
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationLabel('Your Location');
        setIsLocating(false);
      },
      () => {
        setIsLocating(false); // Silently fall back to Delhi
      },
      { timeout: 5000, maximumAge: 300_000 }
    );
  }, []);

  return (
    <div className="h-full flex flex-col gap-4">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight">Pollution Hotspot Map</h2>
          <p className="text-sm font-mono text-muted-foreground flex items-center gap-1.5 mt-0.5">
            {isLocating ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Detecting your location…
              </>
            ) : (
              <>
                <MapPin size={12} />
                {locationLabel}
              </>
            )}
          </p>
        </div>

        <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
          <TabsList>
            <TabsTrigger value="stations">Station Markers</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap View</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <div className="flex-1 data-card overflow-hidden relative !p-0">
        <MapContainer
          center={[center.lat, center.lon]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Re-center when GPS resolves */}
          <MapRecenter lat={center.lat} lon={center.lon} />
          {viewMode === 'stations' && <StationMarkers />}
          {viewMode === 'heatmap' && <HeatmapLayer />}
        </MapContainer>

        {/* AQI Legend */}
        <div 
          className="absolute bottom-6 left-6 data-card p-4 shadow-lg max-w-xs"
          style={{ zIndex: 1000 }}
        >
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">AQI Legend</h4>
          <div className="flex flex-col gap-1">
            {[
              { label: '0–50 Good',              color: '#00e400' },
              { label: '51–100 Moderate',         color: '#ffff00' },
              { label: '101–150 Sensitive Groups', color: '#ff7e00' },
              { label: '151–200 Unhealthy',        color: '#ff0000' },
              { label: '201–300 Very Unhealthy',   color: '#8f3f97' },
              { label: '301–500 Hazardous',        color: '#7e0023' },
            ].map((i) => (
              <div key={i.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: i.color }} />
                <span className="text-[10px] font-mono font-medium">{i.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotspotMap;
