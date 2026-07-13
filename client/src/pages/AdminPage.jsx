import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, FileText, TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  Search, Trash2, Shield, Eye, Star, BarChart3, Loader2,FolderTree,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { listArticles, publishArticle, rejectArticle, deleteArticle } from "../api/articles";
import { listUsers, updateUserRole, updateUserStatus, deleteUser } from "../api/users";
import { listCategories } from "../api/categories";
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

  const loadAll = () => {
    setLoading(true);
    setError("");
    Promise.all([
      getDashboardAnalytics().catch(() => null),
      listCategories().catch(() => []),
      listArticles({ page_size: 100 }).catch(() => []),
      listUsers().catch(() => []),
    ])
      .then(([a, c, art, u]) => {
        setAnalytics(a);
        setCategories(c.results ?? c ?? []);
        setArticles(art.results ?? art ?? []);
        setUsers(u.users ?? u.results ?? u ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const pendingReview = useMemo(() => articles.filter((a) => a.status === "review"), [articles]);

  const filteredArticles = useMemo(
    () => articles.filter((a) => a.title.toLowerCase().includes(articleSearch.toLowerCase())),
    [articles, articleSearch]
  );
  const filteredUsers = useMemo(
    () => users.filter((u) => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())),
    [users, userSearch]
  );

  const categoryStats = useMemo(
    () => categories.map((c) => ({ name: c.name?.split(" ")[0] ?? c.name, articles: c.articleCount ?? 0, color: c.color ?? "#F22F46" })),
    [categories]
  );

  const timeSeries = analytics?.timeSeries ?? [];
  const ratingDist = analytics?.ratingDistribution ?? [];

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

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: FileText, label: "Total articles", value: analytics?.totalArticles ?? articles.length, color: "#0263E0" },
                  { icon: Eye, label: "Total views", value: (analytics?.totalViews ?? 0).toLocaleString(), color: "#00A368" },
                  { icon: AlertTriangle, label: "Pending review", value: pendingReview.length, color: "#E87722" },
                  { icon: Star, label: "Avg. rating", value: analytics?.avgRating ? analytics.avgRating.toFixed(1) : "—", color: "#F7C948" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="bg-white rounded-lg p-5 border" style={{ borderColor: "#E1E3EA" }}>
                      <div className="flex items-center justify-center rounded-md mb-4" style={{ width: 36, height: 36, background: `${s.color}14` }}>
                        <Icon size={17} style={{ color: s.color }} />
                      </div>
                      <div className="text-2xl font-semibold mb-0.5" style={{ color: "#121C2D" }}>{s.value}</div>
                      <div className="text-sm" style={{ color: "#696E7A" }}>{s.label}</div>
                    </div>
                  );
                })}
              </div>

              {timeSeries.length > 0 && (
                <div className="bg-white rounded-lg border p-5" style={{ borderColor: "#E1E3EA" }}>
                  <p className="text-sm font-semibold mb-4" style={{ color: "#121C2D" }}>Searches &amp; views (last 30 days)</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={timeSeries}>
                      <defs>
                        <linearGradient id="views" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F22F46" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#F22F46" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F6" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9EA6B3" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#9EA6B3" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E1E3EA" }} />
                      <Area type="monotone" dataKey="views" stroke="#F22F46" fill="url(#views)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {categoryStats.length > 0 && (
                  <div className="bg-white rounded-lg border p-5" style={{ borderColor: "#E1E3EA" }}>
                    <p className="text-sm font-semibold mb-4" style={{ color: "#121C2D" }}>Articles by category</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={categoryStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F6" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9EA6B3" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#9EA6B3" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E1E3EA" }} />
                        <Bar dataKey="articles" radius={[4, 4, 0, 0]} fill="#0263E0" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {ratingDist.length > 0 && (
                  <div className="bg-white rounded-lg border p-5" style={{ borderColor: "#E1E3EA" }}>
                    <p className="text-sm font-semibold mb-4" style={{ color: "#121C2D" }}>Rating distribution</p>
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
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "articles" && (
            <div>
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
                        <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#696E7A" }}>{a.categoryName}</td>
                        <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#696E7A" }}>{a.author}</td>
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
                {activeTab === "categories" && (
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-sm font-semibold" style={{ color: "#121C2D" }}>
                        Manage Categories
                      </h2>
                      <button
                        onClick={() => {
                          // Open modal or navigate to category creation
                          navigate("/app/admin/categories/new");
                        }}
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
        </>
      )}
    </div>
  );
}