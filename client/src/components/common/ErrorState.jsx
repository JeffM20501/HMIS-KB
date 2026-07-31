import { RefreshCw, WifiOff } from 'lucide-react';
import Button from '../ui/Button.jsx';

export default function ErrorState({ message = "We couldn't load this content.", onRetry, network = false }) {
  const Icon = network ? WifiOff : RefreshCw;
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-2xl bg-danger-bg flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-danger" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">
        {network ? 'Network error' : 'Something went wrong'}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mb-5">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="w-4 h-4" /> Try again
        </Button>
      )}
    </div>
  );
}
