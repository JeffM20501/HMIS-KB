import { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(function Input({ className, icon: Icon, error, ...props }, ref) {
  return (
    <div className="relative">
      {Icon && <Icon className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />}
      <input
        ref={ref}
        className={clsx(
          'w-full h-10 rounded border bg-white text-sm text-text-primary placeholder:text-text-secondary/70 focus-ring transition-colors',
          Icon ? 'pl-9 pr-3' : 'px-3',
          error ? 'border-danger' : 'border-border focus:border-primary',
          className
        )}
        {...props}
      />
    </div>
  );
});

export default Input;
