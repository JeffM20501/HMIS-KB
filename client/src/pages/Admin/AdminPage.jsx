// src/pages/Admin/AdminPage.jsx
import { useEffect, useMemo, useState } from "react";
import { BarChart3, FileText, Users, FolderTree } from "lucide-react";
import { listArticles, publishArticle, rejectArticle, deleteArticle } from "../../api/articles";
import { listUsers, deleteUser } from "../../api/users";
import { listCategories, createCategory, deleteCategory } from "../../api/categories";
import { getDashboardAnalytics } from "../../api/analytics";
import Spinner from "../../components/common/Spinner.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import OverviewTab from "./components/OverviewTab.jsx";
import ArticlesTab from "./components/ArticleTab.jsx";

import UsersTab from "./components/UsersTab.jsx";
import CategoriesTab from "./components/./CategoriesTab.jsx";
import CategoryModal from "./components/./CategoryModal.jsx";
import { ROLE_LABELS } from "../../utils/constants";

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "articles", label: "Articles", icon: FileText },
  { key: "users", label: "Users", icon: Users },
  { key: "categories", label: "Categories", icon: FolderTree },
];

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [busyId, setBusyId] = useState(null);

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

  // Lookup maps
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

  // Computed stats
  const pendingReview = articles.filter((a) => a.status === "pending_review");
  const publishedArticles = articles.filter((a) => a.status === "published");
  const nonDraftArticles = articles.filter((a) => a.status !== "draft");
  const draftCount = articles.filter((a) => a.status === "draft").length;
  const totalViews = articles.reduce((sum, a) => sum + (a.views ?? 0), 0);
  const STALE_DAYS = 180;
  const staleArticles = publishedArticles.filter((a) => a.updated_at && new Date(a.updated_at).getTime() < Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);
  const totalNonDraft = nonDraftArticles.length;

  // Shared handlers
  const handlePublish = async (a) => {
    setBusyId(a.id);
    try {
      await publishArticle(a.id);
      setArticles((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: "published" } : x)));
    } catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  };

  const handleReject = async (a) => {
    const note = window.prompt("Note for the editor (optional):", "");
    setBusyId(a.id);
    try {
      await rejectArticle(a.id, note ?? "");
      setArticles((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: "draft" } : x)));
    } catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  };

  const handleDeleteArticle = async (a) => {
    if (!window.confirm(`Archive "${a.title}"?`)) return;
    setBusyId(a.id);
    try {
      await deleteArticle(a.id);
      setArticles((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: "archived" } : x)));
    } catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Remove ${u.name}'s access?`)) return;
    setBusyId(u.id);
    try {
      await deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  };

  const handleDeleteCategory = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    setBusyId(c.id);
    try {
      await deleteCategory(c.id);
      setCategories((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  };

  const handleCategoryCreated = (newCategory) => {
    setCategories((prev) => [...prev, newCategory]);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "#121C2D" }}>Admin Panel</h1>
        <p className="text-sm mt-1" style={{ color: "#696E7A" }}>
          Review submissions, manage users, and monitor knowledge base health.
        </p>
      </div>

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
            <OverviewTab
              articles={articles}
              categories={categories}
              analytics={analytics}
              totalViews={totalViews}
              publishedArticles={publishedArticles}
              pendingReview={pendingReview}
              draftCount={draftCount}
              staleArticles={staleArticles}
              totalNonDraft={totalNonDraft}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === "articles" && (
            <ArticlesTab
              articles={articles}
              pendingReview={pendingReview}
              categoryMap={categoryMap}
              userMap={userMap}
              busyId={busyId}
              onPublish={handlePublish}
              onReject={handleReject}
              onDelete={handleDeleteArticle}
            />
          )}
          {activeTab === "users" && (
            <UsersTab users={users} busyId={busyId} onDeleteUser={handleDeleteUser} />
          )}
          {activeTab === "categories" && (
            <CategoriesTab
              categories={categories}
              busyId={busyId}
              onDeleteCategory={handleDeleteCategory}
              onOpenModal={() => setShowCategoryModal(true)}
            />
          )}
        </>
      )}

      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={categories}
        onSuccess={handleCategoryCreated}
      />
    </div>
  );
}