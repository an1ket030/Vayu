import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { getColorForAQI } from '@/utils/colorMapper';

interface ForecastChartProps {
  data: any[];
}

const ForecastChart = ({ data }: ForecastChartProps) => {
  return (
    <div className="h-[300px] w-full bg-card border rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold mb-6">7-Day AQI Forecast</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={(val) => new Date(val).toLocaleDateString([], { weekday: 'short' })}
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip 
             contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px'
            }} 
          />
          <Bar dataKey="aqi" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColorForAQI(entry.aqi).color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForecastChart;
