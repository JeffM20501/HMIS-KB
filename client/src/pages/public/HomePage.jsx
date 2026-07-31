import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowRight, ChevronRight, BookOpen, FolderOpen, TrendingUp, Star, ThumbsUp, MessageCircle, Mail, Phone } from 'lucide-react';
import * as categoriesApi from '../../api/categories.api';
import * as articlesApi from '../../api/articles.api';
import { Skeleton, SkeletonCard } from '../../components/common/Skeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { formatDate, formatNumber } from '../../utils/formatters';
import { Link } from 'react-router-dom';

const POPULAR_SEARCHES = ['patient registration', 'NHIF claims', 'login error', 'lab results', 'discharge summary'];

export default function HomePage() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Supports the header's "Categories" / "Contact" nav links, which
  // anchor-scroll here rather than pointing at separate pages that don't
  // exist yet (see PublicHeader.jsx).
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  const statsQuery = useQuery({ queryKey: ['stats', 'public'], queryFn: articlesApi.getPublicStats });

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'root'],
    queryFn: categoriesApi.getRootCategories,
  });

  const popularQuery = useQuery({
    queryKey: ['articles', 'popular'],
    queryFn: () => articlesApi.listArticles({ status: 'published', ordering: '-views', page_size: 6 }),
  });

  const recentQuery = useQuery({
    queryKey: ['articles', 'recent'],
    queryFn: () => articlesApi.listArticles({ status: 'published', ordering: '-updated_at', page_size: 4 }),
  });

  const categories = categoriesQuery.data?.results || categoriesQuery.data || [];
  const popular = popularQuery.data?.results || popularQuery.data || [];
  const recent = recentQuery.data?.results || recentQuery.data || [];
  const stats = statsQuery.data || {};

  const submitSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const STATS = [
    { icon: BookOpen, value: stats.total_articles ?? stats.article_count, label: 'Articles' },
    { icon: FolderOpen, value: stats.total_categories ?? categories.length, label: 'Categories' },
    { icon: TrendingUp, value: stats.monthly_views, label: 'Monthly Views' },
    { icon: Star, value: stats.avg_rating, label: 'Avg. Rating' },
  ];

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #3B82F6 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-6 py-20 text-center relative">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            How can we help you today?
          </h1>
          <p className="text-lg text-white/75 mb-8">Search documentation across the TaifaCare HMIS platform</p>

          <form onSubmit={submitSearch} className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 bg-white rounded-2xl shadow-xl p-1.5">
              <Search className="w-5 h-5 text-text-secondary ml-3 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for articles, SOPs, guides…"
                className="flex-1 h-11 px-2 text-base outline-none bg-transparent text-text-primary placeholder:text-text-secondary/70"
              />
              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <span className="text-xs text-white/60">Popular:</span>
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)}
                className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-white/85 hover:bg-white/20 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-gray-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {STATS.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <s.icon className="w-4 h-4 text-text-secondary" />
              {statsQuery.isLoading ? (
                <Skeleton className="h-4 w-10" />
              ) : (
                <span className="text-sm font-bold text-text-primary">{formatNumber(s.value) || '—'}</span>
              )}
              <span className="text-sm text-text-secondary">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-14 space-y-16">
        {/* Categories */}
        <section id="categories" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-text-primary">Browse by category</h2>
          <p className="text-text-secondary mt-1 mb-6">Find documentation organized by HMIS module</p>

          {categoriesQuery.isLoading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}
          {categoriesQuery.isError && <ErrorState message="Couldn't load categories." onRetry={categoriesQuery.refetch} />}
          {!categoriesQuery.isLoading && !categoriesQuery.isError && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat.icon || cat.slug);
                const color = cat.color || '#2563EB';
                return (
                  <div key={cat.id} className="bg-white border border-border rounded-card p-5 flex flex-col">
                    <span
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${color}1A`, color }}
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                    <h3 className="font-semibold text-text-primary mb-1">{cat.name}</h3>
                    <p className="text-sm text-text-secondary line-clamp-2 mb-3">{cat.description}</p>

                    {!!cat.top_articles?.length && (
                      <ul className="space-y-1.5 mb-3 flex-1">
                        {cat.top_articles.slice(0, 2).map((a) => (
                          <li key={a.slug}>
                            <Link
                              to={`/articles/${a.slug}`}
                              className="flex items-start gap-1 text-xs text-text-secondary hover:text-primary"
                            >
                              <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
                              <span className="line-clamp-1">{a.title}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex items-center justify-between pt-3 mt-auto border-t border-border">
                      <span className="text-xs text-text-secondary">{cat.article_count ?? 0} articles</span>
                      <Link
                        to={`/categories/${cat.slug}`}
                        className="text-xs font-medium flex items-center gap-1 hover:underline"
                        style={{ color }}
                      >
                        View all <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Most popular articles */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Most popular articles</h2>
              <p className="text-text-secondary mt-1">Most read by healthcare staff this month</p>
            </div>
            <Link to="/search?sort=views" className="text-sm font-medium text-primary flex items-center gap-1 hover:underline shrink-0">
              Browse all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {popularQuery.isLoading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-card" />
              ))}
            </div>
          )}
          {!popularQuery.isLoading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popular.map((a, i) => (
                <Link
                  key={a.id || a.slug}
                  to={`/articles/${a.slug}`}
                  className="flex gap-4 bg-white border border-border rounded-card p-4 hover:border-primary transition-colors"
                >
                  <span className="text-2xl font-bold text-gray-200 leading-none shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary text-sm leading-snug mb-2 line-clamp-2">{a.title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.category && (
                        <span className="text-xs px-2 py-0.5 rounded bg-primary-50 text-primary">
                          {a.category.name || a.category}
                        </span>
                      )}
                      <span className="text-xs text-text-secondary">{formatNumber(a.views)} views</span>
                      <span className="text-xs text-text-secondary">{a.reading_time || 5}m</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recently updated */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-6">Recently updated</h2>
          {recentQuery.isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-card" />
              ))}
            </div>
          )}
          {!recentQuery.isLoading && (
            <div className="bg-white border border-border rounded-card divide-y divide-border overflow-hidden">
              {recent.map((a) => (
                <Link
                  key={a.id || a.slug}
                  to={`/articles/${a.slug}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary text-sm truncate">{a.title}</p>
                    <p className="text-xs text-text-secondary">
                      {a.category?.name || a.category} · v{a.product_version || '1.0'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-xs text-text-secondary">
                    {a.rating && (
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" /> {a.rating}
                      </span>
                    )}
                    <span>{formatDate(a.updated_at)}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Contact strip */}
      <section id="contact" className="bg-gray-50 border-y border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 py-14 grid sm:grid-cols-3 gap-5">
          <div className="bg-white border border-border rounded-card p-5">
            <span className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center mb-3">
              <MessageCircle className="w-5 h-5" />
            </span>
            <h3 className="font-semibold text-text-primary mb-1">Ask the AI Assistant</h3>
            <p className="text-sm text-text-secondary mb-3">
              Get instant answers from our AI-powered knowledge assistant, trained on TaifaCare documentation.
            </p>
            <span className="text-sm font-medium text-primary">Start chatting →</span>
          </div>

          <div className="bg-white border border-border rounded-card p-5">
            <span className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Mail className="w-5 h-5" />
            </span>
            <h3 className="font-semibold text-text-primary mb-1">Submit a support ticket</h3>
            <p className="text-sm text-text-secondary mb-3">
              Can't find what you need? Our support team responds within 4 business hours.
            </p>
            <span className="text-sm font-medium text-purple-600">Open a ticket →</span>
          </div>

          <div className="bg-white border border-border rounded-card p-5">
            <span className="w-10 h-10 rounded-lg bg-success-bg text-success flex items-center justify-center mb-3">
              <Phone className="w-5 h-5" />
            </span>
            <h3 className="font-semibold text-text-primary mb-1">Call support</h3>
            <p className="text-sm text-text-secondary mb-3">
              For urgent clinical system issues, reach our 24/7 support line directly.
            </p>
            <a href="tel:+254800724832" className="text-sm font-medium text-success">
              +254 800 724 832 →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
