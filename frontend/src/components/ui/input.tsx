import * as React from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, error, label, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-white/5 border rounded-xl text-sm text-foreground font-mono placeholder:text-muted-foreground/50',
              'outline-none transition-all',
              'focus:border-primary/60 focus:ring-1 focus:ring-primary/40',
              error ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/30' : 'border-white/10',
              leftIcon ? 'pl-9' : 'pl-4',
              rightIcon ? 'pr-9' : 'pr-4',
              'py-2.5',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1 text-[11px] text-red-400 font-mono">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
