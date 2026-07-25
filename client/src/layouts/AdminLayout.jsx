import { useQuery } from '@tanstack/react-query';
import DashboardLayout from './DashboardLayout.jsx';
import { ADMIN_NAV } from '../constants/nav';
import { ROUTES } from '../constants/routes';
import * as articlesApi from '../api/articles.api';

export default function AdminLayout() {
  const { data } = useQuery({
    queryKey: ['articles', 'pending-review', 'count'],
    queryFn: () => articlesApi.getPendingReview({ page_size: 1 }),
    staleTime: 60_000,
  });

  const badges = {
    pendingReview: data?.count ?? (Array.isArray(data) ? data.length : undefined),
  };

  return (
    <DashboardLayout
      navItems={ADMIN_NAV}
      badges={badges}
      notificationsRoute={ROUTES.ADMIN_DASHBOARD}
      currentModule="admin"
    />
  );
}
