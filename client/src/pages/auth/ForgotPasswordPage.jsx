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

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    getValues,
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
    <div>
      <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to sign in
      </Link>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Forgot your password?</h1>
      <p className="text-text-secondary text-sm mb-8">
        Enter your account email and we'll send you a one-time verification code.
      </p>

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
  );
}
