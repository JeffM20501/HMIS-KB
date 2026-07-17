// src/pages/Admin/OverviewTab.jsx
import { useMemo } from "react";
import { BarChart3, Star, AlertTriangle, CheckCircle2, RefreshCw, Clock, ArrowUpRight } from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
import StatCard from "./StatCard";

const CHART_COLORS = {
  views: "#F22F46",
  viewsFill: "rgba(242, 47, 70, 0.15)",
  searches: "#0263E0",
  searchesFill: "rgba(2, 99, 224, 0.1)",
  bar: "#F4818C",
};

export default function OverviewTab({
    articles,
    categories,
    analytics,
    totalViews,
    publishedArticles,
    pendingReview,
    draftCount,
    staleArticles,
    totalNonDraft,
    setActiveTab,
    }) {
    const timeSeries = analytics?.timeSeries ?? [];
    const ratingDist = analytics?.ratingDistribution ?? [];

    // Category view stats
    const categoryViewStats = useMemo(() => {
    const byCategory = {};
    articles.forEach((a) => {
        const catId = a.category?.id ?? a.category;
        if (catId == null) return;
        byCategory[catId] = (byCategory[catId] ?? 0) + (a.views ?? 0);
    });
    return categories
        .map((c) => ({
        name: c.name?.split(" ")[0] ?? c.name,
        views: byCategory[c.id] ?? 0,
        }))
        .filter((c) => c.views > 0)
        .sort((a, b) => b.views - a.views);
    }, [categories, articles]);

    // Chart data
    const activityChartData = {
    labels: timeSeries.map((d) => d.date || ""),
    datasets: [
        {
        label: "Views",
        data: timeSeries.map((d) => d.views || 0),
        borderColor: CHART_COLORS.views,
        backgroundColor: CHART_COLORS.viewsFill,
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointBackgroundColor: CHART_COLORS.views,
        borderWidth: 2,
        },
        {
        label: "Searches",
        data: timeSeries.map((d) => d.searches || 0),
        borderColor: CHART_COLORS.searches,
        backgroundColor: CHART_COLORS.searchesFill,
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointBackgroundColor: CHART_COLORS.searches,
        borderWidth: 2,
        borderDash: [5, 5],
        },
    ],
    };

    const activityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
        position: "top",
        align: "end",
        labels: { boxWidth: 12, padding: 16, font: { size: 11 }, color: "#696E7A" },
        },
        tooltip: {
        backgroundColor: "white",
        titleColor: "#121C2D",
        bodyColor: "#696E7A",
        borderColor: "#E1E3EA",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        font: { size: 12 },
        },
    },
    scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: "#9EA6B3", maxTicksLimit: 8 } },
        y: { grid: { color: "#F4F4F6", drawBorder: false }, ticks: { font: { size: 10 }, color: "#9EA6B3" }, beginAtZero: true },
    },
    interaction: { intersect: false, mode: "index" },
    };

    const categoryChartData = {
    labels: categoryViewStats.map((c) => c.name),
    datasets: [
        {
        label: "Views",
        data: categoryViewStats.map((c) => c.views),
        backgroundColor: CHART_COLORS.bar,
        borderRadius: 4,
        borderSkipped: false,
        },
    ],
    };

    const categoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
        backgroundColor: "white",
        titleColor: "#121C2D",
        bodyColor: "#696E7A",
        borderColor: "#E1E3EA",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        font: { size: 12 },
        callbacks: { label: (ctx) => `${ctx.parsed.y.toLocaleString()} views` },
        },
    },
    scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: "#9EA6B3", maxRotation: 30 } },
        y: { grid: { color: "#F4F4F6", drawBorder: false }, ticks: { font: { size: 10 }, color: "#9EA6B3" }, beginAtZero: true },
    },
    };

    return (
    <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
            label="Total Views (30d)"
            value={totalViews.toLocaleString()}
            sub="All articles"
            badgePct={analytics?.viewsChangePct}
            color="#F22F46"
            sparkline={timeSeries.slice(-14)}
            sparklineKey="views"
        />
        <StatCard
            label="Searches (30d)"
            value={(analytics?.totalSearches ?? 0).toLocaleString()}
            sub="Full-text queries"
            badgePct={analytics?.searchesChangePct}
            color="#0263E0"
            sparkline={timeSeries.slice(-14)}
            sparklineKey="searches"
        />
        <StatCard
            label="Avg Rating"
            value={analytics?.avgRating ? `${analytics.avgRating.toFixed(1)}/5` : "—"}
            sub={`Across ${analytics?.ratingCount ?? 0} ratings`}
            color="#F7C948"
        />
        <StatCard
            label="Articles"
            value={totalNonDraft}
            sub={`${publishedArticles.length} published · ${pendingReview.length + draftCount} drafts/review`}
            color="#00A368"
        />
        </div>

        {/* Activity + Rating */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="bg-white rounded-lg border p-5" style={{ borderColor: "#E1E3EA" }}>
            <div className="flex items-center justify-between mb-1">
            <div>
                <p className="text-sm font-semibold" style={{ color: "#121C2D" }}>Activity — Last 30 Days</p>
                <p className="text-xs" style={{ color: "#9EA6B3" }}>Daily searches and article views</p>
            </div>
            </div>
            <div className="h-[260px]">
            <Line data={activityChartData} options={activityChartOptions} />
            </div>
        </div>

        <div className="bg-white rounded-lg border p-5" style={{ borderColor: "#E1E3EA" }}>
            <p className="text-sm font-semibold" style={{ color: "#121C2D" }}>Rating Distribution</p>
            <p className="text-xs mb-4" style={{ color: "#9EA6B3" }}>From {analytics?.ratingCount ?? 0} article ratings</p>
            <div className="space-y-2.5">
            {ratingDist.map((r) => {
                const total = ratingDist.reduce((s, x) => s + x.count, 0) || 1;
                return (
                <div key={r.stars} className="flex items-center gap-3">
                    <span className="text-xs w-8" style={{ color: "#696E7A" }}>{r.stars}</span>
                    <div className="flex-1 h-2 rounded-full" style={{ background: "#F4F4F6" }}>
                    <div className="h-2 rounded-full" style={{ width: `${(r.count / total) * 100}%`, background: r.color }} />
                    </div>
                    <span className="text-xs w-6 text-right" style={{ color: "#9EA6B3" }}>{r.count}</span>
                </div>
                );
            })}
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: "#F4F4F6" }}>
            <span className="text-xs font-medium" style={{ color: "#696E7A" }}>Average</span>
            <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: "#121C2D" }}>
                <Star size={13} style={{ color: "#F7C948", fill: "#F7C948" }} />
                {analytics?.avgRating ? analytics.avgRating.toFixed(1) : "—"}
            </span>
            </div>
        </div>
        </div>

        {/* Category bar chart */}
        {categoryViewStats.length > 0 && (
        <div className="bg-white rounded-lg border p-5" style={{ borderColor: "#E1E3EA" }}>
            <div className="flex items-center justify-between mb-4">
            <div>
                <p className="text-sm font-semibold" style={{ color: "#121C2D" }}>Articles &amp; Views by Category</p>
                <p className="text-xs" style={{ color: "#9EA6B3" }}>All-time article view counts per category</p>
            </div>
            <BarChart3 size={16} style={{ color: "#D1D5DB" }} />
            </div>
            <div className="h-[220px]">
            <Bar data={categoryChartData} options={categoryChartOptions} />
            </div>
        </div>
        )}

        {/* Content Health + Pending Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-5" style={{ borderColor: "#E1E3EA" }}>
            <p className="text-sm font-semibold mb-4" style={{ color: "#121C2D" }}>Content Health</p>
            <div className="space-y-4">
            {[
                { label: "Published", count: publishedArticles.length, color: "#00A368" },
                { label: "In Review", count: pendingReview.length, color: "#0263E0" },
                { label: "Drafts", count: draftCount, color: "#9EA6B3" },
                { label: "Needs Re-review", count: staleArticles.length, color: "#E87722" },
            ].map((row) => {
                const scale = totalNonDraft + draftCount || 1;
                const width = Math.min(100, Math.round((row.count / scale) * 100));
                return (
                <div key={row.label}>
                    <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium" style={{ color: "#455A77" }}>{row.label}</span>
                    <span className="text-xs font-semibold" style={{ color: "#121C2D" }}>{row.count}</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "#F4F4F6" }}>
                    <div className="h-2 rounded-full" style={{ width: `${width}%`, background: row.color }} />
                    </div>
                </div>
                );
            })}
            </div>
        </div>

        <div className="bg-white rounded-lg border p-5" style={{ borderColor: "#E1E3EA" }}>
            <p className="text-sm font-semibold mb-4" style={{ color: "#121C2D" }}>Pending Actions</p>
            <div className="divide-y" style={{ borderColor: "#F4F4F6" }}>
            {staleArticles.length > 0 && (
                <div className="flex items-center gap-3 py-3 first:pt-0">
                <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, background: "#FEF3E7" }}>
                    <AlertTriangle size={15} style={{ color: "#E87722" }} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "#121C2D" }}>
                    {staleArticles.length} article{staleArticles.length === 1 ? "" : "s"} need re-review
                    </p>
                    <p className="text-xs" style={{ color: "#9EA6B3" }}>Not reviewed in 180+ days</p>
                </div>
                <button
                    onClick={() => setActiveTab("articles")}
                    className="flex items-center gap-1 text-xs font-medium hover:underline flex-shrink-0"
                    style={{ color: "#E87722" }}
                >
                    View <ArrowUpRight size={12} />
                </button>
                </div>
            )}

            {pendingReview.length > 0 && (
                <div className="flex items-center gap-3 py-3 first:pt-0">
                <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, background: "#E8F0FD" }}>
                    <RefreshCw size={15} style={{ color: "#0263E0" }} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "#121C2D" }}>
                    {pendingReview.length} article{pendingReview.length === 1 ? "" : "s"} awaiting review
                    </p>
                    <p className="text-xs" style={{ color: "#9EA6B3" }}>Submitted by editors</p>
                </div>
                <button
                    onClick={() => setActiveTab("articles")}
                    className="flex items-center gap-1 text-xs font-medium hover:underline flex-shrink-0"
                    style={{ color: "#0263E0" }}
                >
                    View <ArrowUpRight size={12} />
                </button>
                </div>
            )}

            {staleArticles.length === 0 && pendingReview.length === 0 && (
                <div className="flex items-center gap-3 py-3 first:pt-0">
                <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, background: "#E6F7F1" }}>
                    <CheckCircle2 size={15} style={{ color: "#00A368" }} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "#121C2D" }}>All critical articles current</p>
                    <p className="text-xs" style={{ color: "#9EA6B3" }}>No pending reviews, nothing overdue</p>
                </div>
                </div>
            )}

            {(staleArticles.length > 0 || pendingReview.length > 0) && (
                <div className="flex items-center gap-3 py-3">
                <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, background: "#F4F4F6" }}>
                    <Clock size={15} style={{ color: "#9EA6B3" }} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "#121C2D" }}>{draftCount} draft{draftCount === 1 ? "" : "s"} in progress</p>
                    <p className="text-xs" style={{ color: "#9EA6B3" }}>Not yet submitted by editors</p>
                </div>
                </div>
            )}
            </div>
        </div>
        </div>
    </div>
    );
}