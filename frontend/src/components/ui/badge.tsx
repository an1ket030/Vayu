import * as React from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** AQI category color — pass a hex color for AQI badges */
  color?: string;
  variant?: 'default' | 'aqi' | 'pill';
}

export const Badge = ({ className, color, variant = 'default', children, ...props }: BadgeProps) => {
  const base = 'inline-flex items-center justify-center font-mono font-bold text-[11px] uppercase tracking-wider rounded-full px-2.5 py-0.5 transition-all';

  const aqi = color
    ? { color, borderColor: `${color}50`, backgroundColor: `${color}18` }
    : undefined;

  return (
    <span
      className={cn(
        base,
        variant === 'default' && 'bg-surface-container border border-border text-muted-foreground',
        variant === 'aqi' && 'border',
        variant === 'pill' && 'bg-primary/15 text-primary border border-primary/30',
        className
      )}
      style={variant === 'aqi' && color ? aqi : undefined}
      {...props}
    >
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
