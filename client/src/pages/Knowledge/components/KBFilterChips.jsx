// src/pages/KnowledgeBase/components/KBFilterChips.jsx
import { X } from "lucide-react";
import { ARTICLE_TYPE_LABELS } from "../../../utils/constants.js";

export default function KBFilterChips({
    hasActiveFilters,
    activeCategoryObj,
    activeType,
    activeStatus,
    showStatusFilter,
    setFilter,
    clearFilters,
}) {
    if (!hasActiveFilters) return null;

    return (
    <div className="flex items-center flex-wrap gap-2 mb-6">
        {activeCategoryObj && (
        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: "#F4F4F6", color: "#243656" }}>
            {activeCategoryObj.name}
            <button onClick={() => setFilter("category", "")}><X size={11} /></button>
        </span>
        )}
        {activeType && (
        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: "#F4F4F6", color: "#243656" }}>
            {ARTICLE_TYPE_LABELS[activeType]}
            <button onClick={() => setFilter("type", "")}><X size={11} /></button>
        </span>
        )}
        {activeStatus && showStatusFilter && (
        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full capitalize" style={{ background: "#F4F4F6", color: "#243656" }}>
            {activeStatus}
            <button onClick={() => setFilter("status", "")}><X size={11} /></button>
        </span>
        )}
        <button onClick={clearFilters} className="text-xs font-medium hover:underline" style={{ color: "#F22F46" }}>
        Clear all
        </button>
    </div>
    );
}