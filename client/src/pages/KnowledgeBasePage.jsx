import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, SlidersHorizontal, PlusCircle, X, LifeBuoy, BookOpen,
  Rocket, User, Stethoscope, DollarSign, Settings, Shield, Wrench, FileText,
} from "lucide-react";
import { listCategories } from "../api/categories";
import { listArticles, searchArticles } from "../api/articles";
import useDebounce from "../hooks/useDebounce";
import useAuth from "../hooks/useAuth";
import ArticleCard from "../components/articles/ArticleCard.jsx";
import Spinner from "../components/common/Spinner.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import RoleGate from "../components/common/RoleGate.jsx";
import { ARTICLE_TYPE_LABELS, ROLES } from "../utils/constants";
import { useLookupMaps } from "../hooks/useLookupMaps";

const CATEGORY_CONFIG = {
  "Getting Started": { icon: Rocket, color: "#0263E0", bg: "#E8F0FD" },
  "Patient Management": { icon: User, color: "#00A368", bg: "#E6F7F1" },
  "Clinical Modules": { icon: Stethoscope, color: "#E87722", bg: "#FEF3E7" },
  "Billing & Finance": { icon: DollarSign, color: "#7B2FBE", bg: "#F0E6F7" },
  "System Administration": { icon: Settings, color: "#F22F46", bg: "#FDEEF0" },
  "Compliance & Security": { icon: Shield, color: "#243656", bg: "#E8E8EC" },
  "Troubleshooting": { icon: Wrench, color: "#C21B2E", bg: "#FDEEF0" },
  "Release Notes": { icon: FileText, color: "#696E7A", bg: "#F4F4F6" },
};

// Helper: filter articles based on user role
function filterArticlesByRole(articles, user) {
  if (!user) return articles.filter(a => a.status === 'published');
  const role = user.role;
  if (role === ROLES.VIEWER) return articles.filter(a => a.status === 'published');
  if (role === ROLES.EDITOR) {
    return articles.filter(a => 
      a.status === 'published' ||
      (a.status === 'draft' && a.author === user.id)
    );
  }
  if (role === ROLES.ADMIN) {
    return articles.filter(a => 
      a.status === 'published' || a.status === 'pending_review'
    );
  }
  return articles.filter(a => a.status === 'published');
}

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialQuery = searchParams.get("q") ?? "";
  const activeCategory = searchParams.get("category") ?? "";
  const activeType = searchParams.get("type") ?? "";
  const activeStatus = searchParams.get("status") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 350);

  const [categories, setCategories] = useState([]);
  const [allArticles, setAllArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Use the lookup maps hook for tagMap
  const { tagMap, loading: mapsLoading } = useLookupMaps();

  // Load categories (we still need them for the category names)
  useEffect(() => {
    listCategories()
      .then((data) => setCategories(data.results ?? data ?? []))
      .catch(() => setCategories([]));
  }, []);

  // Fetch articles and apply ALL filters client‑side
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const params = {
      category: activeCategory || undefined,
      type: activeType || undefined,
      page_size: 200,
    };

    const request = debouncedQuery.trim()
      ? searchArticles(debouncedQuery.trim(), params)
      : listArticles(params);

    request
      .then((data) => {
        if (cancelled) return;
        const articles = data.results ?? data ?? [];

        // 1. Role‑based filtering
        let visible = filterArticlesByRole(articles, user);

        // 2. Category filter (client‑side)
        if (activeCategory) {
          visible = visible.filter(a => String(a.category) === activeCategory);
        }

        // 3. Type filter (client‑side)
        if (activeType) {
          visible = visible.filter(a => a.type === activeType);
        }

        // 4. Status filter (client‑side)
        if (activeStatus) {
          visible = visible.filter(a => a.status === activeStatus);
        }

        setFilteredArticles(visible);
        setTotal(visible.length);
        setAllArticles(articles);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [debouncedQuery, activeCategory, activeType, activeStatus, user]);

  // URL sync
  const updateUrlParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const currentQuery = searchParams.get("q") ?? "";
    if (debouncedQuery.trim() !== currentQuery) {
      updateUrlParams({ q: debouncedQuery.trim() || undefined });
    }
    // eslint-disable-next-line
  }, [debouncedQuery]);

  const setFilter = (key, value) => {
    updateUrlParams({ [key]: value || undefined });
  };

  const clearFilters = () => {
    setQuery("");
    setSearchParams({});
  };

  const activeCategoryObj = useMemo(
    () => categories.find((c) => String(c.id) === activeCategory || c.slug === activeCategory),
    [categories, activeCategory]
  );

  const hasActiveFilters = activeCategory || activeType || activeStatus || query;
  const showStatusFilter = user?.role === ROLES.ADMIN;

  // Combine loading states
  const isLoading = loading || mapsLoading;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#121C2D" }}>Knowledge Base</h1>
          <p className="text-sm mt-1" style={{ color: "#696E7A" }}>
            SOPs, how-to guides, troubleshooting articles, and release notes for HMIS and healthcare products.
          </p>
        </div>
        <RoleGate allow={[ROLES.EDITOR, ROLES.ADMIN]}>
          <button
            onClick={() => navigate("/app/articles/new")}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium flex-shrink-0 transition-opacity hover:opacity-90"
            style={{ background: "#F22F46", color: "white" }}
          >
            <PlusCircle size={15} /> New article
          </button>
        </RoleGate>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2.5 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#9EA6B3" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, SOPs, troubleshooting guides…"
            className="w-full pl-10 pr-4 py-3 text-sm rounded-lg border outline-none transition-all"
            style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#F22F46")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#E1E3EA")}
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border transition-colors flex-shrink-0"
          style={{
            borderColor: showFilters ? "#F22F46" : "#E1E3EA",
            color: showFilters ? "#F22F46" : "#243656",
            background: showFilters ? "#FDEEF0" : "white",
          }}
        >
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ borderColor: "#E1E3EA" }}>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#696E7A" }}>Category</label>
            <select
              value={activeCategory}
              onChange={(e) => setFilter("category", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border outline-none"
              style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id ?? c.slug} value={c.id ?? c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#696E7A" }}>Content type</label>
            <select
              value={activeType}
              onChange={(e) => setFilter("type", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border outline-none"
              style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            >
              <option value="">All types</option>
              {Object.entries(ARTICLE_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          {showStatusFilter && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#696E7A" }}>Status</label>
              <select
                value={activeStatus}
                onChange={(e) => setFilter("status", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
              >
                <option value="">All (except drafts)</option>
                <option value="published">Published</option>
                <option value="pending_review">Pending Review</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex items-center flex-wrap gap-2 mb-6">
          {activeCategoryObj && (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: "#F4F4F6", color: "#243656" }}>
              {activeCategoryObj.name}
              <button onClick={() => setFilter("category", "")}><X size={11} /></button>
            </span>
          )}
          {activeType && (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: "#F4F4F6", color: "#243656" }}>
              {ARTICLE_TYPE_LABELS[activeType]}
              <button onClick={() => setFilter("type", "")}><X size={11} /></button>
            </span>
          )}
          {activeStatus && showStatusFilter && (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full capitalize" style={{ background: "#F4F4F6", color: "#243656" }}>
              {activeStatus}
              <button onClick={() => setFilter("status", "")}><X size={11} /></button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs font-medium hover:underline" style={{ color: "#F22F46" }}>
            Clear all
          </button>
        </div>
      )}

      <ErrorBanner message={error} />

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner label="Searching…" /></div>
      ) : (
        <>
          {/* Browse by Category – hidden when any filter is active */}
          {categories.length > 0 && !hasActiveFilters && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold mb-4" style={{ color: "#121C2D" }}>Browse by Category</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {categories.slice(0, 8).map((cat) => {
                  const config = CATEGORY_CONFIG[cat.name];
                  const Icon = config?.icon || BookOpen;
                  const color = config?.color || "#696E7A";
                  const bg = config?.bg || "#F4F4F6";
                  const visibleInCat = filteredArticles.filter(a => String(a.category) === String(cat.id));
                  const count = visibleInCat.length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setFilter("category", cat.id)}
                      className="flex flex-col items-center p-4 rounded-lg border hover:border-red-300 transition-colors text-center bg-white"
                      style={{ borderColor: "#E1E3EA" }}
                    >
                      <div
                        className="flex items-center justify-center rounded-full mb-3"
                        style={{ width: 48, height: 48, background: bg }}
                      >
                        <Icon size={24} style={{ color }} strokeWidth={1.8} />
                      </div>
                      <span className="text-sm font-medium" style={{ color: "#121C2D" }}>{cat.name}</span>
                      <span className="text-xs" style={{ color: "#9EA6B3" }}>{count} articles</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Articles grid */}
          {filteredArticles.length === 0 ? (
            <EmptyState
              icon={Search}
              title={query ? `No results for "${query}"` : "No articles found"}
              description="Try a different search term, or browse by category. If you still can't find what you need, escalate to support."
              action={
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium mt-2"
                  style={{ background: "#F22F46", color: "white" }}
                  onClick={() => alert("This would open a support ticket with your search context attached.")}
                >
                  <LifeBuoy size={14} /> Escalate to support
                </button>
              }
            />
          ) : (
            <>
              <p className="text-xs mb-4" style={{ color: "#9EA6B3" }}>
                {filteredArticles.length} article{filteredArticles.length === 1 ? "" : "s"} found
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredArticles.map((a) => (
                  <ArticleCard
                    key={a.id}
                    article={a}
                    category={categories.find((c) => String(c.id) === String(a.category))}
                    tagMap={tagMap}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}