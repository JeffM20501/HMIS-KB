import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import * as articlesApi from '../../api/articles.api';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { Send } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

const TABS = [
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
];

export default function SubmittedPage() {
  const [tab, setTab] = useState('pending_review');

  const query = useQuery({
    queryKey: ['articles', 'my-articles', 'submitted', tab],
    queryFn: () => articlesApi.getMyArticles({ status: tab }),
  });

  const items = query.data?.results || query.data || [];

  return (
    <div>
      <PageHeader title="Submitted Articles" description="Track the review status of your submitted content" />

      <div className="flex items-center gap-3 mb-6">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              tab === t.value ? 'border-primary bg-primary-50 text-primary' : 'border-border text-text-secondary hover:bg-gray-50'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                t.value === 'pending_review' ? 'bg-warning' : t.value === 'published' ? 'bg-success' : 'bg-danger'
              }`}
            />
            {t.label}
            {tab === t.value && !query.isLoading && (
              <span className="text-xs bg-white rounded-full px-1.5">{items.length}</span>
            )}
          </button>
        ))}
      </div>

      {query.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-card" />
          ))}
        </div>
      )}

      {!query.isLoading && items.length === 0 && (
        <EmptyState icon={Send} title="Nothing here" description={`No articles are currently ${tab.replace('_', ' ')}.`} />
      )}

      {!query.isLoading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((a) => (
            <Link
              key={a.slug}
              to={`/articles/${a.slug}`}  // ✅ link to public article page
              className="flex items-center justify-between bg-white border border-border rounded-card p-4 hover:border-primary transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  {a.category && <Badge tone="blue">{a.category.name || a.category}</Badge>}
                  {a.product_version && <span className="text-xs text-text-secondary">v{a.product_version}</span>}
                </div>
                <p className="font-medium text-text-primary truncate">{a.title}</p>
                <p className="text-sm text-text-secondary line-clamp-1">{a.summary}</p>
              </div>
              <div className="text-right ml-4 shrink-0">
                <StatusBadge status={a.status} />
                {typeof a.views === 'number' && (
                  <p className="text-xs text-text-secondary mt-1">{formatNumber(a.views)} views</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}