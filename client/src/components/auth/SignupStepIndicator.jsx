import { Check } from 'lucide-react';
import clsx from 'clsx';

const STEPS = [
  { n: 1, label: 'Personal Info' },
  { n: 2, label: 'Workplace' },
  { n: 3, label: 'Security' },
];

export default function SignupStepIndicator({ step }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                step > s.n ? 'bg-success text-white' : step === s.n ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary'
              )}
            >
              {step > s.n ? <Check className="w-3.5 h-3.5" /> : s.n}
            </div>
            <span className={clsx('text-xs mt-1 font-medium', step === s.n ? 'text-primary' : 'text-text-secondary')}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={clsx('flex-1 h-px mx-2 mb-4', step > s.n ? 'bg-success' : 'bg-border')} />
          )}
        </div>
      ))}
    </div>
  );
}
