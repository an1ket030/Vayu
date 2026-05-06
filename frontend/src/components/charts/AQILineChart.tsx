import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface AQILineChartProps {
  data: any[];
}

const AQILineChart = ({ data }: AQILineChartProps) => {
  return (
    <div className="h-[300px] w-full bg-card border rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold mb-6">24h AQI Trend</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="time" 
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
          <Line 
            type="monotone" 
            dataKey="aqi" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3} 
            dot={false} 
            activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AQILineChart;
