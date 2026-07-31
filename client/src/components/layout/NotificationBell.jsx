import { Bell } from 'lucide-react';
import { Popover, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as analyticsApi from '../../api/analytics.api';
import { formatRelativeTime } from '../../utils/formatters';

export default function NotificationBell({ route }) {
  const queryClient = useQueryClient();

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: analyticsApi.getUnreadNotificationCount,
    refetchInterval: 60_000,
  });

  const { data } = useQuery({
    queryKey: ['notifications', 'preview'],
    queryFn: () => analyticsApi.listNotifications({ page_size: 6 }),
  });

  const markRead = useMutation({
    mutationFn: analyticsApi.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = data?.results || data || [];
  const count = unread?.count ?? unread?.unread_count ?? 0;

  return (
    <Popover className="relative">
      <Popover.Button className="relative p-2 rounded hover:bg-gray-50 focus-ring">
        <Bell className="w-5 h-5 text-text-secondary" />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger ring-2 ring-white" />
        )}
      </Popover.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
      >
        <Popover.Panel className="absolute right-0 mt-2 w-80 bg-white border border-border rounded-lg shadow-popover z-40">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="font-semibold text-sm">Notifications</span>
            {route && (
              <Link to={route} className="text-xs text-primary font-medium">
                View all
              </Link>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {items.length === 0 && (
              <p className="text-sm text-text-secondary text-center py-8">You're all caught up.</p>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead.mutate(n.id)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-2"
              >
                <span
                  className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                    n.is_read ? 'bg-transparent' : 'bg-primary'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm text-text-primary leading-snug">{n.message || n.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{formatRelativeTime(n.created_at)}</p>
                </div>
              </button>
            ))}
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
}
