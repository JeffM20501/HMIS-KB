import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import * as analyticsApi from '../../api/analytics.api';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { formatRelativeTime } from '../../utils/formatters';

export default function EditorNotificationsPage() {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['notifications', 'all'], queryFn: () => analyticsApi.listNotifications() });

  const markReadMutation = useMutation({
    mutationFn: analyticsApi.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: analyticsApi.markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = query.data?.results || query.data || [];

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Review status updates, low-rating alerts, and content activity"
        actions={
          <Button variant="secondary" onClick={() => markAllMutation.mutate()} isLoading={markAllMutation.isPending}>
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </Button>
        }
      />

      {query.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-card" />
          ))}
        </div>
      )}

      {!query.isLoading && items.length === 0 && (
        <EmptyState icon={Bell} title="You're all caught up" description="New notifications will appear here." />
      )}

      {!query.isLoading && items.length > 0 && (
        <div className="bg-white border border-border rounded-card divide-y divide-border">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
              className={`w-full text-left flex items-start gap-3 px-5 py-4 hover:bg-gray-50 ${
                !n.is_read ? 'bg-primary-50/30' : ''
              }`}
            >
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-primary'}`} />
              <div className="flex-1">
                <p className="text-sm text-text-primary">{n.message || n.title}</p>
                <p className="text-xs text-text-secondary mt-0.5">{formatRelativeTime(n.created_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
