import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as categoriesApi from '../../api/categories.api';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import Label from '../../components/ui/Label.jsx';
import FieldError from '../../components/ui/FieldError.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { useDisclosure } from '../../hooks/useDisclosure';
import { extractErrorMessage } from '../../api/axios';
import { getCategoryIcon } from '../../utils/categoryIcons';

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState(null);
  const createModal = useDisclosure();
  const [editing, setEditing] = useState(null);

  const query = useQuery({ queryKey: ['categories', 'all'], queryFn: () => categoriesApi.listCategories() });
  const categories = query.data?.results || query.data || [];
  const active = categories.find((c) => c.id === activeId) || categories[0];

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.deleteCategory,
    onSuccess: () => {
      toast.success('Category deleted.');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize your knowledge base structure"
        actions={
          <Button onClick={createModal.open}>
            <Plus className="w-4 h-4" /> New Category
          </Button>
        }
      />

      {query.isLoading ? (
        <Skeleton className="h-96 rounded-card" />
      ) : (
        <div className="grid lg:grid-cols-[340px_1fr] gap-4">
          <div className="bg-white border border-border rounded-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border text-xs font-semibold text-text-secondary uppercase">
              {categories.length} Categories
            </div>
            <div className="divide-y divide-border">
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat.icon || cat.slug);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveId(cat.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 ${
                      (active?.id === cat.id) ? 'bg-primary-50/60 border-l-2 border-primary' : ''
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color || '#2563EB'}1A`, color: cat.color || '#2563EB' }}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{cat.name}</p>
                      <p className="text-xs text-text-secondary">{cat.article_count ?? 0} articles</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {active && (
            <div className="bg-white border border-border rounded-card p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-3.5">
                  <span
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${active.color || '#2563EB'}1A`, color: active.color || '#2563EB' }}
                  >
                    {(() => {
                      const Icon = getCategoryIcon(active.icon || active.slug);
                      return <Icon className="w-6 h-6" />;
                    })()}
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">{active.name}</h2>
                    <p className="text-sm text-text-secondary">/{active.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditing(active)}>
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button variant="dangerOutline" size="sm" onClick={() => deleteMutation.mutate(active.id)}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </div>

              <p className="text-text-secondary mb-6">{active.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-primary">{active.article_count ?? 0}</p>
                  <p className="text-sm text-text-secondary">Published Articles</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-text-primary">{active.subcategories?.length ?? 0}</p>
                  <p className="text-sm text-text-secondary">Subcategories</p>
                </div>
              </div>

              {!!active.subcategories?.length && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-text-primary mb-2">Subcategories</p>
                  <div className="flex flex-wrap gap-2">
                    {active.subcategories.map((sub) => (
                      <span key={sub.id} className="text-sm px-3 py-1.5 rounded-full border border-primary/30 text-primary">
                        {sub.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-text-primary mb-2">Display Color</p>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded" style={{ backgroundColor: active.color || '#2563EB' }} />
                  <span className="text-sm text-text-secondary">{active.color || '#2563EB'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <CategoryFormModal
        isOpen={createModal.isOpen || !!editing}
        onClose={() => {
          createModal.close();
          setEditing(null);
        }}
        category={editing}
      />
    </div>
  );
}

function CategoryFormModal({ isOpen, onClose, category }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ values: category || { name: '', slug: '', description: '' } });

  const mutation = useMutation({
    mutationFn: (payload) =>
      category ? categoriesApi.updateCategory(category.id, payload) : categoriesApi.createCategory(payload),
    onSuccess: () => {
      toast.success(category ? 'Category updated.' : 'Category created.');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      reset();
      onClose();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={category ? 'Edit Category' : 'New Category'}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <Label required>Category Name</Label>
          <Input placeholder="e.g. Telemedicine" error={!!errors.name} {...register('name', { required: 'Required' })} />
          <FieldError>{errors.name?.message}</FieldError>
        </div>
        <div>
          <Label required>Slug</Label>
          <Input placeholder="e.g. telemedicine" error={!!errors.slug} {...register('slug', { required: 'Required' })} />
          <FieldError>{errors.slug?.message}</FieldError>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea rows={3} placeholder="Brief description..." {...register('description')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {category ? 'Save changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
