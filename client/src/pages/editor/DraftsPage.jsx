import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Send, Calendar } from 'lucide-react';
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

  const query = useQuery({
    queryKey: ['articles', 'my-articles', 'draft', debouncedSearch],
    queryFn: () => articlesApi.getMyArticles({ status: 'draft', search: debouncedSearch || undefined }),
  });

  const submitMutation = useMutation({
    mutationFn: articlesApi.submitForReview,
    onSuccess: () => {
      toast.success('Submitted for review.');
      queryClient.invalidateQueries({ queryKey: ['articles', 'my-articles'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const drafts = query.data?.results || query.data || [];

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-card" />
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

      {/* Cards layout – 3 per row */}
      {!query.isLoading && drafts.length > 0 && layout === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {drafts.map((d) => (
            <div key={d.slug} className="bg-white border border-border rounded-card p-5 hover:shadow-sm transition-shadow flex flex-col">
              {d.category && (
                <Badge tone="blue" className="mb-2 self-start">
                  {d.category.name || d.category}
                </Badge>
              )}
              <Link
                to={`/editor/articles/${d.slug}`}
                className="block font-semibold text-text-primary mb-1.5 hover:text-primary transition-colors line-clamp-2"
              >
                {d.title || 'Untitled article'}
              </Link>
              <p className="text-sm text-text-secondary line-clamp-2 mb-3 flex-1">
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
              <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                <span className="text-xs text-text-secondary">
                  Updated {formatDate(d.updated_at)}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => submitMutation.mutate(d.slug)}
                  isLoading={submitMutation.isPending}
                  disabled={submitMutation.isPending}
                >
                  <Send className="w-3.5 h-3.5" /> Submit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table layout unchanged */}
      {!query.isLoading && drafts.length > 0 && layout === 'table' && (
        <div className="bg-white border border-border rounded-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left font-semibold text-text-secondary px-4 py-3">Title</th>
                <th className="text-left font-semibold text-text-secondary px-4 py-3">Category</th>
                <th className="text-left font-semibold text-text-secondary px-4 py-3">Tags</th>
                <th className="text-left font-semibold text-text-secondary px-4 py-3">Module</th>
                <th className="text-left font-semibold text-text-secondary px-4 py-3">Last Edited</th>
                <th className="text-right font-semibold text-text-secondary px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {drafts.map((d) => (
                <tr key={d.slug} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      to={`/editor/articles/${d.slug}`}
                      className="font-medium text-text-primary hover:text-primary transition-colors"
                    >
                      {d.title || 'Untitled article'}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {d.category ? (
                      <Badge tone="blue">{d.category.name || d.category}</Badge>
                    ) : (
                      <span className="text-text-secondary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {d.tags?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {d.tags.slice(0, 3).map((t) => (
                          <span
                            key={t.id || t}
                            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-text-secondary"
                          >
                            #{t.name || t}
                          </span>
                        ))}
                        {d.tags.length > 3 && (
                          <span className="text-xs text-text-secondary">+{d.tags.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-text-secondary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {d.module || '—'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(d.updated_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => submitMutation.mutate(d.slug)}
                      isLoading={submitMutation.isPending}
                      disabled={submitMutation.isPending}
                    >
                      <Send className="w-3.5 h-3.5" /> Submit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}