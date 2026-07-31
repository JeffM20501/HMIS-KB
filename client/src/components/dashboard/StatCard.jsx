import Card from '../ui/Card.jsx';
import { Skeleton } from '../common/Skeleton.jsx';
import clsx from 'clsx';

const TONES = {
  blue: 'bg-primary-50 text-primary',
  green: 'bg-success-bg text-success',
  amber: 'bg-warning-bg text-warning',
  red: 'bg-danger-bg text-danger',
  purple: 'bg-purple-50 text-purple-600',
  gray: 'bg-gray-100 text-gray-600',
};

export default function StatCard({ icon: Icon, label, value, sublabel, tone = 'blue', isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <Skeleton className="h-8 w-8 rounded-lg mb-3" />
        <Skeleton className="h-7 w-14 mb-2" />
        <Skeleton className="h-3 w-20" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <span className={clsx('w-9 h-9 rounded-lg flex items-center justify-center mb-3', TONES[tone])}>
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <span className="text-2xl font-bold text-text-primary leading-none">{value}</span>
      <span className="text-sm text-text-secondary mt-1.5">{label}</span>
      {sublabel && <span className="text-xs text-text-secondary/80 mt-0.5">{sublabel}</span>}
    </Card>
  );
}
