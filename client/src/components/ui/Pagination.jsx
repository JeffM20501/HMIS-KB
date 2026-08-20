import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function Pagination({ page, totalPages, onChange, className = '' }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const windowSize = 1;
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= page - windowSize && p <= page + windowSize)) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <div className={clsx('flex items-center justify-start gap-1', className)}>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="w-8 h-8 flex items-center justify-center rounded border border-border disabled:opacity-40 hover:bg-gray-50 focus-ring"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-text-secondary text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={clsx(
              'w-8 h-8 rounded text-sm font-medium focus-ring',
              p === page ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-50'
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="w-8 h-8 flex items-center justify-center rounded border border-border disabled:opacity-40 hover:bg-gray-50 focus-ring"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
