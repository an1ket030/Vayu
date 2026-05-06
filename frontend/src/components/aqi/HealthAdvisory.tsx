import { cn } from '@/utils/cn';
import { Heart, Wind, Activity, AlertTriangle, Zap, Smile } from 'lucide-react';

interface Advice {
  minAQI: number;
  maxAQI: number;
  level: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
  headline: string;
  generalPublic: string;
  sensitiveGroups: string;
  recommendations: string[];
}

const ADVISORY_TABLE: Advice[] = [
  {
    minAQI: 0, maxAQI: 50,
    level: 'Good', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/25',
    icon: Smile,
    headline: 'Air quality is excellent today',
    generalPublic: 'Perfect day for outdoor activities. Enjoy the clean air!',
    sensitiveGroups: 'No restrictions. Enjoy your day freely.',
    recommendations: ['Great day for a run or outdoor exercise', 'Open windows for natural ventilation', 'No mask needed'],
  },
  {
    minAQI: 51, maxAQI: 100,
    level: 'Moderate', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/25',
    icon: Wind,
    headline: 'Air quality is acceptable',
    generalPublic: 'Air quality is generally fine for most people.',
    sensitiveGroups: 'Unusually sensitive individuals may experience minor symptoms from prolonged outdoor exertion.',
    recommendations: ['Fine for most outdoor activities', 'Sensitive groups should limit 2+ hour outdoor workouts', 'Consider air purifier indoors'],
  },
  {
    minAQI: 101, maxAQI: 150,
    level: 'Unhealthy for Sensitive Groups', color: 'text-orange-400', bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/25',
    icon: Activity,
    headline: 'Sensitive groups should take precautions',
    generalPublic: 'General public is unlikely to be affected. Moderate outdoor activities are fine.',
    sensitiveGroups: 'People with heart or lung disease, elderly, children, and pregnant women should limit prolonged outdoor exertion.',
    recommendations: ['Wear a surgical mask if sensitive', 'Keep outdoor exercise under 1 hour', 'Run HEPA purifier at medium speed'],
  },
  {
    minAQI: 151, maxAQI: 200,
    level: 'Unhealthy', color: 'text-red-400', bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/25',
    icon: AlertTriangle,
    headline: 'Everyone may experience health effects',
    generalPublic: 'Everyone should reduce prolonged or heavy outdoor exertion.',
    sensitiveGroups: 'Avoid all outdoor activity. Stay indoors and keep windows closed.',
    recommendations: ['Wear N95/FFP2 mask outdoors', 'Run HEPA purifier at high speed', 'Avoid morning outdoor exercise', 'Keep children and elderly indoors'],
  },
  {
    minAQI: 201, maxAQI: 300,
    level: 'Very Unhealthy', color: 'text-purple-400', bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/25',
    icon: AlertTriangle,
    headline: 'Health alert — serious effects for everyone',
    generalPublic: 'Everyone should avoid all outdoor physical activity. Minimize time outdoors.',
    sensitiveGroups: 'Remain indoors. Emergency conditions for sensitive groups.',
    recommendations: ['Stay indoors with windows sealed', 'N95 mask mandatory if you must go out', 'Set purifier to maximum', 'Hydrate and monitor breathing', 'Consult doctor if symptoms appear'],
  },
  {
    minAQI: 301, maxAQI: 9999,
    level: 'Hazardous', color: 'text-rose-400', bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/25',
    icon: Zap,
    headline: '⚠️ Emergency conditions — stay indoors',
    generalPublic: 'All outdoor activity forbidden. Emergency health situation.',
    sensitiveGroups: 'Do not go outside under any circumstances.',
    recommendations: ['Seal all windows and doors', 'Run air purifier at maximum', 'Wear N95 even indoors if purifier unavailable', 'Call emergency services if breathing difficulty', 'Evacuate area if possible'],
  },
];

function getAdvice(aqi: number): Advice {
  return (
    ADVISORY_TABLE.find((a) => aqi >= a.minAQI && aqi <= a.maxAQI) ||
    ADVISORY_TABLE[ADVISORY_TABLE.length - 1]
  );
}

interface HealthAdvisoryProps {
  aqi: number;
  className?: string;
}

const HealthAdvisory = ({ aqi, className }: HealthAdvisoryProps) => {
  const advice = getAdvice(aqi);
  const Icon = advice.icon;

  return (
    <div className={cn('border rounded-2xl overflow-hidden shadow-sm', className)}>
      {/* Header bar */}
      <div className={cn('px-6 py-4 border-b flex items-center gap-3', advice.bgColor, advice.borderColor)}>
        <div className={cn('p-2 rounded-lg bg-white/10')}>
          <Icon size={20} className={advice.color} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={cn('font-bold text-sm', advice.color)}>{advice.level}</h3>
            <span className="text-xs text-foreground/50">· AQI {aqi}</span>
          </div>
          <p className="font-semibold text-sm mt-0.5 text-foreground">{advice.headline}</p>
        </div>
      </div>

      <div className="p-6 grid gap-4 md:grid-cols-2 bg-card">
        {/* General public */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Heart size={14} className="text-muted-foreground" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              General Public
            </h4>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{advice.generalPublic}</p>
        </div>

        {/* Sensitive groups */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-muted-foreground" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Sensitive Groups
            </h4>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{advice.sensitiveGroups}</p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="px-6 pb-6 bg-card">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Recommendations
        </h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {advice.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
              <span className={cn('mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', advice.color.replace('text-', 'bg-'))} />
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HealthAdvisory;
