// src/pages/AdminPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, FileText, TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  Search, Trash2, Shield, Eye, Star, BarChart3, Loader2, FolderTree, Plus, X,
  RefreshCw, ArrowUpRight, Clock,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { listArticles, publishArticle, rejectArticle, deleteArticle } from "../api/articles";
import { listUsers, updateUserRole, updateUserStatus, deleteUser } from "../api/users";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../api/categories";
import { getDashboardAnalytics } from "../api/analytics";
import Spinner from "../components/common/Spinner.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import { ROLE_LABELS, ROLES } from "../utils/constants";

const roleColors = {
  admin: { bg: "#FDEEF0", color: "#F22F46" },
  editor: { bg: "#E8F0FD", color: "#0263E0" },
  viewer: { bg: "#F4F4F6", color: "#696E7A" },
};

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "articles", label: "Articles", icon: FileText },
  { key: "users", label: "Users", icon: Users },
  { key: "categories", label: "Categories", icon: FolderTree },
];

// How stale a published article has to be (no update) before it's flagged
// for re-review — matches the PRD's 180-day content freshness policy.
const STALE_DAYS = 180;

/** Small stat card with an optional %-change badge and a tiny trend sparkline. */
function StatCard({ label, value, sub, badgePct, color, sparkline, sparklineKey }) {
  return (
    <div className="bg-white rounded-lg p-5 border" style={{ borderColor: "#E1E3EA" }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium" style={{ color: "#696E7A" }}>{label}</span>
        {badgePct !== null && badgePct !== undefined && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: badgePct >= 0 ? "#E6F7F1" : "#FDEEF0",
              color: badgePct >= 0 ? "#00A368" : "#F22F46",
            }}
          >
            {badgePct >= 0 ? "+" : ""}{badgePct}%
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold mb-0.5" style={{ color: "#121C2D" }}>{value}</div>
      <div className="text-xs mb-3" style={{ color: "#9EA6B3" }}>{sub}</div>
      {sparkline && sparkline.length > 0 && (
        <ResponsiveContainer width="100%" height={40}>
          <AreaChart data={sparkline}>
            <defs>
              <linearGradient id={`spark-${sparklineKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={sparklineKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#spark-${sparklineKey})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);

  const [articleSearch, setArticleSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    parent: "",
    sort_order: 0,
    icon: "",
  });
  const [categoryFormError, setCategoryFormError] = useState("");
  const [submittingCategory, setSubmittingCategory] = useState(false);

  const loadAll = () => {
    setLoading(true);
    setError("");
    Promise.all([
      listCategories().catch(() => []),
      listArticles({ page_size: 100 }).catch(() => []),
      listUsers().catch(() => []),
    ])
      .then(async ([c, art, u]) => {
        const categoriesData = c.results ?? c ?? [];
        const articlesData = art.results ?? art ?? [];
        setCategories(categoriesData);
        setArticles(articlesData);
        setUsers(u.users ?? u.results ?? u ?? []);

        const totalViews = articlesData.reduce((sum, a) => sum + (a.views ?? 0), 0);
        const a = await getDashboardAnalytics(totalViews).catch(() => null);
        setAnalytics(a);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  // -------- Lookup maps --------
  const userMap = useMemo(() => {
    const map = {};
    users.forEach((u) => { map[u.id] = u; });
    return map;
  }, [users]);

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => { map[c.id] = c; });
    return map;
  }, [categories]);

  // -------- Computed stats --------
  const pendingReview = useMemo(
    () => articles.filter((a) => a.status === "pending_review"),
    [articles]
  );

  const publishedArticles = useMemo(
    () => articles.filter((a) => a.status === "published"),
    [articles]
  );

  const nonDraftArticles = useMemo(
    () => articles.filter((a) => a.status !== "draft"),
    [articles]
  );

  const totalNonDraft = nonDraftArticles.length;
  const draftCount = useMemo(
    () => articles.filter((a) => a.status === "draft").length,
    [articles]
  );

  const totalViews = useMemo(
    () => articles.reduce((sum, a) => sum + (a.views ?? 0), 0),
    [articles]
  );

  // Published articles whose content hasn't been touched in STALE_DAYS+ —
  // real computation from each article's `updated_at`, matching the PRD's
  // 180-day freshness policy (no backend flag needed for this one).
  const staleArticles = useMemo(() => {
    const cutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
    return publishedArticles.filter((a) => a.updated_at && new Date(a.updated_at).getTime() < cutoff);
  }, [publishedArticles]);

  // -------- Filtered data for tables --------
  const filteredArticles = useMemo(
    () => articles
      .filter((a) => a.status !== "draft")                      // hide drafts from the table
      .filter((a) => a.title.toLowerCase().includes(articleSearch.toLowerCase())),
    [articles, articleSearch]
  );

  const filteredUsers = useMemo(
    () => users.filter((u) => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())),
    [users, userSearch]
  );

  // Real per-category totals from the articles already loaded — total views
  // per category (not just article counts) to match "Articles & Views by
  // Category".
  const categoryViewStats = useMemo(() => {
    const byCategory = {};
    articles.forEach((a) => {
      const catId = a.category?.id ?? a.category;
      if (catId == null) return;
      byCategory[catId] = (byCategory[catId] ?? 0) + (a.views ?? 0);
    });
    return categories
      .map((c) => ({
        name: c.name?.split(" ")[0] ?? c.name,
        views: byCategory[c.id] ?? 0,
      }))
      .filter((c) => c.views > 0)
      .sort((a, b) => b.views - a.views);
  }, [categories, articles]);

  const timeSeries = analytics?.timeSeries ?? [];
  const ratingDist = analytics?.ratingDistribution ?? [];
  const sparkline14 = timeSeries.slice(-14);

  // ---- Article actions ----
  const handlePublish = async (a) => {
    setBusyId(a.id);
    try {
      await publishArticle(a.id);
      setArticles((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: "published" } : x)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (a) => {
    const note = window.prompt("Note for the editor (optional):", "");
    setBusyId(a.id);
    try {
      await rejectArticle(a.id, note ?? "");
      setArticles((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: "draft" } : x)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteArticle = async (a) => {
    if (!window.confirm(`Archive "${a.title}"? This can be restored from version history.`)) return;
    setBusyId(a.id);
    try {
      await deleteArticle(a.id);
      setArticles((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: "archived" } : x)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ---- User actions ----
  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Remove ${u.name}'s access?`)) return;
    setBusyId(u.id);
    try {
      await deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ---- Category actions ----
  const handleDeleteCategory = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"? This will remove it from all articles.`)) return;
    setBusyId(c.id);
    try {
      await deleteCategory(c.id);
      setCategories((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setCategoryFormError("");
    setSubmittingCategory(true);
    try {
      await createCategory(categoryForm);
      setShowCategoryModal(false);
      const updated = await listCategories();
      setCategories(updated.results ?? updated ?? []);
      setCategoryForm({ name: "", slug: "", description: "", parent: "", sort_order: 0, icon: "" });
    } catch (err) {
      setCategoryFormError(err.response?.data?.detail || err.message || "Failed to create category.");
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleNameChange = (name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setCategoryForm({ ...categoryForm, name, slug });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "#121C2D" }}>Admin Panel</h1>
        <p className="text-sm mt-1" style={{ color: "#696E7A" }}>
          Review submissions, manage users, and monitor knowledge base health.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b" style={{ borderColor: "#E8E8EC" }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
              style={{ borderColor: active ? "#F22F46" : "transparent", color: active ? "#F22F46" : "#696E7A" }}
            >
              <Icon size={14} /> {t.label}
              {t.key === "articles" && pendingReview.length > 0 && (
                <span className="text-xs font-semibold px-1.5 rounded-full" style={{ background: "#FEF9E7", color: "#C9A000" }}>
                  {pendingReview.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner label="Loading admin data…" /></div>
      ) : (
        <>
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stat cards with sparklines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Total Views (30d)"
                  value={totalViews.toLocaleString()}
                  sub="All articles"
                  badgePct={analytics?.viewsChangePct}
                  color="#F22F46"
                  sparkline={sparkline14}
                  sparklineKey="views"
                />
                <StatCard
                  label="Searches (30d)"
                  value={(analytics?.totalSearches ?? 0).toLocaleString()}
                  sub="Full-text queries"
                  badgePct={analytics?.searchesChangePct}
                  color="#0263E0"
                  sparkline={sparkline14}
                  sparklineKey="searches"
                />
                <StatCard
                  label="Avg Rating"
                  value={analytics?.avgRating ? `${analytics.avgRating.toFixed(1)}/5` : "—"}
                  sub={`Across ${analytics?.ratingCount ?? 0} ratings`}
                  color="#F7C948"
                />
                <StatCard
                  label="Articles"
                  value={totalNonDraft}
                  sub={`${publishedArticles.length} published \u00b7 ${pendingReview.length + draftCount} drafts/review`}
                  color="#00A368"
                />
              </div>

              {/* Activity trend + Rating distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                <div className="bg-white rounded-lg border p-5" style={{ borderColor: "#E1E3EA" }}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#121C2D" }}>Activity — Last 30 Days</p>
                      <p className="text-xs" style={{ color: "#9EA6B3" }}>Daily searches and article views</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={timeSeries} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F22F46" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#F22F46" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F6" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#9EA6B3" }}
                        axisLine={false}
                        tickLine={false}
                        interval={Math.ceil(timeSeries.length / 5)}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#9EA6B3" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E1E3EA" }} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        height={24}
                        iconType="plainline"
                        wrapperStyle={{ fontSize: 12, color: "#696E7A" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        name="Views"
                        stroke="#F22F46"
                        fill="url(#viewsFill)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="searches"
                        name="Searches"
                        stroke="#0263E0"
                        fill="transparent"
                        strokeWidth={2}
                        strokeDasharray="4 3"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg border p-5" style={{ borderColor: "#E1E3EA" }}>
                  <p className="text-sm font-semibold" style={{ color: "#121C2D" }}>Rating Distribution</p>
                  <p className="text-xs mb-4" style={{ color: "#9EA6B3" }}>From {analytics?.ratingCount ?? 0} article ratings</p>
                  <div className="space-y-2.5">
                    {ratingDist.map((r) => {
                      const total = ratingDist.reduce((s, x) => s + x.count, 0) || 1;
                      return (
                        <div key={r.stars} className="flex items-center gap-3">
                          <span className="text-xs w-8" style={{ color: "#696E7A" }}>{r.stars}</span>
                          <div className="flex-1 h-2 rounded-full" style={{ background: "#F4F4F6" }}>
                            <div className="h-2 rounded-full" style={{ width: `${(r.count / total) * 100}%`, background: r.color }} />
                          </div>
                          <span className="text-xs w-6 text-right" style={{ color: "#9EA6B3" }}>{r.count}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: "#F4F4F6" }}>
                    <span className="text-xs font-medium" style={{ color: "#696E7A" }}>Average</span>
                    <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: "#121C2D" }}>
                      <Star size={13} style={{ color: "#F7C948", fill: "#F7C948" }} />
                      {analytics?.avgRating ? analytics.avgRating.toFixed(1) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Articles & Views by Category */}
              {categoryViewStats.length > 0 && (
                <div className="bg-white rounded-lg border p-5" style={{ borderColor: "#E1E3EA" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#121C2D" }}>Articles &amp; Views by Category</p>
                      <p className="text-xs" style={{ color: "#9EA6B3" }}>All-time article view counts per category</p>
                    </div>
                    <BarChart3 size={16} style={{ color: "#D1D5DB" }} />
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={categoryViewStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F6" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9EA6B3" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#9EA6B3" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E1E3EA" }} />
                      <Bar dataKey="views" name="Views" radius={[4, 4, 0, 0]} fill="#F4818C" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Content Health + Pending Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border p-5" style={{ borderColor: "#E1E3EA" }}>
                  <p className="text-sm font-semibold mb-4" style={{ color: "#121C2D" }}>Content Health</p>
                  <div className="space-y-4">
                    {[
                      { label: "Published", count: publishedArticles.length, color: "#00A368" },
                      { label: "In Review", count: pendingReview.length, color: "#0263E0" },
                      { label: "Drafts", count: draftCount, color: "#9EA6B3" },
                      { label: "Needs Re-review", count: staleArticles.length, color: "#E87722" },
                    ].map((row) => {
                      const scale = totalNonDraft + draftCount || 1;
                      const width = Math.min(100, Math.round((row.count / scale) * 100));
                      return (
                        <div key={row.label}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium" style={{ color: "#455A77" }}>{row.label}</span>
                            <span className="text-xs font-semibold" style={{ color: "#121C2D" }}>{row.count}</span>
                          </div>
                          <div className="h-2 rounded-full" style={{ background: "#F4F4F6" }}>
                            <div className="h-2 rounded-full" style={{ width: `${width}%`, background: row.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-5" style={{ borderColor: "#E1E3EA" }}>
                  <p className="text-sm font-semibold mb-4" style={{ color: "#121C2D" }}>Pending Actions</p>
                  <div className="divide-y" style={{ borderColor: "#F4F4F6" }}>
                    {staleArticles.length > 0 && (
                      <div className="flex items-center gap-3 py-3 first:pt-0">
                        <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, background: "#FEF3E7" }}>
                          <AlertTriangle size={15} style={{ color: "#E87722" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: "#121C2D" }}>
                            {staleArticles.length} article{staleArticles.length === 1 ? "" : "s"} need re-review
                          </p>
                          <p className="text-xs" style={{ color: "#9EA6B3" }}>Not reviewed in {STALE_DAYS}+ days</p>
                        </div>
                        <button
                          onClick={() => setActiveTab("articles")}
                          className="flex items-center gap-1 text-xs font-medium hover:underline flex-shrink-0"
                          style={{ color: "#E87722" }}
                        >
                          View <ArrowUpRight size={12} />
                        </button>
                      </div>
                    )}

                    {pendingReview.length > 0 && (
                      <div className="flex items-center gap-3 py-3 first:pt-0">
                        <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, background: "#E8F0FD" }}>
                          <RefreshCw size={15} style={{ color: "#0263E0" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: "#121C2D" }}>
                            {pendingReview.length} article{pendingReview.length === 1 ? "" : "s"} awaiting review
                          </p>
                          <p className="text-xs" style={{ color: "#9EA6B3" }}>Submitted by editors</p>
                        </div>
                        <button
                          onClick={() => setActiveTab("articles")}
                          className="flex items-center gap-1 text-xs font-medium hover:underline flex-shrink-0"
                          style={{ color: "#0263E0" }}
                        >
                          View <ArrowUpRight size={12} />
                        </button>
                      </div>
                    )}

                    {staleArticles.length === 0 && pendingReview.length === 0 && (
                      <div className="flex items-center gap-3 py-3 first:pt-0">
                        <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, background: "#E6F7F1" }}>
                          <CheckCircle2 size={15} style={{ color: "#00A368" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: "#121C2D" }}>All critical articles current</p>
                          <p className="text-xs" style={{ color: "#9EA6B3" }}>No pending reviews, nothing overdue</p>
                        </div>
                      </div>
                    )}

                    {(staleArticles.length > 0 || pendingReview.length > 0) && (
                      <div className="flex items-center gap-3 py-3">
                        <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, background: "#F4F4F6" }}>
                          <Clock size={15} style={{ color: "#9EA6B3" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: "#121C2D" }}>{draftCount} draft{draftCount === 1 ? "" : "s"} in progress</p>
                          <p className="text-xs" style={{ color: "#9EA6B3" }}>Not yet submitted by editors</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "articles" && (
            <div>
              {/* Pending review queue */}
              {pendingReview.length > 0 && (
                <div className="mb-5 bg-white rounded-lg border p-4" style={{ borderColor: "#FEF9E7", background: "#FFFDF5" }}>
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#C9A000" }}>
                    <AlertTriangle size={14} /> {pendingReview.length} article{pendingReview.length === 1 ? "" : "s"} awaiting your review
                  </p>
                  <div className="space-y-2">
                    {pendingReview.map((a) => (
                      <div key={a.id} className="flex items-center justify-between gap-3 bg-white rounded-md border px-4 py-2.5" style={{ borderColor: "#E1E3EA" }}>
                        <button onClick={() => navigate(`/app/knowledge-base/${a.slug ?? a.id}`)} className="text-sm font-medium hover:underline text-left flex-1 truncate" style={{ color: "#121C2D" }}>
                          {a.title}
                        </button>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handlePublish(a)}
                            disabled={busyId === a.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-opacity disabled:opacity-50"
                            style={{ background: "#00A368", color: "white" }}
                          >
                            {busyId === a.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Publish
                          </button>
                          <button
                            onClick={() => handleReject(a)}
                            disabled={busyId === a.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border disabled:opacity-50"
                            style={{ borderColor: "#E1E3EA", color: "#696E7A" }}
                          >
                            <XCircle size={12} /> Send back
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative max-w-sm mb-5">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9EA6B3" }} />
                <input
                  type="text"
                  placeholder="Search articles…"
                  value={articleSearch}
                  onChange={(e) => setArticleSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-md border outline-none"
                  style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                />
              </div>

              <div className="bg-white rounded-lg border overflow-hidden overflow-x-auto" style={{ borderColor: "#E1E3EA" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "#FAFAFA" }}>
                      {["Title", "Category", "Author", "Status", "Views", "Rating", ""].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: "#9EA6B3" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArticles.map((a) => (
                      <tr key={a.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F4F4F6" }}>
                        <td className="px-5 py-3.5">
                          <button onClick={() => navigate(`/app/knowledge-base/${a.slug ?? a.id}`)} className="text-sm font-medium text-left hover:underline" style={{ color: "#121C2D" }}>
                            {a.title}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#696E7A" }}>
                          {categoryMap[a.category]?.name || a.category || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#696E7A" }}>
                          {a.author_username || userMap[a.author]?.name || a.author || "Unknown"}
                        </td>
                        <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                        <td className="px-5 py-3.5 text-xs tabular-nums" style={{ color: "#696E7A" }}>{(a.views ?? 0).toLocaleString()}</td>
                        <td className="px-5 py-3.5">
                          {a.ratingCount > 0 ? (
                            <span className="flex items-center gap-1 text-xs whitespace-nowrap"><Star size={11} style={{ color: "#F7C948" }} /> {a.rating.toFixed(1)}</span>
                          ) : <span className="text-xs" style={{ color: "#D1D5DB" }}>—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <button onClick={() => navigate(`/app/articles/${a.id}/edit`)} className="p-1 rounded hover:bg-gray-100 transition-colors" title="Edit">
                              <FileText size={13} style={{ color: "#696E7A" }} />
                            </button>
                            <button onClick={() => handleDeleteArticle(a)} disabled={busyId === a.id} className="p-1 rounded hover:bg-red-50 transition-colors" title="Archive">
                              <Trash2 size={13} style={{ color: "#9EA6B3" }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div>
              <div className="relative max-w-sm mb-5">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9EA6B3" }} />
                <input
                  type="text"
                  placeholder="Search users…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-md border outline-none"
                  style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {Object.entries(ROLE_LABELS).map(([role, label]) => {
                  const cfg = roleColors[role];
                  const count = users.filter((u) => u.role === role).length;
                  return (
                    <div key={role} className="bg-white rounded-lg border p-4" style={{ borderColor: "#E1E3EA" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{label}</span>
                        <Shield size={13} style={{ color: "#D1D5DB" }} />
                      </div>
                      <p className="text-xl font-semibold" style={{ color: "#121C2D" }}>{count}</p>
                      <p className="text-xs" style={{ color: "#9EA6B3" }}>user{count !== 1 ? "s" : ""}</p>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white rounded-lg border overflow-hidden overflow-x-auto" style={{ borderColor: "#E1E3EA" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "#FAFAFA" }}>
                      {["User", "Email", "Role", "Department", "Last Active", ""].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: "#9EA6B3" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F4F4F6" }}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
                              style={{ width: 30, height: 30, background: "#F22F46", color: "white" }}
                            >
                              {u.avatar ?? u.name?.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium whitespace-nowrap" style={{ color: "#121C2D" }}>
                              {u.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#696E7A" }}>
                          {u.email}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
                            style={{ background: roleColors[u.role]?.bg || "#F4F4F6", color: roleColors[u.role]?.color || "#696E7A" }}
                          >
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#696E7A" }}>
                          {u.department || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#9EA6B3" }}>
                          {u.lastActive || "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/app/users/${u.id}`)}
                              className="p-1.5 rounded hover:bg-blue-50 transition-colors"
                              title="View details"
                              style={{ color: "#0263E0" }}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={busyId === u.id}
                              className="p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40"
                              title="Remove access"
                              style={{ color: "#9EA6B3" }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "categories" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold" style={{ color: "#121C2D" }}>
                  Manage Categories
                </h2>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ background: "#F22F46", color: "white" }}
                >
                  <Plus size={15} /> New Category
                </button>
              </div>

              <div className="bg-white rounded-lg border overflow-hidden overflow-x-auto" style={{ borderColor: "#E1E3EA" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "#FAFAFA" }}>
                      {["Name", "Slug", "Parent", "Articles", "Actions"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: "#9EA6B3" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F4F4F6" }}>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-medium" style={{ color: "#121C2D" }}>{c.name}</span>
                        </td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: "#696E7A" }}>{c.slug}</td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: "#696E7A" }}>
                          {c.parent_name || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: "#696E7A" }}>
                          {c.article_count || 0}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/app/admin/categories/${c.id}/edit`)}
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                              title="Edit"
                            >
                              <FileText size={13} style={{ color: "#696E7A" }} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c)}
                              className="p-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={13} style={{ color: "#9EA6B3" }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Category Modal (unchanged) */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "#121C2D" }}>Add New Category</h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 rounded hover:bg-gray-100 transition-colors">
                <X size={18} style={{ color: "#696E7A" }} />
              </button>
            </div>
            {categoryFormError && (
              <div className="mb-3 text-xs text-red-600 flex items-center gap-1">
                <XCircle size={14} /> {categoryFormError}
              </div>
            )}
            <form onSubmit={handleCategorySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#696E7A" }}>Name *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                  style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#696E7A" }}>Slug</label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                  style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#696E7A" }}>Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-md border outline-none resize-none"
                  style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#696E7A" }}>Parent Category</label>
                <select
                  value={categoryForm.parent}
                  onChange={(e) => setCategoryForm({ ...categoryForm, parent: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                  style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                >
                  <option value="">None (Root)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#696E7A" }}>Sort Order</label>
                <input
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                  style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#696E7A" }}>Icon (emoji or name)</label>
                <input
                  type="text"
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  placeholder="e.g. rocket, user, settings"
                  className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                  style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 rounded-md text-sm font-medium border" style={{ borderColor: "#E1E3EA", color: "#696E7A" }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: "#F22F46" }}
                >
                  {submittingCategory ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}