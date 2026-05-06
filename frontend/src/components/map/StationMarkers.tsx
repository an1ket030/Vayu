import { useMap, CircleMarker, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { waqiService } from '@/services/api.service';
import { getColorForAQI } from '@/utils/colorMapper';

const StationMarkers = () => {
  const map = useMap();
  const [stations, setStations] = useState<any[]>([]);

  useEffect(() => {
    const fetchStations = async () => {
      const bounds = map.getBounds();
      try {
        const data = await waqiService.getMapBounds(
          bounds.getSouth(),
          bounds.getWest(),
          bounds.getNorth(),
          bounds.getEast()
        );
        setStations(data);
      } catch (error) {
        console.error('Failed to fetch stations:', error);
      }
    };

    fetchStations();
    map.on('moveend', fetchStations);
    return () => {
      map.off('moveend', fetchStations);
    };
  }, [map]);

  return (
    <>
      {stations.map((s, i) => {
        const aqi = parseInt(s.aqi);
        const isValidAqi = !isNaN(aqi);
        const color = isValidAqi ? getColorForAQI(aqi).color : '#94a3b8';

        return (
          <CircleMarker
            key={i}
            center={[s.lat, s.lon]}
            radius={isValidAqi ? Math.min(10 + aqi / 20, 25) : 10}
            pathOptions={{
              fillColor: color,
              color: '#fff',
              weight: 1,
              fillOpacity: 0.8,
            }}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-bold text-sm mb-1">{s.station.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black">{isValidAqi ? s.aqi : 'N/A'}</span>
                  <span className="text-xs uppercase font-bold text-muted-foreground">AQI</span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
};

export default StationMarkers;
