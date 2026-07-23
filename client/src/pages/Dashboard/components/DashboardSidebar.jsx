// src/pages/Dashboard/components/DashboardSidebar.jsx
import { Link, useNavigate } from "react-router-dom";
import { Search, BookMarked } from "lucide-react";
import EmptyState from "../../../components/common/EmptyState.jsx";
import { CATEGORY_CONFIG } from "../../../utils/categoryConfig.js";

export default function DashboardSidebar({ categories, topSearches }) {
    const navigate = useNavigate();

    return (
    <div className="space-y-6">
        {/* Categories */}
        <div>
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "#121C2D" }}>Categories</h2>
            <Link to="/app/knowledge-base" className="text-xs font-medium hover:underline" style={{ color: "#F22F46" }}>
            Browse all
            </Link>
        </div>
        {categories.length === 0 ? (
            <EmptyState icon={BookMarked} title="No categories" description="Categories will appear here." />
        ) : (
            <div className="bg-white rounded-lg border divide-y" style={{ borderColor: "#E1E3EA" }}>
            {categories.slice(0, 6).map((cat) => {
                const config = CATEGORY_CONFIG[cat.name];
                const Icon = config?.icon || BookMarked;
                const color = config?.color || "#696E7A";
                const bg = config?.bg || "#F4F4F6";
                const count = cat.article_count || 0;
                return (
                <button
                    key={cat.id}
                    onClick={() => navigate(`/app/knowledge-base?category=${cat.id}`)}
                    className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                    <div className="flex items-center gap-3">
                    <div
                        className="flex items-center justify-center rounded-full"
                        style={{ width: 28, height: 28, background: bg }}
                    >
                        <Icon size={14} style={{ color }} />
                    </div>
                    <span className="text-sm" style={{ color: "#121C2D" }}>{cat.name}</span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: "#696E7A" }}>{count}</span>
                </button>
                );
            })}
            </div>
        )}
        </div>

        {/* Top Searches */}
        <div>
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "#121C2D" }}>Top Searches</h2>
        </div>
        {topSearches.length === 0 ? (
            <EmptyState icon={Search} title="No searches yet" description="Search terms will appear here." />
        ) : (
            <div className="bg-white rounded-lg border divide-y" style={{ borderColor: "#E1E3EA" }}>
            {topSearches.map((item) => (
                <div key={item.term} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium" style={{ color: "#9EA6B3", width: 20 }}>
                    {String(item.rank).padStart(2, '0')}
                    </span>
                    <span className="text-sm" style={{ color: "#121C2D" }}>{item.term}</span>
                </div>
                <span className="text-sm font-medium" style={{ color: "#696E7A" }}>{item.count}</span>
                </div>
            ))}
            </div>
        )}
        </div>
    </div>
    );
}