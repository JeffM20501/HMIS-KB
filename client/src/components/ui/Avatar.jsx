import clsx from 'clsx';

const COLORS = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'];

function colorFor(seed = '') {
  const idx = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length;
  return COLORS[idx];
}

export default function Avatar({ name = '', src, size = 'md', className }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-14 h-14 text-lg' };

  if (src) {
    return <img src={src} alt={name} className={clsx('rounded-full object-cover', sizes[size], className)} />;
  }

  return (
    <span
      className={clsx('inline-flex items-center justify-center rounded-full font-semibold shrink-0', colorFor(name), sizes[size], className)}
    >
      {initials || '?'}
    </span>
  );
}
