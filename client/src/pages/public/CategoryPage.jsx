import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import * as categoriesApi from '../../api/categories.api';
import ArticleCard from '../../components/article/ArticleCard.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { FileQuestion } from 'lucide-react';
import { getCategoryIcon } from '../../utils/categoryIcons';

export default function CategoryPage() {
  const { slug } = useParams();
  const [tab, setTab] = useState('popular');

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'root'],
    queryFn: categoriesApi.getRootCategories,
  });

  const category = (categoriesQuery.data?.results || categoriesQuery.data || []).find((c) => c.slug === slug);

  const articlesQuery = useQuery({
    queryKey: ['category-articles', slug, tab],
    queryFn: () =>
      categoriesApi.getCategoryArticles(category?.id, {
        ordering: tab === 'popular' ? '-views' : '-updated_at',
        status: 'published',
      }),
    enabled: !!category?.id,
  });

  if (categoriesQuery.isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  if (categoriesQuery.isError) {
    return <ErrorState message="Couldn't load this category." onRetry={categoriesQuery.refetch} />;
  }

  if (!category) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Category not found"
        description="This category may have been renamed or removed."
      />
    );
  }

  const Icon = getCategoryIcon(category.icon || category.slug);
  const articles = articlesQuery.data?.results || articlesQuery.data || [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center gap-1.5 text-sm text-text-secondary mb-6">
        <Link to="/" className="hover:text-primary">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-text-primary font-medium">{category.name}</span>
      </div>

      <div className="flex items-start gap-4 mb-8">
        <span
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${category.color || '#2563EB'}1A`, color: category.color || '#2563EB' }}
        >
          <Icon className="w-7 h-7" />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{category.name}</h1>
          <p className="text-text-secondary mt-1">{category.description}</p>
        </div>
      </div>

      {!!category.subcategories?.length && (
        <div className="flex flex-wrap gap-2 mb-8">
          {category.subcategories.map((sub) => (
            <Link
              key={sub.id || sub.slug}
              to={`/categories/${sub.slug}`}
              className="text-sm px-3 py-1.5 rounded-full border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      <Tabs
        className="mb-6"
        active={tab}
        onChange={setTab}
        tabs={[
          { value: 'popular', label: 'Popular articles' },
          { value: 'recent', label: 'Recently updated' },
        ]}
      />

      {articlesQuery.isLoading && (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-card" />
          ))}
        </div>
      )}

      {!articlesQuery.isLoading && articles.length === 0 && (
        <EmptyState title="No articles yet" description="Check back soon — this category is still being written." />
      )}

      {!articlesQuery.isLoading && articles.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {articles.map((a) => (
            <ArticleCard key={a.id || a.slug} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
