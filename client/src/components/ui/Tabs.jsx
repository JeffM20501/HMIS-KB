import clsx from 'clsx';

export default function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={clsx('flex items-center gap-1 border-b border-border', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={clsx(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors focus-ring',
            active === tab.value
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          )}
        >
          {tab.label}
          {typeof tab.count === 'number' && (
            <span
              className={clsx(
                'ml-2 px-1.5 py-0.5 rounded-full text-xs',
                active === tab.value ? 'bg-primary-50 text-primary' : 'bg-gray-100 text-text-secondary'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
