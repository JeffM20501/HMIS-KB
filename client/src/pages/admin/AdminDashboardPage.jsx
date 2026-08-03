import { useQuery } from '@tanstack/react-query';
import { FileText, BookOpen, Clock, FileEdit, Archive, Users, AlertTriangle, MessageSquare, UserCheck, BarChart3, FolderOpen, Activity } from 'lucide-react';
import * as usersApi from '../../api/users.api';
import * as analyticsApi from '../../api/analytics.api';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/dashboard/StatCard.jsx';
import ChartCard from '../../components/dashboard/ChartCard.jsx';
import AreaTrendChart from '../../components/analytics/AreaTrendChart.jsx';
import DonutStatChart from '../../components/analytics/DonutStatChart.jsx';
import GroupedBarChart from '../../components/analytics/GroupedBarChart.jsx';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { formatNumber, formatRelativeTime } from '../../utils/formatters';

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

  const searchStatsQuery = useQuery({
    queryKey: ['analytics', 'search-stats', 'admin'],
    queryFn: () => analyticsApi.getSearchLogStats({ range: '30d' }),
  });

  const chatStatsQuery = useQuery({
    queryKey: ['analytics', 'chat-stats', 'admin'],
    queryFn: () => analyticsApi.getChatLogStats({ range: '30d' }),
  });

  const d = dashboardQuery.data || {};
  const search = searchStatsQuery.data || {};
  const chat = chatStatsQuery.data || {};

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
  const topTerms = search.top_terms || [];
  const zeroResultTerms = search.zero_result_terms || [];

  // Compute stale articles
  const staleArticles = d.published_articles?.filter(
    (a) => a.updated_at && new Date(a.updated_at) < new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
  ) || [];
  const staleCount = staleArticles.length;

  // Unanswered AI queries from chat stats
  const unansweredQueries = chat.unanswered_count || 0;

  // Quick actions items
  const quickActions = [
    {
      label: 'Review Pending Articles',
      link: '/admin/review-queue',
      badge: `${d.pending_review_count} waiting`,
      icon: Clock,
    },
    {
      label: 'Manage Users',
      link: '/admin/users',
      badge: `${d.total_users || 0} total users`,
      icon: UserCheck,
    },
    {
      label: 'View Analytics',
      link: '/admin/analytics',
      badge: 'Usage trends & insights',
      icon: BarChart3,
    },
    {
      label: 'Manage Categories',
      link: '/admin/categories',
      badge: `${d.total_categories || 0} categories`,
      icon: FolderOpen,
    },
    {
      label: 'Audit Logs',
      link: '/admin/audit-logs',
      badge: 'Recent system activity',
      icon: Activity,
    },
  ];

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

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} isLoading={dashboardQuery.isLoading} value={formatNumber(s.value)} />
        ))}
      </div>

      {/* Row 2: Views & Searches + Views by Category (legend below) */}
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
            <div className="flex flex-col items-center">
              <DonutStatChart
                data={categoryBreakdown}
                nameKey="name"
                valueKey="percentage"
                legendPosition="bottom"
                height={200}
              />
            </div>
          ) : (
            <p className="text-sm text-text-secondary py-10 text-center">No data yet.</p>
          )}
        </ChartCard>
      </div>

      {/* Row 3: Article Creation (smaller) + Search Analytics */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-4 mb-6">
        <ChartCard title="Article Creation" subtitle="Monthly 2025" isLoading={dashboardQuery.isLoading}>
          <div className="h-64">
            <GroupedBarChart
              data={creationTrend}
              xKey="month"
              bars={[
                { dataKey: 'created', name: 'Created', color: '#93C5FD' },
                { dataKey: 'published', name: 'Published', color: '#2563EB' },
              ]}
            />
          </div>
        </ChartCard>

        <div className="space-y-4">
          <ChartCard title="Top Search Terms" isLoading={searchStatsQuery.isLoading}>
            <div className="space-y-3">
              {topTerms.length === 0 && (
                <p className="text-sm text-text-secondary py-4 text-center">No search data yet.</p>
              )}
              {topTerms.map((t, i) => (
                <div key={t.term}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-primary">{i + 1}. {t.term}</span>
                    <span className="font-medium text-text-primary">{formatNumber(t.count)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(t.count / (topTerms[0]?.count || 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {zeroResultTerms.length > 0 && (
            <ChartCard title="Zero-result searches" subtitle="Content gaps" isLoading={searchStatsQuery.isLoading}>
              <div className="space-y-2">
                {zeroResultTerms.map((t) => (
                  <div key={t.term} className="flex items-center justify-between text-sm">
                    <span className="text-text-primary">"{t.term}"</span>
                    <span className="text-xs font-medium text-danger bg-danger-bg px-2 py-0.5 rounded-full">
                      {t.count} searches
                    </span>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}
        </div>
      </div>

      {/* Row 4: Most Viewed Articles (full width, bigger) */}
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
              className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50"
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

      {/* Row 5: Attention Required + Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        {/* Attention Required */}
        <ChartCard title="Attention Required">
          <div className="space-y-4">
            {d.pending_review_count > 0 && (
              <div className="flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-amber-500" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {d.pending_review_count} article{d.pending_review_count > 1 ? 's' : ''} pending review
                  </p>
                  <p className="text-xs text-text-secondary">Oldest submitted {formatRelativeTime(d.oldest_pending_submitted)}</p>
                </div>
              </div>
            )}
            {staleCount > 0 && (
              <div className="flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-red-500" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {staleCount} article{staleCount > 1 ? 's' : ''} near 180-day expiry
                  </p>
                  <p className="text-xs text-text-secondary">Review freshness before auto-archive</p>
                </div>
              </div>
            )}
            {unansweredQueries > 0 && (
              <div className="flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {unansweredQueries} unanswered AI assistant quer{unansweredQueries > 1 ? 'ies' : 'y'}
                  </p>
                  <p className="text-xs text-text-secondary">Consider creating articles for these gaps</p>
                </div>
              </div>
            )}
            {d.pending_review_count === 0 && staleCount === 0 && unansweredQueries === 0 && (
              <p className="text-sm text-text-secondary py-2">All clear! No immediate actions needed.</p>
            )}
          </div>
        </ChartCard>

        {/* Quick Actions */}
        <ChartCard title="Quick Actions">
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.link}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:border-primary hover:bg-primary-50/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <action.icon className="w-4 h-4 text-text-secondary" />
                  <p className="text-sm font-medium text-text-primary">{action.label}</p>
                </div>
                <span className="text-xs text-text-secondary">{action.badge}</span>
              </Link>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}