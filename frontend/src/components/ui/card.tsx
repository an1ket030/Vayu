import * as React from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-surface-dim border border-border rounded-2xl shadow-inner relative overflow-hidden',
      glass: 'rounded-2xl border border-white/8 relative overflow-hidden',
      elevated: 'bg-surface-container border border-border rounded-2xl shadow-lg relative overflow-hidden',
    };
    return (
      <div
        ref={ref}
        className={cn(variants[variant], className)}
        style={variant === 'glass' ? { background: 'rgba(27,32,36,0.85)', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)' } : undefined}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 pt-6 pb-4', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-sm font-mono font-bold uppercase tracking-widest text-muted-foreground', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 pb-6', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';
