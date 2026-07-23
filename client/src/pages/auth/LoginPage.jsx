import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Eye, EyeOff, Loader2 } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import client from "../../api/client";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/app/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total_articles: 85,
    avg_rating: 4.4,
    search_success_rate: 75,
    total_views: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch real stats from the backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await client.get("/stats/");
        setStats(res.data);
      } catch (err) {
        console.warn("Failed to fetch stats, using fallback values.");
        // fallback values already set in initial state
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statsDisplay = [
    { value: `${stats.total_articles}+`, label: "Articles" },
    { value: `${stats.avg_rating.toFixed(1)}★`, label: "Avg Rating" },
    { value: stats.search_success_rate ? `${stats.search_success_rate}%` : "—", label: "Search Success" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "var(--font-inter)" }}>
      {/* Left panel — now showing real stats */}
      <div className="hidden lg:flex flex-col justify-between p-12 w-2/5" style={{ background: "#06033A" }}>
        <Link to="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-md" style={{ width: 36, height: 36, background: "#F22F46" }}>
            <BookOpen size={18} color="white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold" style={{ color: "white" }}>HealthKB</span>
        </Link>

        <div>
          <blockquote className="text-2xl font-light leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.85)" }}>
            &ldquo;The single source of truth for every HMIS workflow, protocol, and procedure — right when you need it.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#F22F46", color: "white" }}>AW</div>
            <div>
              <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>Amina Wanjiku</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Ward Nurse, Kenyatta National Hospital</div>
            </div>
          </div>
        </div>

        {/* Stats section — real data from DB */}
        <div className="grid grid-cols-3 gap-4">
          {statsDisplay.map((s) => (
            <div key={s.label} className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.06)" }}>
              {statsLoading ? (
                <div className="h-8 w-12 mx-auto bg-white/10 animate-pulse rounded" />
              ) : (
                <div className="text-xl font-semibold mb-0.5" style={{ color: "white" }}>{s.value}</div>
              )}
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form (unchanged) */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: "#F4F4F6" }}>
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex items-center justify-center rounded-md" style={{ width: 32, height: 32, background: "#F22F46" }}>
              <BookOpen size={16} color="white" />
            </div>
            <span className="text-base font-semibold" style={{ color: "#121C2D" }}>HealthKB</span>
          </Link>

          <div className="bg-white rounded-xl p-8 shadow-sm" style={{ border: "1px solid #E1E3EA" }}>
            <div className="mb-7">
              <h1 className="text-2xl font-semibold mb-1.5" style={{ color: "#121C2D" }}>Sign in</h1>
              <p className="text-sm" style={{ color: "#696E7A" }}>Access the HMIS Knowledge Base Platform</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <ErrorBanner message={error} />

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="w-full px-3.5 py-2.5 rounded-md text-sm outline-none border transition-all"
                  style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#F22F46")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E1E3EA")}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium" style={{ color: "#243656" }}>Password</label>
                  <Link to="/forgot-password" className="text-xs hover:underline" style={{ color: "#F22F46" }}>
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full px-3.5 py-2.5 rounded-md text-sm outline-none border transition-all pr-10"
                    style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#F22F46")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#E1E3EA")}
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
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded accent-red-500"
                />
                <label htmlFor="remember" className="text-sm" style={{ color: "#696E7A" }}>
                  Keep me signed in for 8 hours
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-opacity disabled:opacity-70"
                style={{ background: "#F22F46", color: "white", marginTop: 4 }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Signing in…
                  </>
                ) : (
                  "Sign in to HealthKB"
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-5" style={{ color: "#9EA6B3" }}>
            Protected by end-to-end encryption &middot; Sessions expire after 8 hours of inactivity
          </p>

          <p className="text-center text-xs mt-3" style={{ color: "#9EA6B3" }}>
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-medium hover:underline" style={{ color: "#F22F46" }}>
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}