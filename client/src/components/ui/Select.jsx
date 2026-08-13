import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

const Select = forwardRef(function Select({ className, children, error, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={clsx(
          'w-full h-10 rounded border border-border bg-white text-sm text-text-primary pl-3 pr-9 appearance-none focus-ring focus:border-primary transition-colors',
          error && 'border-danger focus:border-danger', // optional styling for error
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="w-4 h-4 text-text-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
});

export default Select;