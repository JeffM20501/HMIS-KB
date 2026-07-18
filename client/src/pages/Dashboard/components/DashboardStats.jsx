// src/pages/Dashboard/components/DashboardStats.jsx
import StatCard from "../../../components/common/StatCard.jsx";
import { BookOpen, TrendingUp, Star, AlertCircle } from "lucide-react";

export default function DashboardStats({ stats, isAdmin }) {
    return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
        icon={BookOpen}
        label="Published Articles"
        value={stats.publishedCount}
        color="#0263E0"
        badge={`${stats.draftsCount} drafts · ${stats.inReviewCount} in review`}
        />
        <StatCard
        icon={TrendingUp}
        label="Search Success Rate"
        value={stats.searchSuccessRate ? `${stats.searchSuccessRate}%` : "—"}
        color="#7B2FBE"
        badge="Of all searches"
        />
        <StatCard
        icon={Star}
        label="Avg Rating"
        value={stats.avgRating ? `${stats.avgRating.toFixed(1)}/5` : "—"}
        color="#F7C948"
        badge="Across all published articles"
        />
        {isAdmin ? (
        <StatCard
            icon={AlertCircle}
            label="Needs Review"
            value={stats.needsReviewCount}
            color="#E87722"
            badge="Not reviewed in 180+ days"
        />
        ) : (
        <div className="hidden lg:block" /> // placeholder to maintain 4 columns
        )}
    </div>
    );
}