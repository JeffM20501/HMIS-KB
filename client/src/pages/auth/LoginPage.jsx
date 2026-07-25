import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, User, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { extractErrorMessage } from '../../api/axios';
import Input from '../../components/ui/Input.jsx';
import Label from '../../components/ui/Label.jsx';
import FieldError from '../../components/ui/FieldError.jsx';
import Button from '../../components/ui/Button.jsx';

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
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to home
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-1">Staff sign in</h1>
      <p className="text-text-secondary text-sm mb-8">Sign in to manage and publish knowledge base content.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label required>Username</Label>
          <Input
            type="text"
            icon={User}
            placeholder="Username"
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
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder="••••••••"
              error={!!errors.password}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password should be at least 8 characters long' },
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
          <FieldError>{errors.password?.message}</FieldError>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="text-xs text-text-secondary text-center mt-8">
        Access is restricted to TaifaCare staff (Editors and Admins). Viewers browse the public knowledge base without
        signing in.
      </p>
    </div>
  );
}
