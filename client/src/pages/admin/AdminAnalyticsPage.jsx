import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Eye, Search, MessageSquare, ThumbsUp, Users, TrendingDown, TrendingUp } from 'lucide-react';
import * as analyticsApi from '../../api/analytics.api';
import * as articlesApi from '../../api/articles.api';
import PageHeader from '../../components/common/PageHeader.jsx';
import ChartCard from '../../components/dashboard/ChartCard.jsx';
import GroupedBarChart from '../../components/analytics/GroupedBarChart.jsx';
import AreaTrendChart from '../../components/analytics/AreaTrendChart.jsx';
import DonutStatChart from '../../components/analytics/DonutStatChart.jsx';
import BarTrendChart from '../../components/analytics/BarTrendChart.jsx';
import Card from '../../components/ui/Card.jsx';
import { formatNumber } from '../../utils/formatters';

// Helper StatCard component
function StatCard({ icon: Icon, label, value, change, positive }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <Icon className="w-5 h-5 text-text-secondary" />
        {change && (
          <span className={`text-xs font-medium ${positive ? 'text-success' : 'text-danger'}`}>
            {positive ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-text-primary mt-2">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-text-secondary">{label}</p>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const chatStatsQuery = useQuery({ queryKey: ['analytics', 'chat-stats'], queryFn: () => analyticsApi.getChatLogStats({ range: '28d' }) });
  const searchStatsQuery = useQuery({ 
    queryKey: ['analytics', 'search-stats'], 
    queryFn: () => analyticsApi.getSearchLogStats({ range: '28d' }) 
  });
  const feedbackStatsQuery = useQuery({ 
    queryKey: ['analytics', 'feedback-stats'], 
    queryFn: () => analyticsApi.getFeedbackStats() 
  });
  const timeSeriesQuery = useQuery({ 
    queryKey: ['analytics', 'time-series'], 
    queryFn: () => analyticsApi.getTimeSeriesStats({ range: '7d' }) 
  });
  const articleTrendQuery = useQuery({ queryKey: ['articles', 'creation-trend'], queryFn: () => articlesApi.getArticleTrend() });
  const categoryViewsQuery = useQuery({ queryKey: ['analytics', 'category-views'], queryFn: () => analyticsApi.getCategoryViews() });

  const chat = chatStatsQuery.data || {};
  const search = searchStatsQuery.data || {};
  const topEditors = feedbackStatsQuery.data?.most_active_editors || [];
  const timeSeriesData = timeSeriesQuery.data || {};
  const timeSeries = timeSeriesData.results || timeSeriesData.timeSeries || [];
  const articleTrend = articleTrendQuery.data || [];
  const categoryViews = categoryViewsQuery.data || [];

  // Compute stats
  const totalViews = timeSeries.reduce((sum, d) => sum + (d.views || 0), 0);
  const uniqueSearches = search.unique_searches || 0;
  const totalConversations = chat.total_conversations || 0;
  const avgHelpfulness = chat.avg_helpfulness || 0;
  const zeroResultRate = search.zero_result_rate || 0;
  const activeContributors = feedbackStatsQuery.data?.active_contributors || 0;

  return (
    <div>
      <PageHeader title="Analytics Dashboard" description="Knowledge base performance - Last 30 days" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard icon={Eye} label="Total Article Views" value={totalViews} change="+14.2%" positive />
        <StatCard icon={Search} label="Unique Searches" value={uniqueSearches} change="+8.7%" positive />
        <StatCard icon={MessageSquare} label="AI Conversations" value={totalConversations} change="+22.1%" positive />
        <StatCard icon={ThumbsUp} label="Avg. Helpfulness" value={`${avgHelpfulness.toFixed(1)} / 5`} change="+0.2" positive />
        <StatCard icon={TrendingDown} label="Zero-Result Rate" value={`${zeroResultRate.toFixed(1)}%`} change="-0.8%" positive />
        <StatCard icon={Users} label="Active Contributors" value={activeContributors} change="+2 this month" positive />
      </div>

      {/* Article Views & Searches */}
      <ChartCard title="Articles Viewed & Searches" subtitle="Last 7 days" isLoading={timeSeriesQuery.isLoading}>
        <AreaTrendChart
          data={timeSeries}
          xKey="label"
          series={[
            { dataKey: 'views', color: '#2563EB', name: 'Views' },
            { dataKey: 'searches', color: '#10B981', name: 'Searches' },
          ]}
        />
      </ChartCard>

      {/* Two columns */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Article Creation vs Publication" subtitle="Monthly 2025" isLoading={articleTrendQuery.isLoading}>
          <GroupedBarChart
            data={articleTrend}
            xKey="month"
            bars={[
              { dataKey: 'created', name: 'Created', color: '#3B82F6' },
              { dataKey: 'published', name: 'Published', color: '#10B981' },
            ]}
          />
        </ChartCard>
        <ChartCard title="Views by Category" subtitle="Share of total views" isLoading={categoryViewsQuery.isLoading}>
          <DonutStatChart data={categoryViews} nameKey="name" valueKey="percentage" />
        </ChartCard>
      </div>

      {/* AI Assistant Usage & Search Analytics */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <ChartCard
          title="AI Assistant Usage"
          subtitle="Weekly conversations, resolutions & escalations"
          isLoading={chatStatsQuery.isLoading}
        >
          <GroupedBarChart
            data={chat.weekly || []}
            xKey="week"
            bars={[
              { dataKey: 'conversations', name: 'Conversations', color: '#C4B5FD' },
              { dataKey: 'resolved', name: 'Resolved', color: '#8B5CF6' },
              { dataKey: 'escalated', name: 'Escalated', color: '#EF4444' },
            ]}
          />
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border text-center">
            <div>
              <p className="text-xl font-bold text-purple-600">{chat.resolution_rate ?? '—'}%</p>
              <p className="text-xs text-text-secondary">Resolution Rate</p>
            </div>
            <div>
              <p className="text-xl font-bold text-danger">{chat.escalation_rate ?? '—'}%</p>
              <p className="text-xs text-text-secondary">Escalation Rate</p>
            </div>
            <div>
              <p className="text-xl font-bold text-text-primary">{chat.avg_turn_length ?? '—'}</p>
              <p className="text-xs text-text-secondary">Avg. Turn Length</p>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Search Analytics" subtitle="Top Search Terms" isLoading={searchStatsQuery.isLoading}>
          <div className="space-y-3 mb-6">
            {(search.top_terms || []).map((t, i) => {
              const max = search.top_terms?.[0]?.count || 1;
              return (
                <div key={t.term}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-primary">{i + 1}. {t.term}</span>
                    <span className="font-medium text-text-primary">{formatNumber(t.count)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(t.count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {!!search.zero_result_terms?.length && (
            <div>
              <p className="text-sm font-semibold text-danger flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4" /> Zero-result searches — content gaps
              </p>
              <div className="space-y-1.5">
                {search.zero_result_terms.map((t) => (
                  <div key={t.term} className="flex items-center justify-between text-sm">
                    <span className="text-text-primary">"{t.term}"</span>
                    <span className="text-xs font-medium text-danger bg-danger-bg px-2 py-0.5 rounded-full">
                      {t.count} searches
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Most Active Editors */}
      <ChartCard title="Most Active Editors" isLoading={feedbackStatsQuery.isLoading}>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {topEditors.map((e, i) => (
            <Card key={e.id || e.name} className="text-center">
              <span className="w-9 h-9 rounded-full bg-primary-50 text-primary font-bold flex items-center justify-center mx-auto mb-2 text-sm">
                #{i + 1}
              </span>
              <p className="text-sm font-medium text-text-primary">{e.name}</p>
              <p className="text-xl font-bold text-primary mt-1">{e.article_count}</p>
              <p className="text-xs text-text-secondary">articles</p>
            </Card>
          ))}
          {!feedbackStatsQuery.isLoading && topEditors.length === 0 && (
            <p className="col-span-full text-center text-sm text-text-secondary py-6">No editor activity yet.</p>
          )}
        </div>
      </ChartCard>
    </div>
  );
}