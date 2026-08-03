import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import * as productsApi from '../../api/products.api';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Label from '../../components/ui/Label.jsx';
import FieldError from '../../components/ui/FieldError.jsx';
import { extractErrorMessage } from '../../api/axios';

export default function AdminProductsPage() {
    const queryClient = useQueryClient();
    const [editingProduct, setEditingProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        defaultValues: { name: '', description: '', is_active: true },
    });

    const productsQuery = useQuery({
        queryKey: ['products'],
        queryFn: () => productsApi.listProducts(),
    });

    const createMutation = useMutation({
        mutationFn: productsApi.createProduct,
        onSuccess: () => {
            toast.success('Product created successfully.');
            queryClient.invalidateQueries({ queryKey: ['products'] });
            closeModal();
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
    });

    const updateMutation = useMutation({
        mutationFn: ({ slug, payload }) => productsApi.updateProduct(slug, payload),
        onSuccess: () => {
            toast.success('Product updated successfully.');
            queryClient.invalidateQueries({ queryKey: ['products'] });
            closeModal();
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
    });

    const deleteMutation = useMutation({
        mutationFn: productsApi.deleteProduct,
        onSuccess: () => {
            toast.success('Product deleted.');
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
    });

    const openCreateModal = () => {
        reset({ name: '', description: '', is_active: true });
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const openEditModal = (product) => {
        reset({ name: product.name, description: product.description, is_active: product.is_active });
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const onSubmit = (data) => {
        if (editingProduct) {
            updateMutation.mutate({ slug: editingProduct.slug, payload: data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleDelete = (product) => {
        if (window.confirm(`Delete product "${product.name}"?`)) {
            deleteMutation.mutate(product.slug);
        }
    };

    const products = productsQuery.data?.results || [];

    const columns = [
        {
            key: 'name',
            header: 'Name',
            render: (row) => <span className="font-medium">{row.name}</span>,
        },
        { key: 'slug', header: 'Slug' },
        { key: 'description', header: 'Description' },
        {
            key: 'is_active',
            header: 'Status',
            render: (row) => (
                <Badge tone={row.is_active ? 'green' : 'gray'}>
                    {row.is_active ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: '',
            render: (row) => (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => openEditModal(row)}
                        className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary-50 rounded"
                        title="Edit"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(row)}
                        className="p-1.5 text-text-secondary hover:text-danger hover:bg-danger-bg rounded"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Products"
                description="Manage products (e.g., SHA, NSSF, etc.)"
                actions={
                    <Button onClick={openCreateModal}>
                        <Plus className="w-4 h-4" /> New Product
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                data={products}
                isLoading={productsQuery.isLoading}
                keyField="slug"
                emptyIcon={Package}
                emptyTitle="No products yet"
                emptyDescription="Create your first product to organize articles."
                onRowClick={(row) => openEditModal(row)}
            />

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProduct ? 'Edit Product' : 'New Product'}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Label required>Name</Label>
                        <Input
                            error={!!errors.name}
                            {...register('name', { required: 'Name is required' })}
                            placeholder="e.g. SHA"
                        />
                        <FieldError>{errors.name?.message}</FieldError>
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Input
                            {...register('description')}
                            placeholder="e.g. Social Health Authority"
                        />
                    </div>
                    <div>
                        <Label>Status</Label>
                        <select
                            {...register('is_active')}
                            className="w-full rounded border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isSubmitting}>
                            {editingProduct ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}