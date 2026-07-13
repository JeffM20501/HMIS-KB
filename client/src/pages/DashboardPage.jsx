import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Eye, Star, TrendingUp, PlusCircle, Search, FileText, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { listArticles } from "../api/articles";
import { getDashboardAnalytics } from "../api/analytics";
import StatCard from "../components/common/StatCard.jsx";
import ArticleCard from "../components/articles/ArticleCard.jsx";
import Spinner from "../components/common/Spinner.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import RoleGate from "../components/common/RoleGate.jsx";
import { ROLES } from "../utils/constants";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [topArticles, setTopArticles] = useState([]);
  const [recentArticles, setRecentArticles] = useState([]);
  const [myDrafts, setMyDrafts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const requests = [
      // Only published articles for top & recent
      listArticles({ sort: "views", page_size: 4, status: "published" }),
      listArticles({ sort: "recent", page_size: 6, status: "published" }),
    ];
    if (user?.role === ROLES.ADMIN) requests.push(getDashboardAnalytics());
    // Editors & Admins see their own drafts
    if (user?.role !== ROLES.VIEWER) {
      requests.push(listArticles({ author: user?.id, status: "draft", page_size: 4 }));
    }

    Promise.all(requests)
      .then(([top, recent, analytics, drafts]) => {
        if (cancelled) return;
        setTopArticles(top?.results ?? top ?? []);
        setRecentArticles(recent?.results ?? recent ?? []);
        if (analytics) setStats(analytics);
        if (drafts) setMyDrafts(drafts?.results ?? drafts ?? []);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [user]);

  const firstName = user?.username?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#121C2D" }}>Welcome back, {firstName}</h1>
          <p className="text-sm mt-1" style={{ color: "#696E7A" }}>Here's what's happening in the HMIS Knowledge Base.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => navigate("/app/knowledge-base")} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-gray-50" style={{ borderColor: "#E1E3EA", color: "#243656" }}>
            <Search size={15} /> Browse KB
          </button>
          <RoleGate allow={[ROLES.EDITOR, ROLES.ADMIN]}>
            <button onClick={() => navigate("/app/articles/new")} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90" style={{ background: "#F22F46", color: "white" }}>
              <PlusCircle size={15} /> New article
            </button>
          </RoleGate>
        </div>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner label="Loading your dashboard…" /></div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={BookOpen} label="Published articles" value={stats?.publishedCount ?? 0} color="#0263E0" badge="this month" />
            <StatCard icon={Eye} label="Total views" value={(stats?.totalViews ?? 0).toLocaleString()} color="#00A368" badge="this month" />
            <StatCard icon={Star} label="Avg. rating" value={stats?.avgRating ? stats.avgRating.toFixed(1) : "—"} color="#F7C948" badge="this month" />
            <StatCard icon={TrendingUp} label="Search success rate" value={stats?.searchSuccessRate ? `${stats.searchSuccessRate}%` : "—"} color="#7B2FBE" badge="this month" />
          </div>

          {/* My drafts */}
          <RoleGate allow={[ROLES.EDITOR, ROLES.ADMIN]}>
            {myDrafts.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold" style={{ color: "#121C2D" }}>Your drafts</h2>
                  <Link to="/app/my-drafts" className="text-xs font-medium flex items-center gap-1 hover:underline" style={{ color: "#F22F46" }}>
                    View all <ArrowRight size={12} />
                  </Link>
                </div>
                <div className="bg-white rounded-lg border divide-y" style={{ borderColor: "#E1E3EA" }}>
                  {myDrafts.map((a) => (
                    <button key={a.id} onClick={() => navigate(`/app/articles/${a.id}/edit`)} className="flex items-center gap-3 w-full px-5 py-3.5 text-left hover:bg-gray-50 transition-colors">
                      <FileText size={14} style={{ color: "#9EA6B3", flexShrink: 0 }} />
                      <span className="text-sm flex-1 truncate" style={{ color: "#121C2D" }}>{a.title}</span>
                      <Clock size={11} style={{ color: "#9EA6B3" }} />
                      <span className="text-xs" style={{ color: "#9EA6B3" }}>{a.updated_at ? new Date(a.updated_at).toLocaleDateString() : "—"}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </RoleGate>

          {/* Top articles (published only) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ color: "#121C2D" }}>Most viewed this month</h2>
              <Link to="/app/knowledge-base" className="text-xs font-medium flex items-center gap-1 hover:underline" style={{ color: "#F22F46" }}>
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {topArticles.length === 0 ? (
              <EmptyState icon={BookOpen} title="No articles yet" description="Published articles will appear here once your team starts adding content." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {topArticles.map((a) => <ArticleCard key={a.id} article={a} category={a.category} />)}
              </div>
            )}
          </div>

          {/* Recently updated (published only) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ color: "#121C2D" }}>Recently updated</h2>
            </div>
            {recentArticles.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="You're all caught up" description="No recent updates to show." />
            ) : (
              <div className="bg-white rounded-lg border divide-y" style={{ borderColor: "#E1E3EA" }}>
                {recentArticles.map((a) => (
                  <button key={a.id} onClick={() => navigate(`/app/knowledge-base/${a.slug ?? a.id}`)} className="flex items-center gap-3 w-full px-5 py-3.5 text-left hover:bg-gray-50 transition-colors">
                    <FileText size={14} style={{ color: "#9EA6B3", flexShrink: 0 }} />
                    <span className="text-sm flex-1 truncate" style={{ color: "#121C2D" }}>{a.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "#F4F4F6", color: "#696E7A" }}>
                      {a.categoryName}
                    </span>
                    <span className="text-xs flex-shrink-0" style={{ color: "#9EA6B3" }}>{a.updated_at ? new Date(a.updated_at).toLocaleDateString() : "—"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}