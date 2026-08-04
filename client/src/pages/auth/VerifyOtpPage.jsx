import { useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import * as authApi from '../../api/auth.api';
import { extractErrorMessage } from '../../api/axios';
import Button from '../../components/ui/Button.jsx';
import AuthBrandPanel from '../../components/auth/AuthBrandPanel.jsx';
import { ROUTES } from '../../constants/routes';

const CODE_LENGTH = 6;

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputsRef = useRef([]);

  if (!email) {
    return (
      <div className="min-h-screen flex bg-surface">
        <AuthBrandPanel />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-sm text-center">
            <p className="text-text-secondary mb-4">
              Your session expired. Please restart the password reset process.
            </p>
            <Button as={Link} to={ROUTES.FORGOT_PASSWORD}>
              Start over
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (i, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...digits];
    next[i] = value;
    setDigits(next);
    if (value && i < CODE_LENGTH - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  const otp = digits.join('');

  const submit = async (e) => {
    e.preventDefault();
    if (otp.length !== CODE_LENGTH) return;
    setIsSubmitting(true);
    try {
      await authApi.verifyOtp({ email, otp });
      toast.success('Code verified.');
      navigate('/reset-password', { state: { email, otp } });
    } catch (err) {
      toast.error(extractErrorMessage(err) || 'Invalid or expired code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      <AuthBrandPanel>
        <div>
          <h1 className="text-3xl font-bold text-white mb-4 leading-tight">Verify your email</h1>
          <p className="text-sm leading-relaxed text-white/70">
            We sent a {CODE_LENGTH}-digit code to your email address. Enter it below to continue.
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

          <h2 className="text-2xl font-bold text-text-primary mb-1">Enter verification code</h2>
          <p className="text-text-secondary text-sm mb-7">
            We sent a {CODE_LENGTH}-digit code to <span className="font-medium text-text-primary">{email}</span>.
          </p>

          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <form onSubmit={submit}>
              <div className="flex items-center justify-between gap-2 mb-6">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    value={d}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    inputMode="numeric"
                    maxLength={1}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-semibold rounded border border-border focus-ring focus:border-primary"
                  />
                ))}
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting} disabled={otp.length !== CODE_LENGTH}>
                Verify code
              </Button>
            </form>

            <button
              onClick={() => authApi.requestPasswordReset(email)}
              className="text-xs text-primary hover:underline mt-4 mx-auto block"
            >
              Resend code
            </button>
          </div>

          <p className="text-center text-xs text-text-secondary mt-5">
            Protected by TaifaCare security · <span className="text-primary">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}