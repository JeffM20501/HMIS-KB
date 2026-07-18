import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listCategories } from "../../api/categories.js";
import { listArticles, searchArticles } from "../../api/articles.js";
import useDebounce from "../../hooks/useDebounce.js";
import useAuth from "../../hooks/useAuth.js";
import { useLookupMaps } from "../../hooks/useLookupMaps.js";
import { ROLES } from "../../utils/constants.js";
import { CATEGORY_CONFIG } from "../../utils/categoryConfig.js";
import { filterArticlesByRole } from "./utils.js";
import KBHeader from "./components/KBHeader.jsx";
import KBSearchBar from "./components/KBSearchBar.jsx";
import KBFilterPanel from "./components/KBFilterPanel.jsx";
import KBFilterChips from "./components/KBFilterChips.jsx";
import KBCategoryGrid from "./components/KBCategoryGrid.jsx";
import KBArticleGrid from "./components/KBArticleGrid.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import Spinner from "../../components/common/Spinner.jsx";

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
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { tagMap, loading: mapsLoading } = useLookupMaps();

  // Load categories
  useEffect(() => {
    listCategories()
      .then((data) => setCategories(data.results ?? data ?? []))
      .catch(() => setCategories([]));
  }, []);

  // Fetch articles and apply filters
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

        let visible = filterArticlesByRole(articles, user);

        if (activeCategory) {
          visible = visible.filter(a => String(a.category) === activeCategory);
        }
        if (activeType) {
          visible = visible.filter(a => a.type === activeType);
        }
        if (activeStatus) {
          visible = visible.filter(a => a.status === activeStatus);
        }

        setFilteredArticles(visible);
        setTotal(visible.length);
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
  const isLoading = loading || mapsLoading;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <KBHeader />

      <KBSearchBar
        query={query}
        setQuery={setQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />

      <KBFilterPanel
        showFilters={showFilters}
        categories={categories}
        activeCategory={activeCategory}
        activeType={activeType}
        activeStatus={activeStatus}
        showStatusFilter={showStatusFilter}
        setFilter={setFilter}
      />

      <KBFilterChips
        hasActiveFilters={hasActiveFilters}
        activeCategoryObj={activeCategoryObj}
        activeType={activeType}
        activeStatus={activeStatus}
        showStatusFilter={showStatusFilter}
        setFilter={setFilter}
        clearFilters={clearFilters}
      />

      <ErrorBanner message={error} />

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner label="Searching…" /></div>
      ) : (
        <>
          <KBCategoryGrid
            categories={categories}
            filteredArticles={filteredArticles}
            hasActiveFilters={hasActiveFilters}
            setFilter={setFilter}
          />

          <KBArticleGrid
            articles={filteredArticles}
            total={total}
            query={query}
            categories={categories}
            tagMap={tagMap}
          />
        </>
      )}
    </div>
  );
}