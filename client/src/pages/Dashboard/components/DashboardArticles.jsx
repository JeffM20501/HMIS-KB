// src/pages/Dashboard/components/DashboardArticles.jsx
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import EmptyState from "../../../components/common/EmptyState.jsx";
import { formatDate } from "../utils.js";

export default function DashboardArticles({
    articles,
    viewMode,
    setViewMode,
    categoryMap,
}) {
    const navigate = useNavigate();

    return (
    <div>
        <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold" style={{ color: "#121C2D" }}>Articles</h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
            <button
            onClick={() => setViewMode("views")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === "views" ? "bg-white shadow-sm" : "hover:bg-gray-200"
            }`}
            style={{ color: viewMode === "views" ? "#121C2D" : "#696E7A" }}
            >
            Most Viewed
            </button>
            <button
            onClick={() => setViewMode("recent")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === "recent" ? "bg-white shadow-sm" : "hover:bg-gray-200"
            }`}
            style={{ color: viewMode === "recent" ? "#121C2D" : "#696E7A" }}
            >
            Recent
            </button>
        </div>
        </div>

        {articles.length === 0 ? (
        <EmptyState icon={FileText} title="No articles yet" description="Published articles will appear here." />
        ) : (
        <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: "#E1E3EA" }}>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead style={{ background: "#F9FAFB", color: "#696E7A" }}>
                <tr>
                    <th className="px-5 py-3 text-left font-medium">Article</th>
                    <th className="px-5 py-3 text-left font-medium">Category</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium">Views</th>
                    <th className="px-5 py-3 text-left font-medium">Updated</th>
                </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "#E8E8EC" }}>
                {articles.map((a) => (
                    <tr
                    key={a.id}
                    onClick={() => navigate(`/app/knowledge-base/${a.slug}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                    <td className="px-5 py-3.5 font-medium" style={{ color: "#121C2D" }}>{a.title}</td>
                    <td className="px-5 py-3.5" style={{ color: "#696E7A" }}>
                        {categoryMap[a.category] || "Uncategorized"}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-3.5" style={{ color: "#696E7A" }}>{a.views || 0}</td>
                    <td className="px-5 py-3.5" style={{ color: "#696E7A" }}>{formatDate(a.updated_at)}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
        )}
    </div>
    );
}