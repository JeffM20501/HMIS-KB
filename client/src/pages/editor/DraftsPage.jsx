import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import * as articlesApi from '../../api/articles.api';
import PageHeader from '../../components/common/PageHeader.jsx';
import SearchInput from '../../components/ui/SearchInput.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { FileEdit } from 'lucide-react';
import { extractErrorMessage } from '../../api/axios';
import { formatDate } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';

export default function DraftsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [layout, setLayout] = useState('cards');
  const debouncedSearch = useDebounce(search, 300);
  const [submittingSlug, setSubmittingSlug] = useState(null);

  const query = useQuery({
    queryKey: ['articles', 'my-articles', 'draft', debouncedSearch],
    queryFn: () => articlesApi.getMyArticles({ status: 'draft', search: debouncedSearch || undefined }),
  });

  const submitMutation = useMutation({
    mutationFn: articlesApi.submitForReview,
    onMutate: (slug) => setSubmittingSlug(slug),
    onSuccess: () => {
      toast.success('Submitted for review.');
      // Invalidate all my-articles queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['articles', 'my-articles'] });
      // Refetch the current query explicitly
      query.refetch();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
    onSettled: () => setSubmittingSlug(null),
  });

  const drafts = query.data?.results || query.data || [];

  const handleSubmit = (slug) => {
    submitMutation.mutate(slug);
  };

  return (
    <div>
      <PageHeader
        title="My Drafts"
        description={`${drafts.length} article${drafts.length === 1 ? '' : 's'} in progress`}
        actions={
          <Button as={Link} to="/editor/articles/new">
            <PlusCircle className="w-4 h-4" /> New Article
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search drafts..." className="max-w-xs" />
        <Tabs
          active={layout}
          onChange={setLayout}
          tabs={[
            { value: 'cards', label: 'Cards' },
            { value: 'table', label: 'Table' },
          ]}
          className="border-b-0"
        />
      </div>

      {query.isLoading && (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-card" />
          ))}
        </div>
      )}

      {!query.isLoading && drafts.length === 0 && (
        <EmptyState
          icon={FileEdit}
          title="No drafts yet"
          description="Start a new article and it will appear here until you submit it for review."
          actionLabel="New Article"
          onAction={() => navigate('/editor/articles/new')}
        />
      )}

      {!query.isLoading && drafts.length > 0 && layout === 'cards' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {drafts.map((d) => (
            <div
              key={d.slug}
              className="bg-white border border-border rounded-card p-5 hover:shadow-md transition-shadow"
            >
              {d.category && (
                <Badge tone="blue" className="mb-2">
                  {d.category.name || d.category}
                </Badge>
              )}
              <Link
                to={`/editor/articles/${d.slug}/edit`}
                className="block font-semibold text-text-primary mb-1.5 hover:text-primary"
              >
                {d.title || 'Untitled article'}
              </Link>
              <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                {d.summary || d.content?.slice(0, 120) + '…'}
              </p>
              {d.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {d.tags.slice(0, 4).map((t) => (
                    <span
                      key={t.id || t}
                      className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-text-secondary"
                    >
                      #{t.name || t}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-text-secondary">
                  Updated {formatDate(d.updated_at)}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleSubmit(d.slug)}
                  isLoading={submittingSlug === d.slug}
                  disabled={submittingSlug === d.slug}
                >
                  <Send className="w-3.5 h-3.5" /> Submit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!query.isLoading && drafts.length > 0 && layout === 'table' && (
        <div className="bg-white border border-border rounded-card divide-y divide-border">
          {drafts.map((d) => (
            <div key={d.slug} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <Link
                  to={`/editor/articles/${d.slug}/edit`}
                  className="font-medium text-text-primary hover:text-primary"
                >
                  {d.title || 'Untitled article'}
                </Link>
                <p className="text-xs text-text-secondary">{formatDate(d.updated_at)}</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleSubmit(d.slug)}
                isLoading={submittingSlug === d.slug}
                disabled={submittingSlug === d.slug}
              >
                <Send className="w-3.5 h-3.5" /> Submit
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}