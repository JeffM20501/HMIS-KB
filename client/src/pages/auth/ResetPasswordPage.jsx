import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import * as authApi from '../../api/auth.api';
import { extractErrorMessage } from '../../api/axios';
import Input from '../../components/ui/Input.jsx';
import Label from '../../components/ui/Label.jsx';
import FieldError from '../../components/ui/FieldError.jsx';
import Button from '../../components/ui/Button.jsx';

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, otp } = location.state || {};
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  if (!email || !otp) {
    return (
      <div className="text-center">
        <p className="text-text-secondary mb-4">Your session expired. Please restart the password reset process.</p>
        <Button as={Link} to="/forgot-password">
          Start over
        </Button>
      </div>
    );
  }

  const onSubmit = async ({ password }) => {
    try {
      await authApi.resetPassword({ email, otp, new_password: password });
      toast.success('Password updated. Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(extractErrorMessage(err) || 'Could not reset password.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Set a new password</h1>
      <p className="text-text-secondary text-sm mb-8">Choose a strong password you haven't used before.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label required>New password</Label>
          <Input
            type="password"
            icon={Lock}
            placeholder="••••••••"
            error={!!errors.password}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'At least 8 characters' },
            })}
          />
          <FieldError>{errors.password?.message}</FieldError>
        </div>

        <div>
          <Label required>Confirm password</Label>
          <Input
            type="password"
            icon={Lock}
            placeholder="••••••••"
            error={!!errors.confirm}
            {...register('confirm', {
              required: 'Please confirm your password',
              validate: (v) => v === watch('password') || 'Passwords do not match',
            })}
          />
          <FieldError>{errors.confirm?.message}</FieldError>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Reset password
        </Button>
      </form>
    </div>
  );
}
