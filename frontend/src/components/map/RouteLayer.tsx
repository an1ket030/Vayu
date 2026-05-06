import { GeoJSON, useMap } from 'react-leaflet';
import { useRouteStore } from '@/store/useRouteStore';
import { useEffect } from 'react';
import L from 'leaflet';

const RouteLayer = () => {
  const { routes, origin, destination } = useRouteStore();
  const map = useMap();

  useEffect(() => {
    if (routes.length > 0) {
      const allCoords = routes.flatMap(r => r.geometry.coordinates.map((c: any) => [c[1], c[0]]));
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routes, map]);

  return (
    <>
      {routes.map((route, i) => (
        <GeoJSON 
          key={i} 
          data={route} 
          style={{
            color: i === 0 ? '#10b981' : i === 1 ? '#f59e0b' : '#ef4444',
            weight: 5,
            opacity: 0.7
          }}
        />
      ))}
    </>
  );
};

export default RouteLayer;
