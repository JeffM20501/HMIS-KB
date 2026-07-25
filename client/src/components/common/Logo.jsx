import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logo({ to = '/', className = '' }) {
  return (
    <Link to={to} className={`flex items-center gap-2.5 shrink-0 ${className}`}>
      <span className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white">
        <ShieldCheck className="w-5 h-5" />
      </span>
      <span className="leading-tight">
        <span className="block font-bold text-text-primary text-[15px]">TaifaCare</span>
        <span className="block text-[11px] text-text-secondary -mt-0.5">Help Center</span>
      </span>
    </Link>
  );
}
