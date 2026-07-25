import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import * as analyticsApi from '../../api/analytics.api';
import Button from '../../components/ui/Button.jsx';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => analyticsApi.listNotifications(),
  });

  const markReadMutation = useMutation({
    mutationFn: analyticsApi.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Marked as read');
    },
    onError: () => toast.error('Failed to mark as read'),
  });

  const markAllReadMutation = useMutation({
    mutationFn: analyticsApi.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: () => toast.error('Failed to mark all as read'),
  });

  const notifications = query.data?.results || query.data || [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
          <p className="text-text-secondary text-sm">
            Review status updates, low-rating alerts, and content activity
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => markAllReadMutation.mutate()}
          isLoading={markAllReadMutation.isPending}
          disabled={notifications.every(n => n.read)}
        >
          <CheckCheck className="w-4 h-4" /> Mark all as read
        </Button>
      </div>

      {query.isLoading && <div>Loading...</div>}

      {!query.isLoading && notifications.length === 0 && (
        <div className="text-center py-20 text-text-secondary">
          <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-medium text-text-primary">No notifications</p>
          <p>You're all caught up!</p>
        </div>
      )}

      {!query.isLoading && notifications.length > 0 && (
        <div className="bg-white border border-border rounded-card divide-y divide-border">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`px-5 py-4 flex items-start gap-4 ${!n.read ? 'bg-blue-50' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.read ? 'font-medium' : ''}`}>
                  {n.message}
                </p>
                <span className="text-xs text-text-secondary">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </span>
              </div>
              {!n.read && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => markReadMutation.mutate(n.id)}
                  isLoading={markReadMutation.isPending}
                >
                  <Check className="w-4 h-4" /> Mark as read
                </Button>
              )}
              {n.read && (
                <span className="text-xs text-text-secondary flex items-center gap-1">
                  <Check className="w-3 h-3" /> Read
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}