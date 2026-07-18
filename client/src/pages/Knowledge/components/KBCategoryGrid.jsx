// src/pages/KnowledgeBase/components/KBCategoryGrid.jsx
import { BookOpen } from "lucide-react";
import { CATEGORY_CONFIG } from "../../../utils/categoryConfig.js";

export default function KBCategoryGrid({
    categories,
    filteredArticles,
    hasActiveFilters,
    setFilter,
}) {
    if (categories.length === 0 || hasActiveFilters) return null;

    return (
    <div className="mb-10">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "#121C2D" }}>Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {categories.slice(0, 8).map((cat) => {
            const config = CATEGORY_CONFIG[cat.name];
            const Icon = config?.icon || BookOpen;
            const color = config?.color || "#696E7A";
            const bg = config?.bg || "#F4F4F6";
            const visibleInCat = filteredArticles.filter(a => String(a.category) === String(cat.id));
            const count = visibleInCat.length;

            return (
            <button
                key={cat.id}
                onClick={() => setFilter("category", cat.id)}
                className="flex flex-col items-center p-4 rounded-lg border hover:border-red-300 transition-colors text-center bg-white"
                style={{ borderColor: "#E1E3EA" }}
            >
                <div
                className="flex items-center justify-center rounded-full mb-3"
                style={{ width: 48, height: 48, background: bg }}
                >
                <Icon size={24} style={{ color }} strokeWidth={1.8} />
                </div>
                <span className="text-sm font-medium" style={{ color: "#121C2D" }}>{cat.name}</span>
                <span className="text-xs" style={{ color: "#9EA6B3" }}>{count} articles</span>
            </button>
            );
        })}
        </div>
    </div>
    );
}