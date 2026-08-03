import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as analyticsApi from '../../api/analytics.api';
import PageHeader from '../../components/common/PageHeader.jsx';
import SearchInput from '../../components/ui/SearchInput.jsx';
import Select from '../../components/ui/Select.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDateTime } from '../../utils/formatters';

const ACTION_TONE = {
  'Published': 'green',
  'Article Submitted': 'amber',
  'Role Changed': 'amber',
  'Rejected': 'red',
  'Created': 'blue',
  'Updated': 'blue',
  'Deleted': 'red',
  'Login': 'gray',
  'Logout': 'gray',
  'Viewed': 'gray',
  'Exported': 'purple',
};

const ACTIONS = Object.keys(ACTION_TONE);

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  const query = useQuery({
    queryKey: ['audit-logs', debouncedSearch, action, page],
    queryFn: () =>
      analyticsApi.listAuditLogs({ search: debouncedSearch || undefined, action: action || undefined, page }),
  });

  const logs = query.data?.results || query.data || [];
  const count = query.data?.count ?? logs.length;
  const totalPages = Math.max(1, Math.ceil(count / 20));

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.full_name || row.user_email} size="sm" />
          <span className="font-medium text-text-primary">{row.full_name || row.user_email}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => <Badge tone={ACTION_TONE[row.display_action] || 'gray'}>{row.display_action}</Badge>,
    },
    {
      key: 'object',
      header: 'Object',
      render: (row) => (
        <div>
          <p className="text-text-primary">{row.object_label}</p>
          {row.detail && <p className="text-xs text-text-secondary">{row.detail}</p>}
        </div>
      ),
    },
    { key: 'object_type', header: 'Type', render: (row) => <Badge tone="gray">{row.object_type}</Badge> },
    { key: 'ip_address', header: 'IP Address', render: (row) => <span className="text-text-secondary">{row.ip_address}</span> },
    { key: 'created_at', header: 'Timestamp', sortable: true, render: (row) => formatDateTime(row.created_at) },
  ];

  return (
    <div>
      <PageHeader title="Audit Logs" description="Every admin and content action, retained for compliance review" />

      <div className="flex items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search user or object..." className="max-w-xs" />
        <Select value={action} onChange={(e) => setAction(e.target.value)} className="max-w-[180px]">
          <option value="">All Actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        isLoading={query.isLoading}
        keyField="id"
        emptyTitle="No audit events found"
      />

      <div className="mt-4">
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
