import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { UserPlus, MoreVertical, Shield, Ban, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import * as usersApi from '../../api/users.api';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import SearchInput from '../../components/ui/SearchInput.jsx';
import Select from '../../components/ui/Select.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Dropdown from '../../components/ui/Dropdown.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Label from '../../components/ui/Label.jsx';
import FieldError from '../../components/ui/FieldError.jsx';
import Card from '../../components/ui/Card.jsx';
import { useDebounce } from '../../hooks/useDebounce';
import { useDisclosure } from '../../hooks/useDisclosure';
import { extractErrorMessage } from '../../api/axios';
import { formatDate } from '../../utils/formatters';

const ROLE_TONE = { admin: 'blue', editor: 'purple', viewer: 'gray' };

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);
  const inviteModal = useDisclosure();

  const navigate=useNavigate();

  const usersQuery = useQuery({
    queryKey: ['users', 'admin', debouncedSearch, role, status, page],
    queryFn: () =>
      usersApi.listUsers({ search: debouncedSearch || undefined, role: role || undefined, status: status || undefined, page }),
  });

  const dashboardQuery = useQuery({ queryKey: ['users', 'admin-dashboard'], queryFn: usersApi.getAdminDashboard });

  const roleMutation = useMutation({
    mutationFn: ({ id, role: newRole }) => usersApi.changeUserRole(id, newRole),
    onSuccess: () => {
      toast.success('Role updated.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status: newStatus }) => usersApi.patchUser(id, { status: newStatus }),
    onSuccess: () => {
      toast.success('User status updated.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const users = usersQuery.data?.results || usersQuery.data || [];
  const count = usersQuery.data?.count ?? users.length;
  const totalPages = Math.max(1, Math.ceil(count / 20));
  const d = dashboardQuery.data || {};

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.full_name || row.email} size="sm" src={row.avatar} />
          <div>
            <p className="font-medium text-text-primary">{row.full_name}</p>
            <p className="text-xs text-text-secondary">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (row) => <Badge tone={ROLE_TONE[row.role] || 'gray'}>{row.role}</Badge> },
    { key: 'department', header: 'Department', render: (row) => row.department || '—' },
    { key: 'facility', header: 'Facility', render: (row) => row.facility || '—' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status || (row.is_active ? 'active' : 'inactive')} /> },
    { key: 'last_login', header: 'Last Login', render: (row) => formatDate(row.last_login) },
    { key: 'article_count', header: 'Articles', render: (row) => row.article_count ?? 0 },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown
            trigger={
              <button className="p-1.5 text-text-secondary hover:bg-gray-100 rounded">
                <MoreVertical className="w-4 h-4" />
              </button>
            }
            items={[
              {
                label: row.role === 'admin' ? 'Make Editor' : 'Make Admin',
                icon: Shield,
                onClick: () => roleMutation.mutate({ id: row.id, role: row.role === 'admin' ? 'editor' : 'admin' }),
              },
              {
                label: row.is_active === false ? 'Reactivate' : 'Suspend',
                icon: Ban,
                onClick: () => statusMutation.mutate({ id: row.id, status: row.is_active === false ? 'active' : 'suspended' }),
              },
              { divider: true },
              { label: 'Remove user', icon: Trash2, danger: true, onClick: () => usersApi.deleteUser(row.id) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="User Management"
        description={`${d.total_users ?? count} users across ${d.facility_count ?? '—'} facilities`}
        actions={
          <Button onClick={inviteModal.open}>
            <UserPlus className="w-4 h-4" /> Invite User
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <p className="text-xs text-text-secondary mb-1">Total Users</p>
          <p className="text-2xl font-bold">{d.total_users ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary mb-1">Active</p>
          <p className="text-2xl font-bold text-success">{d.active_users ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary mb-1">Editors</p>
          <p className="text-2xl font-bold text-purple-600">{d.editor_count ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary mb-1">Admins</p>
          <p className="text-2xl font-bold text-primary">{d.admin_count ?? '—'}</p>
        </Card>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." className="max-w-xs" />
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="max-w-[160px]">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[160px]">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={usersQuery.isLoading}
        keyField="id"
        emptyTitle="No users found"
        emptyDescription="Try adjusting your filters, or invite a new team member."
        onRowClick={(row) => navigate(`/admin/users/${row.id}`)}   // <-- add this
      />

      <div className="mt-4">
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      <InviteUserModal isOpen={inviteModal.isOpen} onClose={inviteModal.close} />
    </div>
  );
}

function InviteUserModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const mutation = useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      toast.success('Invitation sent.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      reset();
      onClose();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite User">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <Label required>Full name</Label>
          <Input error={!!errors.full_name} {...register('full_name', { required: 'Required' })} />
          <FieldError>{errors.full_name?.message}</FieldError>
        </div>
        <div>
          <Label required>Email</Label>
          <Input type="email" error={!!errors.email} {...register('email', { required: 'Required' })} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>
        <div>
          <Label required>Role</Label>
          <Select defaultValue="editor" {...register('role')}>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Send invite
          </Button>
        </div>
      </form>
    </Modal>
  );
}
