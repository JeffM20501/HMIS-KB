import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, PlusCircle, X, LifeBuoy } from "lucide-react";
import { listCategories } from "../api/categories";
import { listArticles, searchArticles } from "../api/articles";
import useDebounce from "../hooks/useDebounce";
import ArticleCard from "../components/articles/ArticleCard.jsx";
import Spinner from "../components/common/Spinner.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import RoleGate from "../components/common/RoleGate.jsx";
import { ARTICLE_TYPE_LABELS, ROLES } from "../utils/constants";

export default function KnowledgeBasePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debouncedQuery = useDebounce(query, 350);
  const activeCategory = searchParams.get("category") ?? "";
  const activeType = searchParams.get("type") ?? "";
  const activeStatus = searchParams.get("status") ?? "";

  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    listCategories().then((data) => setCategories(data.results ?? data ?? [])).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const params = {
      category: activeCategory || undefined,
      type: activeType || undefined,
      status: activeStatus || undefined,
      page_size: 24,
    };

    const request = debouncedQuery.trim()
      ? searchArticles(debouncedQuery.trim(), params)
      : listArticles(params);

    request
      .then((data) => {
        if (cancelled) return;
        setArticles(data.results ?? data ?? []);
        setTotal(data.count ?? (data.results ?? data ?? []).length);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [debouncedQuery, activeCategory, activeType, activeStatus]);

  // Keep the URL's ?q= in sync so searches are shareable/bookmarkable
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedQuery.trim()) next.set("q", debouncedQuery.trim());
    else next.delete("q");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#121C2D" }}>Knowledge Base</h1>
          <p className="text-sm mt-1" style={{ color: "#696E7A" }}>
            Search SOPs, how-to guides, troubleshooting, and release notes across all products.
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

      {/* Search bar */}
      <div className="flex gap-2.5 mb-4">
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
        <div className="bg-white rounded-lg border p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ borderColor: "#E1E3EA" }}>
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
          <RoleGate allow={[ROLES.EDITOR, ROLES.ADMIN]} fallback={<div />}>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#696E7A" }}>Status</label>
              <select
                value={activeStatus}
                onChange={(e) => setFilter("status", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
              >
                <option value="">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="review">In Review</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </RoleGate>
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex items-center flex-wrap gap-2 mb-4">
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
          {activeStatus && (
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

      {loading ? (
        <div className="flex justify-center py-20"><Spinner label="Searching…" /></div>
      ) : articles.length === 0 ? (
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
            {total.toLocaleString()} article{total === 1 ? "" : "s"} found
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} category={categories.find((c) => c.id === (a.category?.id ?? a.category))} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}