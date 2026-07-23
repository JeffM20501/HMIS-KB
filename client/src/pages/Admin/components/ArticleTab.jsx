// src/pages/Admin/ArticlesTab.jsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, Trash2, Star, Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import StatusBadge from "../../../components/common/StatusBadge";

export default function ArticlesTab({
    articles,
    pendingReview,
    categoryMap,
    userMap,
    busyId,
    onPublish,
    onReject,
    onDelete,
    }) {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");

    const filtered = useMemo(
    () => articles
        .filter((a) => a.status !== "draft")
        .filter((a) => a.title.toLowerCase().includes(search.toLowerCase())),
    [articles, search]
    );

    return (
    <div>
        {pendingReview.length > 0 && (
        <div className="mb-5 bg-white rounded-lg border p-4" style={{ borderColor: "#FEF9E7", background: "#FFFDF5" }}>
            <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#C9A000" }}>
            <AlertTriangle size={14} /> {pendingReview.length} article{pendingReview.length === 1 ? "" : "s"} awaiting your review
            </p>
            <div className="space-y-2">
            {pendingReview.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 bg-white rounded-md border px-4 py-2.5" style={{ borderColor: "#E1E3EA" }}>
                <button onClick={() => navigate(`/app/knowledge-base/${a.slug ?? a.id}`)} className="text-sm font-medium hover:underline text-left flex-1 truncate" style={{ color: "#121C2D" }}>
                    {a.title}
                </button>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                    onClick={() => onPublish(a)}
                    disabled={busyId === a.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-opacity disabled:opacity-50"
                    style={{ background: "#00A368", color: "white" }}
                    >
                    {busyId === a.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Publish
                    </button>
                    <button
                    onClick={() => onReject(a)}
                    disabled={busyId === a.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border disabled:opacity-50"
                    style={{ borderColor: "#E1E3EA", color: "#696E7A" }}
                    >
                    <XCircle size={12} /> Send back
                    </button>
                </div>
                </div>
            ))}
            </div>
        </div>
        )}

        <div className="relative max-w-sm mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9EA6B3" }} />
        <input
            type="text"
            placeholder="Search articles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border outline-none"
            style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
        />
        </div>

        <div className="bg-white rounded-lg border overflow-hidden overflow-x-auto" style={{ borderColor: "#E1E3EA" }}>
        <table className="w-full">
            <thead>
            <tr style={{ background: "#FAFAFA" }}>
                {["Title", "Category", "Author", "Status", "Views", "Rating", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: "#9EA6B3" }}>{h}</th>
                ))}
            </tr>
            </thead>
            <tbody>
            {filtered.map((a) => (
                <tr key={a.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F4F4F6" }}>
                <td className="px-5 py-3.5">
                    <button onClick={() => navigate(`/app/knowledge-base/${a.slug ?? a.id}`)} className="text-sm font-medium text-left hover:underline" style={{ color: "#121C2D" }}>
                    {a.title}
                    </button>
                </td>
                <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#696E7A" }}>
                    {categoryMap[a.category]?.name || a.category || "—"}
                </td>
                <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#696E7A" }}>
                    {a.author_username || userMap[a.author]?.name || a.author || "Unknown"}
                </td>
                <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                <td className="px-5 py-3.5 text-xs tabular-nums" style={{ color: "#696E7A" }}>{(a.views ?? 0).toLocaleString()}</td>
                <td className="px-5 py-3.5">
                    {a.ratingCount > 0 ? (
                    <span className="flex items-center gap-1 text-xs whitespace-nowrap"><Star size={11} style={{ color: "#F7C948" }} /> {a.rating.toFixed(1)}</span>
                    ) : <span className="text-xs" style={{ color: "#D1D5DB" }}>—</span>}
                </td>
                <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/app/articles/${a.id}/edit`)} className="p-1 rounded hover:bg-gray-100 transition-colors" title="Edit">
                        <FileText size={13} style={{ color: "#696E7A" }} />
                    </button>
                    <button onClick={() => onDelete(a)} disabled={busyId === a.id} className="p-1 rounded hover:bg-red-50 transition-colors" title="Archive">
                        <Trash2 size={13} style={{ color: "#9EA6B3" }} />
                    </button>
                    </div>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    </div>
    );
}