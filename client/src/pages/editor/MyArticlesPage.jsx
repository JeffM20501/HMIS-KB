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

// Helper to generate summary from content
const getSummary = (content, maxLength = 160) => {
  if (!content) return '';
  const plain = content.replace(/[#*`>_-]/g, '').replace(/\n/g, ' ').trim();
  return plain.length > maxLength ? plain.slice(0, maxLength) + '…' : plain;
};

// Helper to format slug to readable name
const formatName = (input) => {
  if (!input) return '';
  // If it's an object with a name property, use that
  if (typeof input === 'object' && input.name) return input.name;
  // Otherwise treat as string slug
  const str = typeof input === 'string' ? input : '';
  const words = str.split('-');
  const formatted = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  return formatted;
};

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
            <Skeleton key={i} className="h-40 rounded-card" />
          ))}
        </div>
      )}

      {!query.isLoading && items.length === 0 && (
        <EmptyState title="No articles found" description="Try a different filter or search term." />
      )}

      {!query.isLoading && items.length > 0 && (
        <div className="space-y-4">
          {items.map((a) => {
            const summary = a.summary || getSummary(a.content);
            const categoryName = formatName(a.category);
            const productName = formatName(a.product);

            return (
              <Link
                key={a.slug}
                to={`/editor/articles/${a.slug}`}
                className="block bg-white border border-border rounded-card p-6 hover:border-primary transition-colors"
              >
                {/* Row 1: Title + Status */}
                <div className="flex items-start justify-between gap-4 mb-1.5">
                  <h3 className="font-semibold text-text-primary text-lg leading-snug flex-1 min-w-0">
                    {a.title}
                  </h3>
                  <div className="shrink-0 mt-0.5">
                    <StatusBadge status={a.status} />
                  </div>
                </div>

                {/* Row 2: Category + Module + Product + Version + Read time */}
                <div className="flex items-center gap-2 flex-wrap mb-2.5 text-sm">
                  {categoryName && (
                    <Badge tone="blue" className="text-xs">
                      {categoryName}
                    </Badge>
                  )}
                  {/* {a.module && (
                    <span className="text-text-secondary">{a.module}</span>
                  )} */}
                  {productName && (
                    <span className="text-text-secondary">· {productName}</span>
                  )}
                  {a.product_version && (
                    <span className="text-text-secondary">· {a.product_version}</span>
                  )}
                  <span className="text-text-secondary">·</span>
                  <span className="text-text-secondary flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {a.reading_time || 5} min read
                  </span>
                </div>

                {/* Row 3: Summary */}
                {summary && (
                  <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 mb-3">
                    {summary}
                  </p>
                )}

                {/* Row 4: Stats */}
                <div className="flex items-center gap-4 text-xs text-text-secondary">
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
                    {a.status === 'published'
                      ? `Published ${formatDate(a.published_at)}`
                      : `Updated ${formatDate(a.updated_at)}`}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}