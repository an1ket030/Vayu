import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { waqiService } from '@/services/api.service';

const HeatmapLayer = () => {
  const map = useMap();

  useEffect(() => {
    let heatLayer: any = null;

    const fetchAndRenderHeatmap = async () => {
      const bounds = map.getBounds();
      try {
        const data = await waqiService.getMapBounds(
          bounds.getSouth(),
          bounds.getWest(),
          bounds.getNorth(),
          bounds.getEast()
        );

        // Normalize AQI (0-500) to intensity (0.0-1.0) for the heatmap
        const points = data
          .filter((s: any) => !isNaN(parseInt(s.aqi)))
          .map((s: any) => {
            const aqi = parseInt(s.aqi);
            const intensity = Math.min(aqi / 500, 1.0);
            return [s.lat, s.lon, intensity];
          });

        if (heatLayer) {
          map.removeLayer(heatLayer);
        }

        // @ts-ignore
        heatLayer = L.heatLayer(points, {
          radius: 40,
          blur: 25,
          maxZoom: 13,
          gradient: {
            0.1: '#00e400', // Good
            0.2: '#ffff00', // Moderate
            0.3: '#ff7e00', // Unhealthy for Sensitive Groups
            0.4: '#ff0000', // Unhealthy
            0.6: '#8f3f97', // Very Unhealthy
            1.0: '#7e0023'  // Hazardous
          }
        }).addTo(map);

      } catch (error) {
        console.error('Failed to fetch stations for heatmap:', error);
      }
    };

    fetchAndRenderHeatmap();
    map.on('moveend', fetchAndRenderHeatmap);

    return () => {
      if (heatLayer) {
        map.removeLayer(heatLayer);
      }
      map.off('moveend', fetchAndRenderHeatmap);
    };
  }, [map]);

  return null;
};

export default HeatmapLayer;
