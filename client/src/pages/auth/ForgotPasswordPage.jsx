import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import * as authApi from '../../api/auth.api';
import { extractErrorMessage } from '../../api/axios';
import Input from '../../components/ui/Input.jsx';
import Label from '../../components/ui/Label.jsx';
import FieldError from '../../components/ui/FieldError.jsx';
import Button from '../../components/ui/Button.jsx';
import AuthBrandPanel from '../../components/auth/AuthBrandPanel.jsx';
import { ROUTES } from '../../constants/routes';

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const navigate = useNavigate();

  const onSubmit = async ({ email }) => {
    try {
      await authApi.requestPasswordReset(email);
      toast.success('A one-time code has been sent to your email.');
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      toast.error(extractErrorMessage(err) || 'Could not send reset code.');
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      <AuthBrandPanel>
        <div>
          <h1 className="text-3xl font-bold text-white mb-4 leading-tight">Forgot your password?</h1>
          <p className="text-sm leading-relaxed text-white/70">
            Enter your email address and we'll send you a one-time verification code to reset your password.
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
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm font-bold text-text-primary">TaifaCare KB</div>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-1">Forgot your password?</h2>
          <p className="text-text-secondary text-sm mb-7">
            Enter your account email and we'll send you a one-time verification code.
          </p>

          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <Label required>Email address</Label>
                <Input
                  type="email"
                  icon={Mail}
                  placeholder="you@taifacare.health"
                  error={!!errors.email}
                  {...register('email', { required: 'Email is required' })}
                />
                <FieldError>{errors.email?.message}</FieldError>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                Send verification code
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