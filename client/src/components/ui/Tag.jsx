import { X } from 'lucide-react';

export default function Tag({ children, onRemove, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded bg-primary-50 text-primary-700 text-xs font-medium ${className}`}
    >
      #{children}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-primary-900">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
