import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm',
  secondary: 'bg-white text-text-primary border border-border hover:bg-gray-50',
  outline: 'bg-transparent text-primary border border-primary/30 hover:bg-primary-50',
  ghost: 'bg-transparent text-text-secondary hover:bg-gray-100 hover:text-text-primary',
  danger: 'bg-danger text-white hover:bg-red-600 shadow-sm',
  dangerOutline: 'bg-transparent text-danger border border-danger/30 hover:bg-danger-bg',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
  icon: 'h-9 w-9 justify-center',
};

const Button = forwardRef(function Button(
  { as: As = 'button', variant = 'primary', size = 'md', isLoading, className, children, disabled, ...props },
  ref
) {
  return (
    <As
      ref={ref}
      className={clsx(
        'inline-flex items-center rounded font-medium transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </As>
  );
});

export default Button;
