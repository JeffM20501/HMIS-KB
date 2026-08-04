import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import * as authApi from '../../api/auth.api';
import { extractErrorMessage } from '../../api/axios';
import Input from '../../components/ui/Input.jsx';
import Label from '../../components/ui/Label.jsx';
import FieldError from '../../components/ui/FieldError.jsx';
import Button from '../../components/ui/Button.jsx';
import AuthBrandPanel from '../../components/auth/AuthBrandPanel.jsx';
import { ROUTES } from '../../constants/routes';

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
      <div className="min-h-screen flex bg-surface">
        <AuthBrandPanel />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-sm text-center">
            <p className="text-text-secondary mb-4">Your session expired. Please restart the password reset process.</p>
            <Button as={Link} to={ROUTES.FORGOT_PASSWORD}>
              Start over
            </Button>
          </div>
        </div>
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
    <div className="min-h-screen flex bg-surface">
      <AuthBrandPanel>
        <div>
          <h1 className="text-3xl font-bold text-white mb-4 leading-tight">Set a new password</h1>
          <p className="text-sm leading-relaxed text-white/70">
            Choose a strong password you haven't used before.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          
        </div>
      </AuthBrandPanel>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>

          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm font-bold text-text-primary">TaifaCare KB</div>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-1">Set a new password</h2>
          <p className="text-text-secondary text-sm mb-7">Choose a strong password you haven't used before.</p>

          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
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

          <p className="text-center text-xs text-text-secondary mt-5">
            Protected by TaifaCare security · <span className="text-primary">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}