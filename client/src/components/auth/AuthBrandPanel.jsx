import { ShieldCheck } from 'lucide-react';

/**
 * Shared left-hand brand panel for the two-panel auth pages (Login, Sign Up).
 * Deliberately NOT part of AuthLayout.jsx — Forgot Password / Verify OTP /
 * Reset Password keep the existing simple centered-card AuthLayout untouched,
 * since only Login and Sign Up are in scope for the new design. Login and
 * SignUp each pass their own `children` (stat tiles vs. feature checklist +
 * testimonial) since that content differs between the two per the design.
 */
export default function AuthBrandPanel({ children }) {
  return (
    <div
      className="hidden lg:flex lg:w-[440px] xl:w-[480px] shrink-0 flex-col justify-between p-10"
      style={{
        backgroundColor: '#1E3A8A',
        backgroundImage:
          'radial-gradient(ellipse at 30% 20%, #2563EB 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, #1D4ED8 0%, transparent 50%)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/15">
          <ShieldCheck className="w-[18px] h-[18px] text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-white">TaifaCare</div>
          <div className="text-xs text-white/60">Knowledge Base Platform</div>
        </div>
      </div>

      {children}
    </div>
  );
}
