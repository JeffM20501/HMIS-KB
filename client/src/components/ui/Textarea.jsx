import { forwardRef } from 'react';
import clsx from 'clsx';

const Textarea = forwardRef(function Textarea({ className, error, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={clsx(
        'w-full rounded border bg-white text-sm text-text-primary placeholder:text-text-secondary/70 focus-ring transition-colors px-3 py-2',
        error ? 'border-danger' : 'border-border focus:border-primary',
        className
      )}
      {...props}
    />
  );
});

export default Textarea;
