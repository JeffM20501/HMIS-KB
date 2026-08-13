import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, FileEdit, Eye, PlusCircle } from 'lucide-react';
import * as usersApi from '../../api/users.api';
import * as analyticsApi from '../../api/analytics.api';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/dashboard/StatCard.jsx';
import ChartCard from '../../components/dashboard/ChartCard.jsx';
import BarTrendChart from '../../components/analytics/BarTrendChart.jsx';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { useAuth } from '../../hooks/useAuth';
import { formatNumber, formatRelativeTime } from '../../utils/formatters';

export default function EditorDashboardPage() {
  const { user } = useAuth();

  const dashboardQuery = useQuery({ queryKey: ['users', 'my-dashboard'], queryFn: usersApi.getMyDashboard });
  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'preview'],
    queryFn: () => analyticsApi.listNotifications({ page_size: 5 }),
  });

  const d = dashboardQuery.data || {};
  const notifications = (notificationsQuery.data?.results || notificationsQuery.data || []).slice(0,5);
  const recentArticles = d.recent_articles || [];
  const viewsByMonth = d.views_by_month || [];

  const firstName = (user?.full_name || user?.username ||'').split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${firstName} 👋`}
        description={`${user?.department || 'Editor'} · ${new Date().toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}`}
        actions={
          <Button as={Link} to="/editor/articles/new">
            <PlusCircle className="w-4 h-4" /> New Article
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={CheckCircle2} label="My Published" value={formatNumber(d.published_count)} tone="green" isLoading={dashboardQuery.isLoading} />
        <StatCard icon={Clock} label="Pending Review" value={formatNumber(d.pending_review_count)} tone="amber" isLoading={dashboardQuery.isLoading} />
        <StatCard icon={FileEdit} label="In Draft" value={formatNumber(d.draft_count)} tone="gray" isLoading={dashboardQuery.isLoading} />
        <StatCard icon={Eye} label="Total Views" value={formatNumber(d.total_views)} tone="blue" isLoading={dashboardQuery.isLoading} />
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <div className="space-y-4">
          <ChartCard
            title="My Recent Articles"
            isLoading={dashboardQuery.isLoading}
            action={
              <Link to="/editor/my-articles" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            }
          >
            <div className="divide-y divide-border -mx-5 -mb-5">
              {recentArticles.length === 0 && (
                <p className="text-sm text-text-secondary text-center py-8">No articles yet — start your first one.</p>
              )}
              {recentArticles.map((a) => (
                <div key={a.id || a.slug} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{a.title}</p>
                    <p className="text-xs text-text-secondary">
                      {a.category?.name} · Updated {formatRelativeTime(a.updated_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <StatusBadge status={a.status} />
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {formatNumber(a.views)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Article Views by Month" isLoading={dashboardQuery.isLoading}>
            {viewsByMonth.length > 0 ? (
              <BarTrendChart data={viewsByMonth} xKey="month" dataKey="views" />
            ) : (
              <p className="text-sm text-text-secondary text-center py-10">No view data yet.</p>
            )}
          </ChartCard>
        </div>

        <div className="space-y-4">
          <ChartCard
            title="Notifications"
            isLoading={notificationsQuery.isLoading}
            action={
              <Link to="/editor/notifications" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            }
          >
            <div className="space-y-3 -mb-2">
              {notifications.length === 0 && <p className="text-sm text-text-secondary text-center py-6">Nothing new.</p>}
              {notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-2">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${n.is_read ? 'bg-gray-300' : 'bg-primary'}`} />
                  <div>
                    <p className="text-sm text-text-primary leading-snug">{n.message || n.title}</p>
                    <p className="text-xs text-text-secondary">{formatRelativeTime(n.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Quick Actions">
            <div className="space-y-2 -mb-1">
              <Link
                to="/editor/drafts"
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:border-primary hover:bg-primary-50/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">Continue Drafts</p>
                  <p className="text-xs text-text-secondary">{d.draft_count ?? 0} in progress</p>
                </div>
              </Link>
              <Link
                to="/editor/submitted"
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:border-primary hover:bg-primary-50/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">Check Review Status</p>
                  <p className="text-xs text-text-secondary">{d.pending_review_count ?? 0} pending</p>
                </div>
              </Link>
              <Link
                to="/editor/my-articles"
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:border-primary hover:bg-primary-50/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">View My Articles</p>
                  <p className="text-xs text-text-secondary">{d.published_count ?? 0} published</p>
                </div>
              </Link>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
