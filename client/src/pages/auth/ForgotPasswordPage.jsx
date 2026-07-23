import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { requestPasswordReset } from "../../api/auth";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Couldn't send the reset link. Check the email and try again.");
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
          {!sent ? (
            <>
              <div className="text-center mb-7">
                <div className="flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4" style={{ background: "#FDEEF0" }}>
                  <Mail size={22} style={{ color: "#F22F46" }} />
                </div>
                <h1 className="text-xl font-semibold mb-1.5" style={{ color: "#121C2D" }}>Reset your password</h1>
                <p className="text-sm" style={{ color: "#696E7A" }}>
                  Enter your work email and we'll send you a 6-digit OTP to reset your password.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="px-3.5 py-3 rounded-md text-sm" style={{ background: "#FDEEF0", color: "#C21B2E", border: "1px solid rgba(242,47,70,0.2)" }}>
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#243656" }}>Work email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@healthtech.co.ke"
                    autoFocus
                    className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none transition-all"
                    style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#F22F46")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#E1E3EA")}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium disabled:opacity-70 transition-opacity"
                  style={{ background: "#F22F46", color: "white" }}
                >
                  {loading ? (<><Loader2 size={15} className="animate-spin" /> Sending OTP…</>) : "Send OTP"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center py-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-5" style={{ background: "#E6F7F1" }}>
                  <CheckCircle2 size={32} style={{ color: "#00A368" }} />
                </div>
                <h1 className="text-xl font-semibold mb-2" style={{ color: "#121C2D" }}>Check your email</h1>
                <p className="text-sm mb-2" style={{ color: "#696E7A" }}>
                  If an account exists for <strong style={{ color: "#121C2D" }}>{email}</strong>, we've sent a 6-digit OTP.
                </p>
                <p className="text-sm mb-6" style={{ color: "#696E7A" }}>
                  The OTP is valid for <strong>30 minutes</strong>.
                </p>
                <button
                  onClick={() => navigate("/verify-otp", { state: { email } })}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ background: "#F22F46", color: "white" }}
                >
                  Enter OTP
                </button>
              </div>
            </>
          )}
        </div>

        <Link to="/login" className="flex items-center justify-center gap-1.5 w-full mt-4 text-xs hover:underline" style={{ color: "#696E7A" }}>
          <ArrowLeft size={13} /> Back to sign in
        </Link>
      </div>
    </div>
  );
}