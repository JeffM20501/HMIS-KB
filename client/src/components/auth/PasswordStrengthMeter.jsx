import { Check } from 'lucide-react';
import clsx from 'clsx';

const RULES = [
  { key: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { key: 'number', label: 'One number', test: (v) => /[0-9]/.test(v) },
  { key: 'special', label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function passwordRulesPassed(value = '') {
  return RULES.every((r) => r.test(value));
}

export default function PasswordStrengthMeter({ password = '' }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
      {RULES.map((r) => {
        const passed = r.test(password);
        return (
          <div key={r.key} className="flex items-center gap-1.5 text-xs">
            <span
              className={clsx(
                'w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors',
                passed ? 'bg-success text-white' : 'bg-gray-100 text-transparent'
              )}
            >
              <Check className="w-2.5 h-2.5" />
            </span>
            <span className={passed ? 'text-text-primary' : 'text-text-secondary'}>{r.label}</span>
          </div>
        );
      })}
    </div>
  );
}
