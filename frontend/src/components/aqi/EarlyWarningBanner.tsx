import React from 'react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { cn } from '@/utils/cn';

interface EarlyWarningBannerProps {
  level: 'NONE' | 'WATCH' | 'WARNING' | 'EMERGENCY';
  message: string;
}

const EarlyWarningBanner = ({ level, message }: EarlyWarningBannerProps) => {
  if (level === 'NONE') return null;

  const styles: Record<string, string> = {
    WATCH:     'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    WARNING:   'bg-orange-500/10 border-orange-500/30 text-orange-400',
    EMERGENCY: 'bg-red-500/10   border-red-500/30   text-red-400',
  };

  const Icons: Record<string, React.ElementType> = {
    WATCH:     Info,
    WARNING:   AlertTriangle,
    EMERGENCY: ShieldAlert,
  };

  // Safety guard — if an unexpected level leaks through, don't crash
  const Icon = Icons[level];
  const style = styles[level];
  if (!Icon || !style) return null;

  return (
    <div className={cn('border p-4 rounded-xl flex items-center gap-4 mb-6', style)}>
      <div className="p-2 rounded-lg bg-white/10 shrink-0">
        <Icon size={20} />
      </div>
      <div>
        <h4 className="font-bold text-sm uppercase tracking-wider mb-0.5">{level} ALERT</h4>
        <p className="text-sm opacity-80 leading-snug">{message}</p>
      </div>
    </div>
  );
};

export default EarlyWarningBanner;

