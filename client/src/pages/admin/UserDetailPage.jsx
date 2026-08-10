import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Shield, Ban, Trash2, Mail, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import * as usersApi from '../../api/users.api.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Select from '../../components/ui/Select.jsx';
import Label from '../../components/ui/Label.jsx';
import { extractErrorMessage } from '../../api/axios.js';
import { formatDate } from '../../utils/formatters.js';

const ROLE_TONE = { admin: 'blue', editor: 'purple', viewer: 'gray' };

export default function UserDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [newRole, setNewRole] = useState('');
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const userQuery = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getUser(id),
    enabled: !!id,
    });

    const dashboardQuery = useQuery({
    queryKey: ['users', 'admin-dashboard'],
    queryFn: usersApi.getAdminDashboard,
    });

    const user = userQuery.data;

    const roleMutation = useMutation({
    mutationFn: ({ id, role }) => usersApi.changeUserRole(id, role),
    onSuccess: () => {
        toast.success('Role updated successfully.');
        queryClient.invalidateQueries({ queryKey: ['user', id] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setShowRoleModal(false);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
    });

    const statusMutation = useMutation({
    mutationFn: ({ id, is_active }) => usersApi.patchUser(id, { is_active }),
    onSuccess: () => {
        toast.success(`User ${is_active ? 'activated' : 'suspended'} successfully.`);
        queryClient.invalidateQueries({ queryKey: ['user', id] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setShowSuspendModal(false);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
    });

    const deleteMutation = useMutation({
    mutationFn: () => usersApi.deleteUser(id),
    onSuccess: () => {
        toast.success('User removed permanently.');
        navigate('/admin/users');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
    });

    if (userQuery.isLoading) {
    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-60" />
            </div>
        </div>
        <Skeleton className="h-64 w-full rounded-card" />
        </div>
    );
    }

    if (userQuery.isError || !user) {
    return <ErrorState message="User not found" onRetry={() => userQuery.refetch()} />;
    }

    const isActive = user.is_active !== false;
    const d = dashboardQuery.data || {};

    const handleRoleChange = () => {
    if (newRole && newRole !== user.role) {
        roleMutation.mutate({ id: user.id, role: newRole });
    } else {
        setShowRoleModal(false);
    }
    };

    const handleToggleStatus = () => {
    statusMutation.mutate({ id: user.id, is_active: !isActive });
    };

    const handleDelete = () => {
    deleteMutation.mutate();
    };

    return (
    <div className="max-w-4xl mx-auto px-6 py-8">
        <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-6"
        >
        <ArrowLeft className="w-4 h-4" /> Back to Users
        </button>

        <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
            <Avatar name={user.full_name || user.email} size="lg" src={user.avatar} />
            <div>
            <h1 className="text-2xl font-bold text-text-primary">{user.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
                <Badge tone={ROLE_TONE[user.role] || 'gray'}>{user.role}</Badge>
                <StatusBadge status={isActive ? 'active' : 'suspended'} />
                <span className="text-sm text-text-secondary">{user.email}</span>
            </div>
            <p className="text-sm text-text-secondary mt-1">
                {user.department || 'No department'} · {user.facility || 'No facility'}
            </p>
            </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" onClick={() => setShowRoleModal(true)}>
            <Shield className="w-4 h-4" /> Change Role
            </Button>
            <Button variant="secondary" onClick={() => setShowSuspendModal(true)} isLoading={statusMutation.isPending}>
            <Ban className="w-4 h-4" /> {isActive ? 'Suspend' : 'Reactivate'}
            </Button>
            <Button variant="secondary" onClick={() => toast.info('Email functionality coming soon')}>
            <Mail className="w-4 h-4" /> Email
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
            <Trash2 className="w-4 h-4" /> Remove
            </Button>
        </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
            <p className="text-xs text-text-secondary mb-1">Articles</p>
            <p className="text-2xl font-bold">{user.article_count || 0}</p>
        </Card>
        <Card>
            <p className="text-xs text-text-secondary mb-1">Last Login</p>
            <p className="text-sm font-medium">{formatDate(user.last_login) || 'Never'}</p>
        </Card>
        <Card>
            <p className="text-xs text-text-secondary mb-1">Joined</p>
            <p className="text-sm font-medium">{formatDate(user.date_joined)}</p>
        </Card>
        <Card>
            <p className="text-xs text-text-secondary mb-1">Department</p>
            <p className="text-sm font-medium">{user.department || '—'}</p>
        </Card>
        </div>

        <Card className="p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-2">About this user</h3>
        <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-text-secondary">Full name</dt>
            <dd className="text-text-primary">{user.full_name}</dd>
            <dt className="text-text-secondary">Email</dt>
            <dd className="text-text-primary">{user.email}</dd>
            <dt className="text-text-secondary">Role</dt>
            <dd className="text-text-primary capitalize">{user.role}</dd>
            <dt className="text-text-secondary">Department</dt>
            <dd className="text-text-primary">{user.department || '—'}</dd>
            <dt className="text-text-secondary">Facility</dt>
            <dd className="text-text-primary">{user.facility || '—'}</dd>
            <dt className="text-text-secondary">Status</dt>
            <dd className="text-text-primary">{isActive ? 'Active' : 'Suspended'}</dd>
            <dt className="text-text-secondary">Last Login</dt>
            <dd className="text-text-primary">{formatDate(user.last_login) || 'Never'}</dd>
            <dt className="text-text-secondary">Joined</dt>
            <dd className="text-text-primary">{formatDate(user.date_joined)}</dd>
        </dl>
        </Card>

        {/* Change Role Modal */}
        <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title="Change Role">
        <div className="space-y-4">
            <div>
            <Label>Select new role</Label>
            <Select value={newRole || user.role} onChange={(e) => setNewRole(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
            </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
                Cancel
            </Button>
            <Button onClick={handleRoleChange} isLoading={roleMutation.isPending}>
                Update Role
            </Button>
            </div>
        </div>
        </Modal>

        {/* Suspend/Reactivate Confirmation Modal */}
        <Modal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        title={isActive ? 'Suspend User' : 'Reactivate User'}
        footer={
            <>
            <Button variant="secondary" onClick={() => setShowSuspendModal(false)}>
                Cancel
            </Button>
            <Button
                variant={isActive ? 'danger' : 'primary'}
                isLoading={statusMutation.isPending}
                onClick={handleToggleStatus}
            >
                {isActive ? <Ban className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                {isActive ? 'Suspend User' : 'Reactivate User'}
            </Button>
            </>
        }
        >
        {isActive ? (
            <div className="space-y-3">
            <div className="flex items-center gap-2 text-danger">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">You are about to suspend this user</span>
            </div>
            <p>
                User: <strong className="text-text-primary">“{user.full_name || user.email}”</strong>
            </p>
            <p className="text-text-secondary">
                Suspending this user will immediately revoke their access to the system.
                They will not be able to log in until reactivated.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                <strong>Note:</strong> Any active sessions will be terminated immediately.
            </div>
            </div>
        ) : (
            <div className="space-y-3">
            <div className="flex items-center gap-2 text-success">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">You are about to reactivate this user</span>
            </div>
            <p>
                User: <strong className="text-text-primary">“{user.full_name || user.email}”</strong>
            </p>
            <p className="text-text-secondary">
                Reactivating this user will restore their access to the system.
                They will be able to log in with their existing credentials.
            </p>
            </div>
        )}
        </Modal>

        {/* Delete User Confirmation Modal */}
        <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User Permanently"
        footer={
            <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
            </Button>
            <Button
                variant="danger"
                isLoading={deleteMutation.isPending}
                onClick={handleDelete}
            >
                <Trash2 className="w-4 h-4" /> Delete Permanently
            </Button>
            </>
        }
        >
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-danger">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">This action cannot be undone</span>
            </div>
            <p>
            User: <strong className="text-text-primary">“{user.full_name || user.email}”</strong>
            </p>
            <p className="text-text-secondary">
            All data associated with this user will be permanently removed from the database.
            </p>
            <div className="bg-danger-bg border border-danger/20 rounded-lg p-3 text-sm text-danger">
            <strong>Warning:</strong> This is irreversible. Only proceed if you are certain.
            </div>
        </div>
        </Modal>
    </div>
    );
}