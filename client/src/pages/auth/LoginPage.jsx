import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { extractErrorMessage } from '../../api/axios';
import Input from '../../components/ui/Input.jsx';
import Label from '../../components/ui/Label.jsx';
import FieldError from '../../components/ui/FieldError.jsx';
import Button from '../../components/ui/Button.jsx';
import AuthBrandPanel from '../../components/auth/AuthBrandPanel.jsx';
import { ROUTES } from '../../constants/routes';

// Presentational only — these are the same public counts shown on the
// Home page hero; not wired to a live query here since they're decorative
// context for a page an unauthenticated visitor is looking at, not a stat
// dashboard. See HomePage.jsx for the real, live-fetched versions.
const BRAND_STATS = [
  { value: '165+', label: 'Published Articles' },
  { value: '10', label: 'Module Categories' },
  { value: '8', label: 'Active Editors' },
  { value: '58K', label: 'Monthly Views' },
];

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const onSubmit = async (values) => {
    try {
      const user = await login(values);
      const next = params.get('next');
      if (next) navigate(next);
      else navigate(user.role === 'admin' ? '/admin' : '/editor');
    } catch (err) {
      toast.error(extractErrorMessage(err) || 'Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      <AuthBrandPanel>
        <div>
          <h1 className="text-3xl font-bold text-white mb-4 leading-tight">Clinical knowledge at your fingertips</h1>
          <p className="text-sm leading-relaxed text-white/70">
            The centralized documentation and support hub for the TaifaCare HMIS — SOPs, lab protocols, billing
            guides, and more.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          
        </div>
      </AuthBrandPanel>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm font-bold text-text-primary">TaifaCare KB</div>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-1">Sign in</h2>
          <p className="text-sm text-text-secondary mb-7">Access the TaifaCare Knowledge Base</p>

          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <Label required>Username</Label>
                <Input
                  type="text"
                  icon={User}
                  placeholder="jsmith"
                  autoComplete="username"
                  error={!!errors.username}
                  {...register('username', { required: 'Username is required' })}
                />
                <FieldError>{errors.username?.message}</FieldError>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label required className="mb-0">
                    Password
                  </Label>
                  <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    icon={Lock}
                    placeholder="••••••••"
                    error={!!errors.password}
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError>{errors.password?.message}</FieldError>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                <Lock className="w-4 h-4" /> Sign In <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-text-secondary">
                Don't have an account?{' '}
                <Link to={ROUTES.SIGNUP} className="font-semibold text-primary">
                  Create account
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-text-secondary mt-5">
            Protected by TaifaCare security · <span className="text-primary">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
