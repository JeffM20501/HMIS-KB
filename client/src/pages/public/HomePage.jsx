import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowRight } from 'lucide-react';
import * as categoriesApi from '../../api/categories.api';
import * as articlesApi from '../../api/articles.api';
import CategoryCard from '../../components/article/CategoryCard.jsx';
import ArticleCard from '../../components/article/ArticleCard.jsx';
import { Skeleton, SkeletonCard } from '../../components/common/Skeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';

const POPULAR_SEARCHES = ['patient registration', 'NHIF claims', 'login error', 'lab results', 'discharge summary'];

export default function HomePage() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'root'],
    queryFn: categoriesApi.getRootCategories,
  });

  const featuredQuery = useQuery({
    queryKey: ['articles', 'featured'],
    queryFn: () => articlesApi.listArticles({ status: 'published', ordering: '-views', page_size: 4 }),
  });

  const recentQuery = useQuery({
    queryKey: ['articles', 'recent'],
    queryFn: () => articlesApi.listArticles({ status: 'published', ordering: '-updated_at', page_size: 4 }),
  });

  const categories = categoriesQuery.data?.results || categoriesQuery.data || [];
  const featured = featuredQuery.data?.results || featuredQuery.data || [];
  const recent = recentQuery.data?.results || recentQuery.data || [];

  const submitSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight mb-4">
            How can we help you today?
          </h1>
          <p className="text-lg text-text-secondary mb-8">
            Search documentation across the TaifaCare healthcare platform.
          </p>
          <form onSubmit={submitSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="w-5 h-5 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for SOPs, how-tos, troubleshooting guides…"
                className="w-full h-14 pl-12 pr-4 rounded-2xl border border-border shadow-card text-base focus-ring focus:border-primary"
              />
            </div>
          </form>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <span className="text-xs text-text-secondary">Popular:</span>
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)}
                className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-text-secondary hover:bg-primary-50 hover:text-primary transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-14 space-y-16">
        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold text-text-primary">Browse by category</h2>
          </div>
          {categoriesQuery.isLoading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}
          {categoriesQuery.isError && (
            <ErrorState message="Couldn't load categories." onRetry={categoriesQuery.refetch} />
          )}
          {!categoriesQuery.isLoading && !categoriesQuery.isError && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          )}
        </section>

        {/* Featured articles */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold text-text-primary">Featured articles</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {featuredQuery.isLoading &&
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-card" />)}
            {!featuredQuery.isLoading && featured.map((a) => <ArticleCard key={a.id || a.slug} article={a} />)}
          </div>
        </section>

        {/* Recently updated */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold text-text-primary">Recently updated</h2>
            <button
              onClick={() => navigate('/search?sort=recent')}
              className="text-sm font-medium text-primary flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {recentQuery.isLoading &&
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-card" />)}
            {!recentQuery.isLoading && recent.map((a) => <ArticleCard key={a.id || a.slug} article={a} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
