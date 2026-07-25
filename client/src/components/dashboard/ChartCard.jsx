import Card from '../ui/Card.jsx';
import { Skeleton } from '../common/Skeleton.jsx';

export default function ChartCard({ title, subtitle, action, isLoading, children, className = '' }) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {isLoading ? <Skeleton className="h-56 w-full" /> : children}
    </Card>
  );
}
