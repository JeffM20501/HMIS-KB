import clsx from 'clsx';

const TONES = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-primary-50 text-primary-700 text-primary',
  green: 'bg-success-bg text-success',
  amber: 'bg-warning-bg text-warning',
  red: 'bg-danger-bg text-danger',
  purple: 'bg-purple-50 text-purple-700',
};

export default function Badge({ tone = 'gray', className, children, dot = false }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        TONES[tone],
        className
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', TONES[tone].split(' ')[1] || 'bg-current')} />}
      {children}
    </span>
  );
}
