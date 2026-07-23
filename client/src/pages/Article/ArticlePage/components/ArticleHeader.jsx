import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit3, Trash2 } from "lucide-react";
import StatusBadge from "../../../../components/common/StatusBadge.jsx";
import { ARTICLE_TYPE_CONFIG } from "../../../../utils/constants.js";

export default function ArticleHeader({
    article,
    categoryName,
    canEdit,
    onDelete,
    showDeleteButton,
}) {
    const navigate = useNavigate();
    const typeConfig = ARTICLE_TYPE_CONFIG[article.article_type] || ARTICLE_TYPE_CONFIG.how_to;

    return (
    <>
        <button
        onClick={() => navigate("/app/knowledge-base")}
        className="flex items-center gap-1.5 text-xs hover:underline mb-6"
        style={{ color: "#696E7A" }}
        >
        <ArrowLeft size={13} /> Back to Knowledge Base
        </button>

        <div className="flex items-center gap-2 flex-wrap mb-4">
        <span
            className="text-xs font-medium px-2.5 py-0.5 rounded-full"
            style={{ background: "#FDEEF0", color: "#F22F46" }}
        >
            {categoryName || "Uncategorized"}
        </span>
        {/* ✅ Type badge with config colors */}
        <span
            className="text-xs font-medium px-2.5 py-0.5 rounded-full"
            style={{ background: typeConfig.bg, color: typeConfig.color }}
        >
            {typeConfig.label}
        </span>
        <StatusBadge status={article.status} />
        <div className="ml-auto flex items-center gap-2">
            {canEdit && (
            <button
                onClick={() => navigate(`/app/articles/${article.slug}/edit`)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border hover:bg-gray-50 transition-colors"
                style={{ borderColor: "#E1E3EA", color: "#243656" }}
            >
                <Edit3 size={12} /> Edit
            </button>
            )}
            {showDeleteButton && (
            <button
                onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border hover:bg-red-50 transition-colors"
                style={{ borderColor: "#FDEEF0", color: "#F22F46" }}
            >
                <Trash2 size={12} /> Delete
            </button>
            )}
        </div>
        </div>

        <h1 className="text-2xl lg:text-3xl font-semibold mb-4 leading-snug" style={{ color: "#121C2D" }}>
        {article.title}
        </h1>
    </>
    );
}