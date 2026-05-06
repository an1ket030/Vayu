import { getColorForAQI } from '@/utils/colorMapper';

interface AQIBadgeProps {
  aqi: number;
}

const AQIBadge = ({ aqi }: AQIBadgeProps) => {
  const { label, color, textColor } = getColorForAQI(aqi);

  return (
    <span 
      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
      style={{ backgroundColor: color, color: textColor }}
    >
      {label}
    </span>
  );
};

export default AQIBadge;
