import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Search, Shield, MessageCircle, ArrowRight,
  CheckCircle2, Star, Zap, BarChart3, Lock, Menu, X,
} from "lucide-react";

import client from "../../api/client";

const features = [
  { icon: Search, title: "Instant Full-Text Search", desc: "Find any SOP, guide, or procedure in under 500ms. Search by title, content, tags, or category — ranked by relevance.", color: "#0263E0" },
  { icon: MessageCircle, title: "Embedded KB Assistant", desc: "A floating chatbot your staff can query right inside HMIS. Answers come only from approved KB content — never hallucinated.", color: "#F22F46" },
  { icon: Shield, title: "Role-Based Access Control", desc: "Viewer, Editor, and Admin roles with granular permissions. Clinical SOPs are gated. Audit logs for every action.", color: "#00A368" },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Track which articles are most read, what staff are searching for, and where knowledge gaps exist.", color: "#7B2FBE" },
  { icon: Zap, title: "Structured Content Templates", desc: "How-To, SOP, FAQ, Troubleshooting, Feature Reference, and Release Notes — standardized formats that prevent freeform chaos.", color: "#E87722" },
  { icon: Lock, title: "Healthcare-Grade Security", desc: "HTTPS enforced, bcrypt passwords, JWT sessions, rate-limited login, SQL injection prevention, and XSS protection.", color: "#243656" },
];

const testimonials = [
  { quote: "New nurses used to spend 3 weeks getting comfortable with HMIS. With HealthKB, they're independent in under 10 days.", name: "Dr. Catherine Mwangi", role: "Chief Nursing Officer, Kenyatta National Hospital", avatar: "CM" },
  { quote: "The embedded chatbot is genuinely useful mid-workflow. Staff don't need to context-switch to find an answer anymore.", name: "Alex Otieno", role: "HMIS Systems Administrator", avatar: "AO" },
  { quote: "Compliance audits used to be stressful. Now every SOP is versioned, reviewed, and auditable. Game changer.", name: "Faith Njeri", role: "Compliance & Data Protection Officer", avatar: "FN" },
];

const stats = [
  { value: "85+", label: "Articles at launch" },
  { value: "75%", label: "Search success rate" },
  { value: "\u2264 2 wks", label: "Onboarding time" },
  { value: "4.4\u2605", label: "User satisfaction" },
];

const categories = [
  { name: "Getting Started", count: 12, color: "#0263E0" },
  { name: "Patient Management", count: 9, color: "#00A368" },
  { name: "Clinical Modules", count: 18, color: "#E87722" },
  { name: "Billing & Finance", count: 7, color: "#7B2FBE" },
  { name: "System Administration", count: 11, color: "#F22F46" },
  { name: "Compliance & Security", count: 8, color: "#243656" },
  { name: "Troubleshooting", count: 14, color: "#C21B2E" },
  { name: "Release Notes", count: 6, color: "#696E7A" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    total_articles: 0,
    avg_rating: 0,
    search_success_rate: 75,
    total_views: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await client.get("/stats/");
        setStats(res.data);
      } catch (error) {
        console.warn("Failed to fetch stats, using fallback values.");
        setStats({
          total_articles: 85,
          avg_rating: 4.4,
          search_success_rate: 75,
          total_views: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statsDisplay = [
    { value: `${stats.total_articles}+`, label: "Articles at launch" },
    { value: `${stats.search_success_rate}%`, label: "Search success rate" },
    { value: "≤ 2 wks", label: "Onboarding time" },
    { value: `${stats.avg_rating.toFixed(1)}★`, label: "User satisfaction" },
  ];

  return (
    <div className="font-inter bg-white">
      
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm border-gray-200">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center rounded-md w-8 h-8 bg-red-500">
              <BookOpen size={16} color="white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-base text-ink-darkest">HealthKB</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-ink">
            <a href="#features" className="hover:text-red-600 transition-colors">Features</a>
            <a href="#categories" className="hover:text-red-600 transition-colors">Categories</a>
            <a href="#testimonials" className="hover:text-red-600 transition-colors">Testimonials</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-md transition-colors hover:bg-gray-100 text-ink-dark">
              Sign in
            </Link>
            <Link to="/register" className="text-sm font-medium px-4 py-2 rounded-md transition-opacity hover:opacity-90 bg-red-500 text-white">
              Get access
            </Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} className="text-ink-dark" /> : <Menu size={20} className="text-ink-dark" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 px-6 py-4 space-y-3">
            <a href="#features" className="block text-sm py-1 text-ink">Features</a>
            <a href="#categories" className="block text-sm py-1 text-ink">Categories</a>
            <a href="#testimonials" className="block text-sm py-1 text-ink">Testimonials</a>
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="flex-1 py-2 rounded-md text-sm border font-medium text-center border-gray-200 text-ink-dark">Sign in</Link>
              <Link to="/register" className="flex-1 py-2 rounded-md text-sm font-medium text-center bg-red-500 text-white">Get access</Link>
            </div>
          </div>
        )}
      </header>

      
      <section className="relative overflow-hidden bg-navy-900">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute top-[-120px] right-[-80px] w-[500px] h-[500px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(242,47,70,0.18) 0%, transparent 70%)" }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-xs font-medium border border-red-900/30 bg-red-900/15 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Built for HMIS &amp; Healthcare Products &middot; Kenya
            </div>

            <h1 className="text-4xl lg:text-5xl font-semibold leading-tight mb-6 text-white tracking-tight">
              The knowledge base your <span className="text-red-500">clinical staff</span> actually use
            </h1>

            <p className="text-lg mb-10 leading-relaxed text-white/60 max-w-[560px]">
              A centralized, searchable repository of SOPs, how-to guides, and troubleshooting content — with an embedded AI assistant that answers questions right inside your HMIS.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium transition-opacity hover:opacity-90 bg-red-500 text-white">
                Get started free <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium border border-white/15 text-white/70 transition-colors hover:bg-white/5">
                Sign in to your account
              </Link>
            </div>

            <div className="flex items-center gap-4 mt-10">
              <div className="flex -space-x-2">
                {["AW", "GM", "SK", "FN", "DO"].map((i) => (
                  <div key={i} className="flex items-center justify-center rounded-full text-xs font-bold border-2 border-navy-900 w-7 h-7 bg-red-500 text-white">
                    {i}
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/45">
                Used daily by nurses, lab techs, and IT administrators
              </p>
            </div>
          </div>
        </div>
      </section>

      
      <section className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {statsDisplay.map((s) => (
            <div key={s.label} className="text-center">
              {loading ? (
                <div className="h-8 w-16 mx-auto bg-gray-200 animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-semibold mb-0.5 text-ink-darkest">{s.value}</div>
              )}
              <div className="text-xs text-ink-light">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-semibold mb-3 text-ink-darkest tracking-tight">Everything your team needs</h2>
            <p className="text-base text-ink-light max-w-[480px] mx-auto">
              Purpose-built for healthcare IT — not adapted from a generic wiki. Every feature is shaped around how clinical and support staff actually work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-center rounded-lg mb-4 w-10 h-10" style={{ background: `${f.color}12` }}>
                    <Icon size={18} style={{ color: f.color }} />
                  </div>
                  <h3 className="text-sm font-semibold mb-2 text-ink-darkest">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-light">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-semibold mb-3 text-ink-darkest tracking-tight">From question to answer in seconds</h2>
            <p className="text-sm text-ink-light">
              Two ways to find what you need — search the knowledge base directly, or ask the embedded assistant inside HMIS.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Search or ask", desc: "Type a query in the search bar or ask the KB Assistant a natural-language question directly inside HMIS." },
              { step: "02", title: "Get ranked results", desc: "Articles are ranked by relevance — title matches first, then tags, then body. The assistant cites its source every time." },
              { step: "03", title: "Read, act, give feedback", desc: "Read the article in a clean distraction-free view. Rate it, leave a comment, or escalate to support with one click." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col">
                <div className="text-4xl font-bold mb-4 tabular-nums text-gray-200 tracking-tight">{s.step}</div>
                <h3 className="text-base font-semibold mb-2 text-ink-darkest">{s.title}</h3>
                <p className="text-sm leading-relaxed text-ink-light">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <section id="categories" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-3 text-ink-darkest tracking-tight">Structured for healthcare workflows</h2>
            <p className="text-sm text-ink-light">8 top-level categories covering every aspect of HMIS and healthcare product operation.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-default">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                <div>
                  <div className="text-sm font-medium text-ink-darkest">{cat.name}</div>
                  <div className="text-xs text-ink-lighter">{cat.count} articles</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-3 text-ink-darkest tracking-tight">Trusted by healthcare teams</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={13} className="fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed mb-5 text-ink-dark">&ldquo;{t.quote}&rdquo;</blockquote>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 w-8 h-8 bg-navy-900 text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-ink-darkest">{t.name}</div>
                    <div className="text-xs text-ink-lighter">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <section className="py-20 bg-navy-900">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold mb-4 text-white tracking-tight">Ready to centralize your HMIS knowledge?</h2>
          <p className="text-base mb-8 text-white/55">
            Set up your knowledge base in minutes. Your team can start finding answers the same day.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="flex items-center justify-center gap-2 px-7 py-3 rounded-md text-sm font-medium transition-opacity hover:opacity-90 bg-red-500 text-white">
              Create your account <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="flex items-center justify-center gap-2 px-7 py-3 rounded-md text-sm font-medium border border-white/15 text-white/70 transition-colors hover:bg-white/5">
              Sign in
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-10 text-xs text-white/35">
            {["No credit card required", "HTTPS enforced", "Data stays in Kenya"].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 size={12} /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-md w-6 h-6 bg-red-500">
              <BookOpen size={12} color="white" />
            </div>
            <span className="text-sm font-medium text-ink-dark">HealthKB</span>
          </div>
          <p className="text-xs text-ink-lighter">&copy; 2026 HealthKB &middot; Built for HMIS &middot; Nairobi, Kenya</p>
          <div className="flex items-center gap-4 text-xs text-ink-lighter">
            <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Security</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}