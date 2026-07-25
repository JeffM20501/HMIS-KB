import clsx from 'clsx';

export default function Card({ className, children, padded = true, ...props }) {
  return (
    <div
      className={clsx('bg-white border border-border rounded-card shadow-card', padded && 'p-5', className)}
      {...props}
    >
      {children}
    </div>
  );
}
