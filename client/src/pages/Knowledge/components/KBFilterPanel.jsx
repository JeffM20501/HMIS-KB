import { ARTICLE_TYPE_LABELS } from "../../../utils/constants.js";

export default function KBFilterPanel({
    showFilters,
    categories,
    activeCategory,
    activeType,
    activeStatus,
    showStatusFilter,
    setFilter,
}) {
    if (!showFilters) return null;

    return (
    <div className="bg-white rounded-lg border p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ borderColor: "#E1E3EA" }}>
        <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "#696E7A" }}>Category</label>
        <select
            value={activeCategory}
            onChange={(e) => setFilter("category", e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border outline-none"
            style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
        >
            <option value="">All categories</option>
            {categories.map((c) => (
            <option key={c.id ?? c.slug} value={c.id ?? c.slug}>{c.name}</option>
            ))}
        </select>
        </div>
        <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "#696E7A" }}>Content type</label>
        <select
            value={activeType}
            onChange={(e) => setFilter("type", e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border outline-none"
            style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
        >
            <option value="">All types</option>
            {Object.entries(ARTICLE_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
            ))}
        </select>
        </div>
        {showStatusFilter && (
        <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#696E7A" }}>Status</label>
            <select
            value={activeStatus}
            onChange={(e) => setFilter("status", e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border outline-none"
            style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            >
            <option value="">All (except drafts)</option>
            <option value="published">Published</option>
            <option value="pending_review">Pending Review</option>
            <option value="archived">Archived</option>
            </select>
        </div>
        )}
    </div>
    );
}