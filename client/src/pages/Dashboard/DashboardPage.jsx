// src/pages/Dashboard/DashboardPage.jsx
import { useEffect, useState } from "react";
import { listArticles } from "../../api/articles.js";
import { getPublicStats, listSearchLogs } from "../../api/analytics.js";
import { listCategories } from "../../api/categories.js";
import Spinner from "../../components/common/Spinner.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import useAuth from "../../hooks/useAuth.js";
import { ROLES } from "../../utils/constants.js";
import DashboardHeader from "./components/DashboardHeader.jsx";
import DashboardStats from "./components/DashboardStats.jsx";
import DashboardArticles from "./components/DashboardArticles.jsx";
import DashboardSidebar from "./components/DashboardSidebar.jsx";

export default function DashboardPage() {
  const { user } = useAuth();
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

  const isAdmin = user?.role === ROLES.ADMIN;

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner label="Loading dashboard…" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <DashboardHeader />
      <ErrorBanner message={error} />

      <DashboardStats stats={stats} isAdmin={isAdmin} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <DashboardArticles
          articles={articlesView === "views" ? topArticles : recentArticles}
          viewMode={articlesView}
          setViewMode={setArticlesView}
          categoryMap={categoryMap}
        />
        <DashboardSidebar
          categories={categories}
          topSearches={topSearches}
        />
      </div>
    </div>
  );
}