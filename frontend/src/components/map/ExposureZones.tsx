import { CircleMarker, useMap } from 'react-leaflet';
import { useExposureStore } from '@/store/useExposureStore';
import { getColorForAQI } from '@/utils/colorMapper';

const ExposureZones = () => {
  const { logs } = useExposureStore();

  return (
    <>
      {logs.map((log, i) => {
        const { color } = getColorForAQI(log.aqi);
        return (
          <CircleMarker
            key={i}
            center={[log.lat, log.lon]}
            radius={8}
            pathOptions={{
              fillColor: color,
              color: '#fff',
              weight: 1,
              fillOpacity: 0.6,
            }}
          />
        );
      })}
    </>
  );
};

export default ExposureZones;
