import { Loader2 } from 'lucide-react';

export default function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="min-h-[50vh] w-full flex flex-col items-center justify-center gap-3 text-text-secondary">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
