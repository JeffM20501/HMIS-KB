import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Edit2, Archive, Star, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import * as articlesApi from '../../api/articles.api';
import * as categoriesApi from '../../api/categories.api';
import PageHeader from '../../components/common/PageHeader.jsx';
import SearchInput from '../../components/ui/SearchInput.jsx';
import Select from '../../components/ui/Select.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { useDebounce } from '../../hooks/useDebounce';
import { extractErrorMessage } from '../../api/axios';
import { formatDate, formatNumber } from '../../utils/formatters';

export default function PublishedArticlesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  const categoriesQuery = useQuery({ queryKey: ['categories', 'root'], queryFn: categoriesApi.getRootCategories });

  const articlesQuery = useQuery({
    queryKey: ['articles', 'published', debouncedSearch, category, page],
    queryFn: () =>
      articlesApi.listArticles({
        status: 'published',
        search: debouncedSearch || undefined,
        category: category || undefined,
        page,
      }),
  });

  const archiveMutation = useMutation({
    mutationFn: articlesApi.deleteArticle,
    onSuccess: () => {
      toast.success('Article archived.');
      queryClient.invalidateQueries({ queryKey: ['articles', 'published'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const articles = articlesQuery.data?.results || articlesQuery.data || [];
  const count = articlesQuery.data?.count ?? articles.length;
  const totalPages = Math.max(1, Math.ceil(count / 20));
  const categories = categoriesQuery.data?.results || categoriesQuery.data || [];

  const columns = [
    {
      key: 'title',
      header: 'Article',
      sortable: true,
      render: (row) => (
        <div className="max-w-sm">
          <p className="font-medium text-text-primary truncate">{row.title}</p>
          <p className="text-xs text-text-secondary truncate">{row.summary}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (row) => <Badge tone="blue">{row.category?.name || row.category}</Badge> },
    { key: 'author', header: 'Author', render: (row) => row.author?.full_name || '—' },
    { key: 'product_version', header: 'Version', render: (row) => `v${row.product_version || '1.0'}` },
    {
      key: 'views',
      header: 'Views',
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-text-secondary" /> {formatNumber(row.views)}
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (row) => (
        <span className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-warning fill-warning" /> {row.rating || '—'}
        </span>
      ),
    },
    { key: 'updated_at', header: 'Last Updated', sortable: true, render: (row) => formatDate(row.updated_at) },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/editor/articles/${row.slug}/edit`)}
            className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary-50 rounded"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => archiveMutation.mutate(row.slug)}
            className="p-1.5 text-text-secondary hover:text-danger hover:bg-danger-bg rounded"
            title="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Published Articles" description={`${count} articles live in the knowledge base`} />

      <div className="flex items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search articles or authors..." className="max-w-xs" />
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="max-w-[200px]">
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={articles}
        isLoading={articlesQuery.isLoading}
        keyField="slug"
        onRowClick={(row) => navigate(`/articles/${row.slug}`)}
        emptyTitle="No published articles"
        emptyDescription="Articles will appear here once approved from the review queue."
      />

      <div className="mt-4">
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
