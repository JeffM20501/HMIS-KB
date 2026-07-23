import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { BookOpen, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { resetPassword } from "../../api/auth";

function PasswordStrength({ password }) {
  const checks = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const colors = ["#E1E3EA", "#F22F46", "#E87722", "#F7C948", "#00A368"];
  if (!password) return null;
  return (
    <div className="mt-2 flex gap-1">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex-1 h-1 rounded-full" style={{ background: n <= checks ? colors[checks] : "#E1E3EA" }} />
      ))}
    </div>
  );
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F4F4F6", fontFamily: "var(--font-inter)" }}>
        <div className="w-full max-w-md bg-white rounded-xl border p-8 text-center" style={{ borderColor: "#E1E3EA" }}>
          <AlertCircle size={28} className="mx-auto mb-4" style={{ color: "#E87722" }} />
          <h1 className="text-lg font-semibold mb-2" style={{ color: "#121C2D" }}>Missing email</h1>
          <p className="text-sm mb-6" style={{ color: "#696E7A" }}>
            Please start the password reset process again.
          </p>
          <Link to="/forgot-password" className="inline-block px-4 py-2 rounded-md text-sm font-medium" style={{ background: "#F22F46", color: "white" }}>
            Start over
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (!/[A-Z]/.test(password)) return setError("Password must include an uppercase letter.");
    if (!/\d/.test(password)) return setError("Password must include a number.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setError("");
    setLoading(true);
    try {
      await resetPassword(email, password);
      setDone(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#F4F4F6", fontFamily: "var(--font-inter)" }}>
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex items-center justify-center rounded-md" style={{ width: 36, height: 36, background: "#F22F46" }}>
            <BookOpen size={18} color="white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-base" style={{ color: "#121C2D" }}>HealthKB</span>
        </Link>

        <div className="bg-white rounded-xl border p-8 shadow-sm" style={{ borderColor: "#E1E3EA" }}>
          {done ? (
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-5" style={{ background: "#E6F7F1" }}>
                <CheckCircle2 size={32} style={{ color: "#00A368" }} />
              </div>
              <h1 className="text-xl font-semibold mb-2" style={{ color: "#121C2D" }}>Password updated</h1>
              <p className="text-sm mb-7" style={{ color: "#696E7A" }}>Sign in with your new password to continue.</p>
              <button onClick={() => navigate("/login")} className="w-full py-2.5 rounded-md text-sm font-medium transition-opacity hover:opacity-90" style={{ background: "#F22F46", color: "white" }}>
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-7">
                <h1 className="text-xl font-semibold mb-1.5" style={{ color: "#121C2D" }}>Set a new password</h1>
                <p className="text-sm" style={{ color: "#696E7A" }}>
                  For account: <strong>{email}</strong>
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="px-3.5 py-3 rounded-md text-sm" style={{ background: "#FDEEF0", color: "#C21B2E", border: "1px solid rgba(242,47,70,0.2)" }}>
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#243656" }}>New password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                      className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-md border outline-none"
                      style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#9EA6B3" }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#243656" }}>Confirm new password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-md border outline-none"
                      style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#9EA6B3" }}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium disabled:opacity-70 transition-opacity"
                  style={{ background: "#F22F46", color: "white" }}
                >
                  {loading ? (<><Loader2 size={15} className="animate-spin" /> Setting password…</>) : "Set new password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}