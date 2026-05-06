import * as React from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all rounded-xl disabled:opacity-60 disabled:cursor-not-allowed font-mono';

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-sm',
    };

    const variants: Record<string, string> = {
      primary: 'text-[#001e2c]',
      secondary: 'bg-surface-container border border-border text-foreground hover:bg-surface-container-high',
      ghost: 'text-muted-foreground hover:text-foreground hover:bg-white/5',
      destructive: 'bg-destructive/15 border border-destructive/30 text-destructive hover:bg-destructive/25',
      outline: 'border border-border bg-transparent text-foreground hover:bg-white/5',
    };

    const primaryStyle =
      variant === 'primary'
        ? { background: 'linear-gradient(135deg,#38bdf8,#0284c7)', boxShadow: disabled ? 'none' : '0 0 16px rgba(56,189,248,0.3)' }
        : undefined;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, sizes[size], variants[variant], className)}
        style={primaryStyle}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
