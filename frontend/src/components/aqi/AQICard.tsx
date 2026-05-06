import { getColorForAQI } from '@/utils/colorMapper';
import { cn } from '@/utils/cn';

interface AQICardProps {
  aqi: number;
  location: string;
  timestamp: string;
}

const AQICard = ({ aqi, location, timestamp }: AQICardProps) => {
  const { label, color, textColor } = getColorForAQI(aqi);

  return (
    <div className="bg-card border rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
      <h3 className="text-lg font-semibold text-muted-foreground mb-1">{location}</h3>
      <p className="text-xs text-muted-foreground mb-6">Last updated: {timestamp}</p>
      
      <div 
        className="w-48 h-48 rounded-full border-8 flex flex-col items-center justify-center mb-6"
        style={{ borderColor: color }}
      >
        <span className="text-6xl font-black">{aqi}</span>
        <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">AQI</span>
      </div>

      <div 
        className="px-6 py-2 rounded-full font-bold text-sm"
        style={{ backgroundColor: color, color: textColor }}
      >
        {label}
      </div>
    </div>
  );
};

export default AQICard;
