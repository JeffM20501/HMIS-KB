import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Trash2, Archive, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import * as articlesApi from '../../api/articles.api';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Button from '../../components/ui/Button.jsx';
import { extractErrorMessage } from '../../api/axios';
import { formatDate } from '../../utils/formatters';

export default function ArchivedArticlesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const query = useQuery({
    queryKey: ['articles', 'archived', page],
    queryFn: () => articlesApi.listArticles({ status: 'archived', page }),
  });

  const restoreMutation = useMutation({
    mutationFn: (slug) => articlesApi.restoreArticle(slug),
    onSuccess: () => {
      toast.success('Article restored to draft.');
      queryClient.invalidateQueries({ queryKey: ['articles', 'archived'] });
      setRestoreTarget(null);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (slug) => articlesApi.deleteArticle(slug),
    onSuccess: () => {
      toast.success('Article permanently deleted.');
      queryClient.invalidateQueries({ queryKey: ['articles', 'archived'] });
      setDeleteTarget(null);
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
            onClick={() => setRestoreTarget(row)}
            className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary-50 rounded"
            title="Restore"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 text-text-secondary hover:text-danger hover:bg-danger-bg rounded"
            title="Delete permanently"
          >
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
        onRowClick={(row) => navigate(`/admin/articles/${row.slug}`)}
        emptyIcon={Archive}
        emptyTitle="No archived articles"
        emptyDescription="Articles you archive from Published Articles will show up here."
      />
      <div className="mt-4">
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        title="Restore Article"
        description={
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">You are about to restore this article</span>
            </div>
            <p>
              Article: <strong className="text-text-primary">“{restoreTarget?.title}”</strong>
            </p>
            <p className="text-text-secondary">
              This article will become a <strong>draft</strong> and will need to be submitted for review again before it can be published.
            </p>
          </div>
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setRestoreTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={restoreMutation.isPending}
              onClick={() => restoreTarget && restoreMutation.mutate(restoreTarget.slug)}
            >
              <RotateCcw className="w-4 h-4" /> Restore Article
            </Button>
          </>
        }
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Permanently"
        description={
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">This action cannot be undone</span>
            </div>
            <p>
              Article: <strong className="text-text-primary">“{deleteTarget?.title}”</strong>
            </p>
            <p className="text-text-secondary">
              The article and all its associated data (media, feedback, etc.) will be permanently removed from the database.
            </p>
            <div className="bg-danger-bg border border-danger/20 rounded-lg p-3 text-sm text-danger">
              <strong>Warning:</strong> This is irreversible. Only proceed if you are certain.
            </div>
          </div>
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.slug)}
            >
              <Trash2 className="w-4 h-4" /> Delete Permanently
            </Button>
          </>
        }
      />
    </div>
  );
}