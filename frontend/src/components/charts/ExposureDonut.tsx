import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ExposureDonutProps {
  value: number;
  color: string;
}

const ExposureDonut = ({ value, color }: ExposureDonutProps) => {
  const data = [
    { name: 'Exposed', value: value },
    { name: 'Remaining', value: Math.max(0, 1 - value) },
  ];

  return (
    <div className="h-[200px] w-[200px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            startAngle={90}
            endAngle={450}
          >
            <Cell fill={color} />
            <Cell fill="hsl(var(--muted))" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black">{value.toFixed(1)}x</span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase">WHO Limit</span>
      </div>
    </div>
  );
};

export default ExposureDonut;
