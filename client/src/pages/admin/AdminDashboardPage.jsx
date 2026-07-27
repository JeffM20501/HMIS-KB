import { useQuery } from '@tanstack/react-query';
import { FileText, BookOpen, Clock, FileEdit, Archive, Users } from 'lucide-react';
import * as usersApi from '../../api/users.api';
import * as analyticsApi from '../../api/analytics.api';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/dashboard/StatCard.jsx';
import ChartCard from '../../components/dashboard/ChartCard.jsx';
import AreaTrendChart from '../../components/analytics/AreaTrendChart.jsx';
import DonutStatChart from '../../components/analytics/DonutStatChart.jsx';
import BarTrendChart from '../../components/analytics/BarTrendChart.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { formatNumber } from '../../utils/formatters';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const dashboardQuery = useQuery({
    queryKey: ['users', 'admin-dashboard'],
    queryFn: usersApi.getAdminDashboard,
  });

  const timeSeriesQuery = useQuery({
    queryKey: ['analytics', 'time-series', 'views-searches'],
    queryFn: () => analyticsApi.getTimeSeriesStats({ metric: 'views_searches', range: '7d' }),
  });

  const d = dashboardQuery.data || {};
  const stats = [
    { icon: FileText, label: 'Total Articles', value: d.total_articles, tone: 'blue' },
    { icon: BookOpen, label: 'Published', value: d.published_count, sublabel: 'Live & searchable', tone: 'green' },
    { icon: Clock, label: 'Pending Review', value: d.pending_review_count, sublabel: 'Awaiting approval', tone: 'amber' },
    { icon: FileEdit, label: 'Drafts', value: d.draft_count, sublabel: 'In progress', tone: 'gray' },
    { icon: Archive, label: 'Archived', value: d.archived_count, sublabel: 'Removed from KB', tone: 'red' },
    { icon: Users, label: 'Editors', value: d.editor_count, tone: 'purple' },
  ];

  const trend = timeSeriesQuery.data?.results || timeSeriesQuery.data || [];
  const categoryBreakdown = d.views_by_category || [];
  const creationTrend = d.article_creation_trend || [];
  const mostViewed = d.most_viewed_articles || [];

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description={`Welcome back, ${user?.full_name || 'Admin'} · TaifaCare Help Center. ${new Date().toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} isLoading={dashboardQuery.isLoading} value={formatNumber(s.value)} />
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4 mb-6">
        <ChartCard title="Article Views & Searches" subtitle="Last 7 days" isLoading={timeSeriesQuery.isLoading}>
          <AreaTrendChart
            data={trend}
            xKey="label"
            series={[
              { dataKey: 'views', color: '#2563EB' },
              { dataKey: 'searches', color: '#10B981' },
            ]}
          />
        </ChartCard>

        <ChartCard title="Views by Category" subtitle="This month" isLoading={dashboardQuery.isLoading}>
          {categoryBreakdown.length > 0 ? (
            <DonutStatChart data={categoryBreakdown} nameKey="name" valueKey="percentage" />
          ) : (
            <p className="text-sm text-text-secondary py-10 text-center">No data yet.</p>
          )}
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
        <ChartCard title="Article Creation" subtitle="Monthly trend" isLoading={dashboardQuery.isLoading}>
          {creationTrend.length > 0 ? (
            <BarTrendChart data={creationTrend} xKey="month" dataKey="count" />
          ) : (
            <p className="text-sm text-text-secondary py-10 text-center">No data yet.</p>
          )}
        </ChartCard>

        <ChartCard
          title="Most Viewed Articles"
          isLoading={dashboardQuery.isLoading}
          action={
            <Link to="/admin/published" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          }
        >
          <div className="divide-y divide-border -mx-5">
            {mostViewed.length === 0 && <p className="text-sm text-text-secondary text-center py-8">No articles yet.</p>}
            {mostViewed.map((a, i) => (
              <Link
                key={a.id || a.slug}
                to={`/articles/${a.slug}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50"
              >
                <span className="text-sm font-semibold text-text-secondary w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{a.title}</p>
                  <p className="text-xs text-text-secondary">{a.category?.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-text-primary">{formatNumber(a.views)}</p>
                  <p className="text-xs text-text-secondary">{a.rating} ★</p>
                </div>
              </Link>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
