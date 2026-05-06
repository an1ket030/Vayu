import { Progress } from '../ui/progress';

interface PollutantGridProps {
  pollutants: {
    pm25?: number;
    pm10?: number;
    no2?: number;
    o3?: number;
    so2?: number;
    co?: number;
  };
}

const PollutantGrid = ({ pollutants }: PollutantGridProps) => {
  const items = [
    { label: 'PM2.5', value: pollutants.pm25, unit: 'µg/m³', max: 250 },
    { label: 'PM10', value: pollutants.pm10, unit: 'µg/m³', max: 430 },
    { label: 'NO2', value: pollutants.no2, unit: 'ppb', max: 100 },
    { label: 'O3', value: pollutants.o3, unit: 'ppb', max: 100 },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item) => (
        <div key={item.label} className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
            <span className="text-lg font-bold">{item.value || '--'} <small className="text-[10px] font-normal">{item.unit}</small></span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
             <div 
              className="h-full bg-primary transition-all" 
              style={{ width: `${Math.min(((item.value || 0) / item.max) * 100, 100)}%` }} 
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default PollutantGrid;
