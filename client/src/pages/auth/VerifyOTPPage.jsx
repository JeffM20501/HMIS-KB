import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { BookOpen, ArrowLeft, KeyRound, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { verifyOtp } from "../../api/auth";

export default function VerifyOtpPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [verified, setVerified] = useState(false);

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
        setError("Please enter the 6-digit OTP.");
        return;
    }
    if (!email) {
        setError("Email is missing. Please start over.");
        return;
    }
    setError("");
    setLoading(true);
    try {
        await verifyOtp(email, otp);
        setVerified(true);
    } catch (err) {
        setError(err.message || "Invalid or expired OTP. Please request a new one.");
    } finally {
        setLoading(false);
    }
    };

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
            {!verified ? (
            <>
                <div className="text-center mb-7">
                <div className="flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4" style={{ background: "#E8F0FD" }}>
                    <KeyRound size={22} style={{ color: "#0263E0" }} />
                </div>
                <h1 className="text-xl font-semibold mb-1.5" style={{ color: "#121C2D" }}>Enter OTP</h1>
                <p className="text-sm" style={{ color: "#696E7A" }}>
                    We sent a 6-digit OTP to <strong>{email}</strong>
                </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="px-3.5 py-3 rounded-md text-sm" style={{ background: "#FDEEF0", color: "#C21B2E", border: "1px solid rgba(242,47,70,0.2)" }}>
                    {error}
                    </div>
                )}
                <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#243656" }}>6-digit code</label>
                    <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    autoFocus
                    className="w-full px-3.5 py-2.5 text-center text-xl tracking-widest rounded-md border outline-none transition-all"
                    style={{ borderColor: "#E1E3EA", color: "#121C2D", letterSpacing: "0.5em" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#F22F46")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#E1E3EA")}
                    />
                    <p className="text-xs mt-1.5" style={{ color: "#9EA6B3" }}>
                    Enter the 6-digit code sent to your email.
                    </p>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium disabled:opacity-70 transition-opacity"
                    style={{ background: "#F22F46", color: "white" }}
                >
                    {loading ? (<><Loader2 size={15} className="animate-spin" /> Verifying…</>) : "Verify OTP"}
                </button>
                </form>

                <div className="text-center mt-4">
                <button
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs hover:underline"
                    style={{ color: "#696E7A" }}
                >
                    Didn't get the code? Request a new one.
                </button>
                </div>
            </>
            ) : (
            <>
                <div className="text-center py-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-5" style={{ background: "#E6F7F1" }}>
                    <CheckCircle2 size={32} style={{ color: "#00A368" }} />
                </div>
                <h1 className="text-xl font-semibold mb-2" style={{ color: "#121C2D" }}>OTP Verified</h1>
                <p className="text-sm mb-6" style={{ color: "#696E7A" }}>
                    Your OTP is correct. You can now set a new password.
                </p>
                <button
                    onClick={() => navigate("/reset-password", { state: { email } })}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
                    style={{ background: "#F22F46", color: "white" }}
                >
                    Set new password
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