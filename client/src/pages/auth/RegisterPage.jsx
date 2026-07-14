import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Check,
  ArrowLeft,
  Search,
  Bot,
  ClipboardList,
  Shield,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { DEPARTMENTS } from "../../utils/constants";

function PasswordStrength({ password }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
    { label: "Special character", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const levels = [
    { label: "", color: "#E1E3EA" },
    { label: "Weak", color: "#F22F46" },
    { label: "Fair", color: "#E87722" },
    { label: "Good", color: "#F7C948" },
    { label: "Strong", color: "#00A368" },
  ];
  const level = levels[score];
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex-1 h-1 rounded-full transition-all" style={{ background: n <= score ? level.color : "#E1E3EA" }} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        {score > 0 && <span className="text-xs font-medium" style={{ color: level.color }}>{level.label}</span>}
        <div className="flex flex-wrap gap-x-3 gap-y-1 ml-auto">
          {checks.map((c) => (
            <span key={c.label} className="flex items-center gap-1 text-xs" style={{ color: c.ok ? "#00A368" : "#9EA6B3" }}>
              <Check size={10} /> {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    department: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const set = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Username is required";
    else if (form.username.length < 3) e.username = "Username must be at least 3 characters";
    else if (form.username.length > 30) e.username = "Username must be less than 30 characters";
    if (!form.email.includes("@")) e.email = "Enter a valid email address";
    if (!form.department) e.department = "Please select your department";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(form.password)) e.password = "Must include an uppercase letter";
    else if (!/\d/.test(form.password)) e.password = "Must include a number";
    else if (!/[^A-Za-z0-9]/.test(form.password)) e.password = "Must include a special character";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!form.agreeTerms) e.terms = "You must accept the terms to continue";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        department: form.department,
        password: form.password,
      });
      setSubmitted(true);
    } catch (err) {
      setErrors({ form: err.message || "Could not create your account. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({ borderColor: errors[field] ? "#F22F46" : "#E1E3EA", color: "#121C2D" });
  const focusStyle = (e) => (e.currentTarget.style.borderColor = "#F22F46");
  const blurStyle = (field) => (e) => (e.currentTarget.style.borderColor = errors[field] ? "#F22F46" : "#E1E3EA");

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F4F4F6", fontFamily: "var(--font-inter)" }}>
        <div className="w-full max-w-md bg-white rounded-xl border p-8 text-center" style={{ borderColor: "#E1E3EA" }}>
          <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-5" style={{ background: "#E6F7F1" }}>
            <CheckCircle2 size={32} style={{ color: "#00A368" }} />
          </div>
          <h1 className="text-xl font-semibold mb-2" style={{ color: "#121C2D" }}>Request submitted</h1>
          <p className="text-sm mb-2" style={{ color: "#696E7A" }}>
            Your account has been created with <strong>Viewer</strong> access. An Admin will review your request and can
            upgrade your role if you need to author content.
          </p>
          <p className="text-sm mb-7" style={{ color: "#696E7A" }}>
            You'll receive a confirmation email within 24 hours.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-2.5 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "#F22F46", color: "white" }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "var(--font-inter)", background: "#F4F4F6" }}>
      {/* Left panel — dark navy */}
      <div className="hidden lg:flex flex-col p-12 w-5/12" style={{ background: "#06033A" }}>
        <Link to="/" className="flex items-center gap-2.5 mb-auto">
          <div className="flex items-center justify-center rounded-md" style={{ width: 32, height: 32, background: "#F22F46" }}>
            <BookOpen size={16} color="white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold" style={{ color: "white" }}>HealthKB</span>
        </Link>

        <div className="py-12">
          <h2 className="text-2xl font-semibold mb-6 leading-snug" style={{ color: "white" }}>
            Join your team on HealthKB
          </h2>
          <div className="space-y-4">
            {[
              { icon: Search, text: "Search 85+ SOPs and how-to guides instantly", color: "#0263E0" },
              { icon: Bot, text: "Ask the KB Assistant from within HMIS — no context switch", color: "#F22F46" },
              { icon: ClipboardList, text: "Structured templates for every article type", color: "#00A368" },
              { icon: Shield, text: "Role-based access — you only see what you need", color: "#7B2FBE" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.text} className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
                    style={{ width: 32, height: 32, background: `${f.color}20`, color: f.color }}
                  >
                    <Icon size={16} />
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {f.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          All new accounts start with Viewer access. Editor or Admin access must be granted by an Admin.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-start justify-center overflow-y-auto py-10 px-6">
        <div className="w-full max-w-lg">
          <Link to="/" className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "#F22F46" }}>
              <BookOpen size={14} color="white" />
            </div>
            <span className="font-semibold text-sm" style={{ color: "#121C2D" }}>HealthKB</span>
          </Link>

          <Link to="/login" className="flex items-center gap-1.5 text-xs mb-5 hover:underline" style={{ color: "#696E7A" }}>
            <ArrowLeft size={13} /> Back to sign in
          </Link>

          <div className="bg-white rounded-xl border p-8" style={{ borderColor: "#E1E3EA" }}>
            <div className="mb-7">
              <h1 className="text-2xl font-semibold" style={{ color: "#121C2D" }}>Create your account</h1>
              <p className="text-sm" style={{ color: "#696E7A" }}>
                Request access to the HMIS Knowledge Base Platform
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.form && (
                <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-md text-sm" style={{ background: "#FDEEF0", border: "1px solid rgba(242,47,70,0.2)", color: "#C21B2E" }}>
                  <AlertCircle size={15} className="flex-shrink-0" /> {errors.form}
                </div>
              )}

              {/* Username */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#243656" }}>Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => set("username", e.target.value)}
                  placeholder="Choose a username"
                  className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none transition-all"
                  style={inputStyle("username")}
                  onFocus={focusStyle}
                  onBlur={blurStyle("username")}
                />
                {errors.username && <p className="text-xs mt-1" style={{ color: "#F22F46" }}>{errors.username}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#243656" }}>Work email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@hospital.co.ke"
                  className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none transition-all"
                  style={inputStyle("email")}
                  onFocus={focusStyle}
                  onBlur={blurStyle("email")}
                />
                {errors.email && <p className="text-xs mt-1" style={{ color: "#F22F46" }}>{errors.email}</p>}
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#243656" }}>Department</label>
                <select
                  value={form.department}
                  onChange={(e) => set("department", e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none transition-all appearance-none"
                  style={inputStyle("department")}
                  onFocus={focusStyle}
                  onBlur={blurStyle("department")}
                >
                  <option value="">Select department…</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <p className="text-xs mt-1" style={{ color: "#F22F46" }}>{errors.department}</p>}
              </div>

              {/* Access level notice */}
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg" style={{ background: "#F4F4F6" }}>
                <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#696E7A" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#696E7A" }}>
                  Your account will be created with <strong style={{ color: "#243656" }}>Viewer</strong> access — you can
                  search and read published articles right away. If you need to author content, ask an Admin to upgrade
                  your role to Editor after you sign in.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#243656" }}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-md border outline-none transition-all"
                    style={inputStyle("password")}
                    onFocus={focusStyle}
                    onBlur={blurStyle("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#9EA6B3" }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordStrength password={form.password} />
                {errors.password && <p className="text-xs mt-1" style={{ color: "#F22F46" }}>{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#243656" }}>Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-md border outline-none transition-all"
                    style={inputStyle("confirmPassword")}
                    onFocus={focusStyle}
                    onBlur={blurStyle("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#9EA6B3" }}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: "#F22F46" }}>{errors.confirmPassword}</p>}
              </div>

              {/* Terms */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agreeTerms}
                    onChange={(e) => set("agreeTerms", e.target.checked)}
                    className="mt-0.5 flex-shrink-0"
                    style={{ accentColor: "#F22F46" }}
                  />
                  <span className="text-xs leading-relaxed" style={{ color: "#696E7A" }}>
                    I acknowledge that patient data must never be included in knowledge base content, and I will follow the{" "}
                    <a href="#" className="hover:underline" style={{ color: "#F22F46" }}>Data Privacy Policy</a>.
                  </span>
                </label>
                {errors.terms && <p className="text-xs mt-1" style={{ color: "#F22F46" }}>{errors.terms}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-opacity disabled:opacity-70 mt-2"
                style={{ background: "#F22F46", color: "white" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Creating account…
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <p className="text-center text-xs mt-5" style={{ color: "#9EA6B3" }}>
              Already have an account?{" "}
              <Link to="/login" className="font-medium hover:underline" style={{ color: "#F22F46" }}>
                Sign in
              </Link>
            </p>
          </div>

          {/* Info box */}
          <div className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-lg" style={{ background: "#E8F0FD", border: "1px solid rgba(2,99,224,0.15)" }}>
            <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#0263E0" }} />
            <p className="text-xs leading-relaxed" style={{ color: "#0263E0" }}>
              New accounts are created with Viewer permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}