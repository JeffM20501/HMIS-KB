import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Trash2, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import * as articlesApi from '../../api/articles.api';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { extractErrorMessage } from '../../api/axios';
import { formatDate } from '../../utils/formatters';

export default function ArchivedArticlesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['articles', 'archived', page],
    queryFn: () => articlesApi.listArticles({ status: 'archived', page }),
  });

  const restoreMutation = useMutation({
    mutationFn: (slug) => articlesApi.updateArticle(slug, { status: 'published' }),
    onSuccess: () => {
      toast.success('Article restored to published.');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const items = query.data?.results || query.data || [];
  const count = query.data?.count ?? items.length;
  const totalPages = Math.max(1, Math.ceil(count / 20));

  const columns = [
    {
      key: 'title',
      header: 'Article',
      render: (row) => <p className="font-medium text-text-primary">{row.title}</p>,
    },
    { key: 'category', header: 'Category', render: (row) => <Badge tone="gray">{row.category?.name || row.category}</Badge> },
    { key: 'archived_at', header: 'Archived', render: (row) => formatDate(row.archived_at || row.updated_at) },
    { key: 'archived_reason', header: 'Reason', render: (row) => row.archived_reason || '—' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => restoreMutation.mutate(row.slug)}
            className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary-50 rounded"
            title="Restore"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-text-secondary hover:text-danger hover:bg-danger-bg rounded" title="Delete permanently">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Archived Articles" description="Restore or permanently delete articles removed from the knowledge base" />
      <DataTable
        columns={columns}
        data={items}
        isLoading={query.isLoading}
        keyField="slug"
        emptyIcon={Archive}
        emptyTitle="No archived articles"
        emptyDescription="Articles you archive from Published Articles will show up here."
      />
      <div className="mt-4">
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
