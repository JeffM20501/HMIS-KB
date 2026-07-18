import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen, Eye, Star, TrendingUp, PlusCircle, Search, FileText,
  ArrowRight, Clock, CheckCircle2, AlertCircle, BarChart3,
  BookMarked, Users, Stethoscope, DollarSign, Settings, Shield, Wrench, FileText as FileIcon,
} from "lucide-react";
import useAuth from "../../hooks/useAuth.js";
import { listArticles } from "../../api/articles.js";
import { getPublicStats, listSearchLogs } from "../../api/analytics.js";
import { listCategories } from "../../api/categories.js";
import StatCard from "../../components/common/StatCard.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import RoleGate from "../../components/common/RoleGate.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { ROLES } from "../../utils/constants.js";

// Category icon mapping
const CATEGORY_CONFIG = {
  "Getting Started": { icon: BookMarked, color: "#0263E0", bg: "#E8F0FD" },
  "Patient Management": { icon: Users, color: "#00A368", bg: "#E6F7F1" },
  "Clinical Modules": { icon: Stethoscope, color: "#E87722", bg: "#FEF3E7" },
  "Billing & Finance": { icon: DollarSign, color: "#7B2FBE", bg: "#F0E6F7" },
  "System Administration": { icon: Settings, color: "#F22F46", bg: "#FDEEF0" },
  "Compliance & Security": { icon: Shield, color: "#243656", bg: "#E8E8EC" },
  "Troubleshooting": { icon: Wrench, color: "#C21B2E", bg: "#FDEEF0" },
  "Release Notes": { icon: FileIcon, color: "#696E7A", bg: "#F4F4F6" },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    publishedCount: 0,
    draftsCount: 0,
    inReviewCount: 0,
    needsReviewCount: 0,
    avgRating: 0,
    searchSuccessRate: 0,
  });
  const [topArticles, setTopArticles] = useState([]);
  const [recentArticles, setRecentArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topSearches, setTopSearches] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [articlesView, setArticlesView] = useState("views");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const fetchData = async () => {
      try {
        const [publicStats, articlesRes, searchLogsRes, categoriesRes] = await Promise.all([
          getPublicStats().catch(() => null),
          listArticles({ page_size: 200 }),
          listSearchLogs({ page_size: 200 }).catch(() => ({ results: [] })),
          listCategories().catch(() => []),
        ]);

        if (cancelled) return;

        const categoriesData = categoriesRes?.results ?? categoriesRes ?? [];
        const catMap = {};
        categoriesData.forEach(c => { catMap[c.id] = c.name; });
        setCategoryMap(catMap);

        const articles = articlesRes?.results ?? articlesRes ?? [];
        const published = articles.filter(a => a.status === 'published');
        const drafts = articles.filter(a => a.status === 'draft');
        const inReview = articles.filter(a => a.status === 'pending_review');

        const now = new Date();
        const needsReview = published.filter(a => {
          const updated = new Date(a.updated_at);
          const diffDays = (now - updated) / (1000 * 60 * 60 * 24);
          return diffDays > 180;
        });

        const sortedByViews = [...published].sort((a, b) => (b.views || 0) - (a.views || 0));
        const sortedByRecent = [...published].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        setTopArticles(sortedByViews.slice(0, 10));
        setRecentArticles(sortedByRecent.slice(0, 10));

        const searchLogs = searchLogsRes?.results ?? searchLogsRes ?? [];
        const searchMap = {};
        searchLogs.forEach(log => {
          const term = log.query || log.search_term || '';
          if (term) {
            searchMap[term] = (searchMap[term] || 0) + 1;
          }
        });
        const sortedSearches = Object.entries(searchMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([term, count], index) => ({ term, count, rank: index + 1 }));
        setTopSearches(sortedSearches);

        let publishedCount = published.length;
        let avgRating = 0;
        let searchSuccessRate = 0;

        if (publicStats) {
          publishedCount = publicStats.total_articles ?? published.length;
          avgRating = publicStats.avg_rating ?? 0;
          searchSuccessRate = publicStats.search_success_rate ?? 0;
        } else {
          const ratings = published.filter(a => a.rating > 0);
          if (ratings.length) {
            avgRating = ratings.reduce((sum, a) => sum + (a.rating || 0), 0) / ratings.length;
          }
        }

        const enrichedCategories = categoriesData.map(cat => {
          const count = published.filter(a => a.category === cat.id).length;
          return { ...cat, article_count: count };
        });
        setCategories(enrichedCategories);

        setStats({
          publishedCount,
          draftsCount: drafts.length,
          inReviewCount: inReview.length,
          needsReviewCount: needsReview.length,
          avgRating,
          searchSuccessRate,
        });

      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => { cancelled = true; };
  }, []);

  const firstName = user?.username?.split(" ")[0] ?? "there";
  const isAdmin = user?.role === ROLES.ADMIN;

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const displayArticles = articlesView === "views" ? topArticles : recentArticles;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#121C2D" }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "#696E7A" }}>
            Overview of your knowledge base — articles, activity, and content health
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate("/app/knowledge-base")}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E1E3EA", color: "#243656" }}
          >
            <Search size={15} /> Browse KB
          </button>
          <RoleGate allow={[ROLES.EDITOR, ROLES.ADMIN]}>
            <button
              onClick={() => navigate("/app/articles/new")}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: "#F22F46", color: "white" }}
            >
              <PlusCircle size={15} /> New article
            </button>
          </RoleGate>
        </div>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner label="Loading dashboard…" /></div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={BookOpen}
              label="Published Articles"
              value={stats.publishedCount}
              color="#0263E0"
              badge={`${stats.draftsCount} drafts · ${stats.inReviewCount} in review`}
            />
            <StatCard
              icon={TrendingUp}
              label="Search Success Rate"
              value={stats.searchSuccessRate ? `${stats.searchSuccessRate}%` : "—"}
              color="#7B2FBE"
              badge="Of all searches"
            />
            <StatCard
              icon={Star}
              label="Avg Rating"
              value={stats.avgRating ? `${stats.avgRating.toFixed(1)}/5` : "—"}
              color="#F7C948"
              badge="Across all published articles"
            />
            {isAdmin ? (
              <StatCard
                icon={AlertCircle}
                label="Needs Review"
                value={stats.needsReviewCount}
                color="#E87722"
                badge="Not reviewed in 180+ days"
              />
            ) : (
              <div className="hidden lg:block" />
            )}
          </div>

          {/* Articles Section with right sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            {/* Left: Articles Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold" style={{ color: "#121C2D" }}>Articles</h2>
                <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
                  <button
                    onClick={() => setArticlesView("views")}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      articlesView === "views" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                    }`}
                    style={{ color: articlesView === "views" ? "#121C2D" : "#696E7A" }}
                  >
                    Most Viewed
                  </button>
                  <button
                    onClick={() => setArticlesView("recent")}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      articlesView === "recent" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                    }`}
                    style={{ color: articlesView === "recent" ? "#121C2D" : "#696E7A" }}
                  >
                    Recent
                  </button>
                </div>
              </div>
              {displayArticles.length === 0 ? (
                <EmptyState icon={FileText} title="No articles yet" description="Published articles will appear here." />
              ) : (
                <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: "#E1E3EA" }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead style={{ background: "#F9FAFB", color: "#696E7A" }}>
                        <tr>
                          <th className="px-5 py-3 text-left font-medium">Article</th>
                          <th className="px-5 py-3 text-left font-medium">Category</th>
                          <th className="px-5 py-3 text-left font-medium">Status</th>
                          <th className="px-5 py-3 text-left font-medium">Views</th>
                          <th className="px-5 py-3 text-left font-medium">Updated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: "#E8E8EC" }}>
                        {displayArticles.map((a) => (
                          <tr
                            key={a.id}
                            onClick={() => navigate(`/app/knowledge-base/${a.slug}`)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="px-5 py-3.5 font-medium" style={{ color: "#121C2D" }}>{a.title}</td>
                            <td className="px-5 py-3.5" style={{ color: "#696E7A" }}>
                              {categoryMap[a.category] || "Uncategorized"}
                            </td>
                            <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                            <td className="px-5 py-3.5" style={{ color: "#696E7A" }}>{a.views || 0}</td>
                            <td className="px-5 py-3.5" style={{ color: "#696E7A" }}>{formatDate(a.updated_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar: Categories + Top Searches */}
            <div className="space-y-6">
              {/* Categories */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold" style={{ color: "#121C2D" }}>Categories</h2>
                  <Link to="/app/knowledge-base" className="text-xs font-medium hover:underline" style={{ color: "#F22F46" }}>
                    Browse all
                  </Link>
                </div>
                {categories.length === 0 ? (
                  <EmptyState icon={BookMarked} title="No categories" description="Categories will appear here." />
                ) : (
                  <div className="bg-white rounded-lg border divide-y" style={{ borderColor: "#E1E3EA" }}>
                    {categories.slice(0, 6).map((cat) => {
                      const config = CATEGORY_CONFIG[cat.name];
                      const Icon = config?.icon || BookMarked;
                      const color = config?.color || "#696E7A";
                      const bg = config?.bg || "#F4F4F6";
                      const count = cat.article_count || 0;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => navigate(`/app/knowledge-base?category=${cat.id}`)}
                          className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex items-center justify-center rounded-full"
                              style={{ width: 28, height: 28, background: bg }}
                            >
                              <Icon size={14} style={{ color }} />
                            </div>
                            <span className="text-sm" style={{ color: "#121C2D" }}>{cat.name}</span>
                          </div>
                          <span className="text-sm font-medium" style={{ color: "#696E7A" }}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top Searches */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold" style={{ color: "#121C2D" }}>Top Searches</h2>
                </div>
                {topSearches.length === 0 ? (
                  <EmptyState icon={Search} title="No searches yet" description="Search terms will appear here." />
                ) : (
                  <div className="bg-white rounded-lg border divide-y" style={{ borderColor: "#E1E3EA" }}>
                    {topSearches.map((item) => (
                      <div key={item.term} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium" style={{ color: "#9EA6B3", width: 20 }}>
                            {String(item.rank).padStart(2, '0')}
                          </span>
                          <span className="text-sm" style={{ color: "#121C2D" }}>{item.term}</span>
                        </div>
                        <span className="text-sm font-medium" style={{ color: "#696E7A" }}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}