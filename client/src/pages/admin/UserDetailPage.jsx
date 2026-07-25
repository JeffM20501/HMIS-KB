import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Shield, Ban, Trash2, Mail, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import * as usersApi from '../../api/users.api';
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
import { extractErrorMessage } from '../../api/axios';
import { formatDate } from '../../utils/formatters';

const ROLE_TONE = { admin: 'blue', editor: 'purple', viewer: 'gray' };

export default function UserDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [newRole, setNewRole] = useState('');

    // Fetch user details
    const userQuery = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getUser(id),
    enabled: !!id,
    });

    // Fetch dashboard stats (for additional context)
    const dashboardQuery = useQuery({
    queryKey: ['users', 'admin-dashboard'],
    queryFn: usersApi.getAdminDashboard,
    });

    const user = userQuery.data;

    // Mutations
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
    mutationFn: ({ id, status }) => usersApi.patchUser(id, { status }),
    onSuccess: () => {
        toast.success('User status updated.');
        queryClient.invalidateQueries({ queryKey: ['user', id] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
    });

    const deleteMutation = useMutation({
    mutationFn: () => usersApi.deleteUser(id),
    onSuccess: () => {
        toast.success('User removed.');
        navigate('/admin/users');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
    });

    // Loading state
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
    const newStatus = isActive ? 'suspended' : 'active';
    statusMutation.mutate({ id: user.id, status: newStatus });
    };

    const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove ${user.full_name || user.email}?`)) {
        deleteMutation.mutate();
    }
    };

    return (
    <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back button */}
        <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-6"
        >
        <ArrowLeft className="w-4 h-4" /> Back to Users
        </button>

        {/* Header with avatar and actions */}
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
            <Button variant="secondary" onClick={handleToggleStatus} isLoading={statusMutation.isPending}>
            <Ban className="w-4 h-4" /> {isActive ? 'Suspend' : 'Reactivate'}
            </Button>
            <Button variant="secondary" onClick={() => toast.info('Email functionality coming soon')}>
            <Mail className="w-4 h-4" /> Email
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleteMutation.isPending}>
            <Trash2 className="w-4 h-4" /> Remove
            </Button>
        </div>
        </div>

        {/* Stats cards */}
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

        {/* Additional info (optional) */}
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

        {/* Role Change Modal */}
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
    </div>
    );
}