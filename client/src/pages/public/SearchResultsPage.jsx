import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SearchX, LifeBuoy } from 'lucide-react';
import * as articlesApi from '../../api/articles.api';
import * as categoriesApi from '../../api/categories.api';
import * as analyticsApi from '../../api/analytics.api';
import ArticleCard from '../../components/article/ArticleCard.jsx';
import SearchInput from '../../components/ui/SearchInput.jsx';
import Select from '../../components/ui/Select.jsx';
import Button from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { useDebounce } from '../../hooks/useDebounce';

const CONTENT_TYPES = ['how_to', 'sop', 'faq', 'feature_reference', 'troubleshooting', 'release_notes'];

export default function SearchResultsPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const debouncedQuery = useDebounce(query, 400);
  const [category, setCategory] = useState(params.get('category') || '');
  const [contentType, setContentType] = useState(params.get('type') || '');
  const [sort, setSort] = useState(params.get('sort') || 'relevance');

  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedQuery) next.set('q', debouncedQuery);
    if (category) next.set('category', category);
    if (contentType) next.set('type', contentType);
    if (sort !== 'relevance') next.set('sort', sort);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, category, contentType, sort]);

  const categoriesQuery = useQuery({ queryKey: ['categories', 'root'], queryFn: categoriesApi.getRootCategories });

  const orderingMap = { relevance: '-relevance', recent: '-updated_at', views: '-views' };

  const resultsQuery = useQuery({
    queryKey: ['articles', 'search', debouncedQuery, category, contentType, sort],
    queryFn: () =>
      articlesApi.listArticles({
        search: debouncedQuery || undefined,
        category: category || undefined,
        content_type: contentType || undefined,
        ordering: orderingMap[sort],
        status: 'published',
      }),
    enabled: true,
  });

  // FR-2.6: log every search for analytics
  // useEffect(() => {
  //   if (!debouncedQuery) return;
  //   const t = setTimeout(() => {
  //     analyticsApi
  //       .logSearch({ query: debouncedQuery, result_count: results.length })
  //       .catch(() => {});
  //   }, 600);
  //   return () => clearTimeout(t);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [debouncedQuery, resultsQuery.data]);

  const results = useMemo(() => resultsQuery.data?.results || resultsQuery.data || [], [resultsQuery.data]);
  const categories = categoriesQuery.data?.results || categoriesQuery.data || [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Search results</h1>
      <p className="text-text-secondary mb-6">
        {debouncedQuery ? (
          <>
            {resultsQuery.isLoading ? 'Searching…' : `${results.length} results for `}
            {!resultsQuery.isLoading && <span className="font-medium text-text-primary">"{debouncedQuery}"</span>}
          </>
        ) : (
          'Browse all published documentation'
        )}
      </p>

      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        {/* Filters */}
        <aside className="space-y-6">
          <SearchInput value={query} onChange={setQuery} placeholder="Refine your search…" />

          <div>
            <p className="text-sm font-semibold text-text-primary mb-2">Category</p>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <p className="text-sm font-semibold text-text-primary mb-2">Content type</p>
            <Select value={contentType} onChange={(e) => setContentType(e.target.value)}>
              <option value="">All types</option>
              {CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <p className="text-sm font-semibold text-text-primary mb-2">Sort by</p>
            <Select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="relevance">Relevance</option>
              <option value="recent">Recently updated</option>
              <option value="views">Most viewed</option>
            </Select>
          </div>
        </aside>

        {/* Results */}
        <div>
          {resultsQuery.isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-card" />
              ))}
            </div>
          )}

          {!resultsQuery.isLoading && results.length === 0 && (
            <div className="text-center py-20">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <SearchX className="w-8 h-8 text-text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">No results found</h3>
              <p className="text-text-secondary max-w-sm mx-auto mb-6">
                We couldn't find anything matching your search. Try different keywords, or reach out to support.
              </p>
              <Button variant="outline">
                <LifeBuoy className="w-4 h-4" /> Contact Support
              </Button>
            </div>
          )}

          {!resultsQuery.isLoading && results.length > 0 && (
            <div className="space-y-4">
              {results.map((a) => (
                <ArticleCard key={a.id || a.slug} article={a} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
