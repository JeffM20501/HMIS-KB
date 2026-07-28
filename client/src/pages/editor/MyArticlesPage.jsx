import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Eye, ThumbsUp, MessageSquare, Clock } from 'lucide-react';
import * as articlesApi from '../../api/articles.api';
import PageHeader from '../../components/common/PageHeader.jsx';
import SearchInput from '../../components/ui/SearchInput.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate, formatNumber } from '../../utils/formatters';

export default function MyArticlesPage() {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const query = useQuery({
    queryKey: ['articles', 'my-articles', 'all', tab, debouncedSearch],
    queryFn: () =>
      articlesApi.getMyArticles({ status: tab === 'all' ? undefined : tab, search: debouncedSearch || undefined }),
  });

  const items = query.data?.results || query.data || [];
  const count = query.data?.count ?? items.length;

  return (
    <div>
      <PageHeader title="My Articles" description={`${count} articles across all statuses`} />

      <Tabs
        className="mb-4"
        active={tab}
        onChange={setTab}
        tabs={[
          { value: 'all', label: 'All', count: tab === 'all' ? count : undefined },
          { value: 'published', label: 'Published' },
          { value: 'pending_review', label: 'In Review' },
          { value: 'draft', label: 'Drafts' },
          { value: 'archived', label: 'Archived' },
        ]}
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search my articles..." className="max-w-xs mb-4" />

      {query.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
      )}

      {!query.isLoading && items.length === 0 && (
        <EmptyState title="No articles found" description="Try a different filter or search term." />
      )}

      {!query.isLoading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((a) => (
            <Link
              key={a.slug}
              to={`/editor/articles/${a.slug}`}
              className="block bg-white border border-border rounded-card p-5 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {a.category && <Badge tone="blue">{a.category.name || a.category}</Badge>}
                    <span className="text-xs text-text-secondary">{a.module}</span>
                    {a.product_version && <span className="text-xs text-text-secondary">· v{a.product_version}</span>}
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {a.reading_time || 5} min read
                    </span>
                  </div>
                  <p className="font-semibold text-text-primary">{a.title}</p>
                  <p className="text-sm text-text-secondary line-clamp-1 mt-0.5">{a.summary}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="flex items-center gap-4 text-xs text-text-secondary mt-3">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {formatNumber(a.views)} views
                </span>
                {a.rating && (
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5" /> {a.rating} rating
                  </span>
                )}
                {typeof a.feedback_count === 'number' && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> {a.feedback_count} feedback
                  </span>
                )}
                <span className="ml-auto">
                  {a.status === 'published' ? `Published ${formatDate(a.published_at)}` : `Updated ${formatDate(a.updated_at)}`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}