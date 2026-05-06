import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getColorForAQI } from '@/utils/colorMapper';

interface AQIGaugeProps {
  aqi: number;
}

const AQIGauge = ({ aqi }: AQIGaugeProps) => {
  const { color, label } = getColorForAQI(aqi);

  const clamped = Math.min(Math.max(aqi, 0), 500);
  const data = [
    { value: clamped },
    { value: 500 - clamped },
  ];

  // 6 AQI threshold markers for the gauge ring
  const thresholds = [
    { value: 50,  color: '#22c55e' },
    { value: 100, color: '#a3e635' },
    { value: 150, color: '#facc15' },
    { value: 200, color: '#f97316' },
    { value: 300, color: '#ef4444' },
    { value: 500, color: '#7c3aed' },
  ];

  return (
    <div className="h-[170px] w-full relative select-none">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* Background track */}
          <Pie
            data={[{ value: 500 }]}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={64}
            outerRadius={82}
            dataKey="value"
            stroke="none"
          >
            <Cell fill="hsl(var(--muted) / 0.4)" />
          </Pie>
          {/* AQI fill arc */}
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={64}
            outerRadius={82}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          >
            <Cell fill={color} />
            <Cell fill="transparent" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center value */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-1">
        <span
          className="text-4xl font-mono font-black leading-none tracking-tight"
          style={{ color }}
        >
          {aqi}
        </span>
        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mt-1">
          AQI
        </span>
        <span
          className="text-[11px] font-mono font-semibold mt-0.5"
          style={{ color }}
        >
          {label}
        </span>
      </div>

      {/* Threshold color bar below */}
      <div className="absolute bottom-[-20px] left-4 right-4 flex rounded-full overflow-hidden h-1">
        {thresholds.map((t) => (
          <div
            key={t.value}
            className="flex-1"
            style={{ backgroundColor: t.color }}
          />
        ))}
      </div>
    </div>
  );
};

export default AQIGauge;
