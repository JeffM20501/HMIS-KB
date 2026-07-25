import { useQuery } from '@tanstack/react-query';
import DashboardLayout from './DashboardLayout.jsx';
import { EDITOR_NAV } from '../constants/nav';
import { ROUTES } from '../constants/routes';
import * as articlesApi from '../api/articles.api';
import * as analyticsApi from '../api/analytics.api';

export default function EditorLayout() {
  const { data: drafts } = useQuery({
    queryKey: ['articles', 'my-articles', 'drafts', 'count'],
    queryFn: () => articlesApi.getMyArticles({ status: 'draft', page_size: 1 }),
    staleTime: 60_000,
  });

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: analyticsApi.getUnreadNotificationCount,
    staleTime: 60_000,
  });

  const badges = {
    drafts: drafts?.count ?? (Array.isArray(drafts) ? drafts.length : undefined),
    notifications: unread?.count ?? unread?.unread_count,
  };

  return (
    <DashboardLayout
      navItems={EDITOR_NAV}
      badges={badges}
      notificationsRoute={ROUTES.EDITOR_NOTIFICATIONS}
      currentModule="editor"
    />
  );
}
