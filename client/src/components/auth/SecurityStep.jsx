import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Input from '../ui/Input.jsx';
import Label from '../ui/Label.jsx';
import FieldError from '../ui/FieldError.jsx';
import Button from '../ui/Button.jsx';
import PasswordStrengthMeter, { passwordRulesPassed } from './PasswordStrengthMeter.jsx';

export default function SecurityStep({ register, errors, watch, onBack, isSubmitting }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const password = watch('password') || '';

  return (
    <div className="space-y-4">
      <div>
        <Label required>Password</Label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            error={!!errors.password}
            {...register('password', {
              required: 'Required',
              validate: (v) => passwordRulesPassed(v) || 'Password does not meet the requirements below',
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <PasswordStrengthMeter password={password} />
        <FieldError>{errors.password?.message}</FieldError>
      </div>

      <div>
        <Label required>Confirm Password</Label>
        <div className="relative">
          <Input
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repeat your password"
            error={!!errors.confirm_password}
            {...register('confirm_password', {
              required: 'Required',
              validate: (v) => v === password || 'Passwords do not match',
            })}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <FieldError>{errors.confirm_password?.message}</FieldError>
      </div>

      <label className="flex items-start gap-2.5 pt-1">
        <input
          type="checkbox"
          className="mt-0.5 rounded border-border"
          {...register('agree_terms', { required: 'You must accept the terms to continue' })}
        />
        <span className="text-xs text-text-secondary leading-relaxed">
          I agree to the <Link to="#" className="text-primary underline">Terms of Service</Link> and{' '}
          <Link to="#" className="text-primary underline">Privacy Policy</Link>. I acknowledge that my account will
          require administrator approval.
        </span>
      </label>
      <FieldError>{errors.agree_terms?.message}</FieldError>

      <div className="flex gap-3 pt-1">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          size="lg"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1"
          size="lg"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating…' : 'Create Account'}
        </Button>
      </div>
    </div>
  );
}