// src/pages/ArticlePage/ArticleHeader.jsx
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit3 } from "lucide-react";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { ARTICLE_TYPE_LABELS } from "../../utils/constants";

export default function ArticleHeader({ article, categoryName, canEdit }) {
  const navigate = useNavigate();
  const typeLabel = ARTICLE_TYPE_LABELS[article.type] || article.type || "Article";

  return (
    <>
      {/* Back button */}
      <button
        onClick={() => navigate("/app/knowledge-base")}
        className="flex items-center gap-1.5 text-xs hover:underline mb-6"
        style={{ color: "#696E7A" }}
      >
        <ArrowLeft size={13} /> Back to Knowledge Base
      </button>

      {/* Badges + Edit button */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <span
          className="text-xs font-medium px-2.5 py-0.5 rounded-full"
          style={{ background: "#FDEEF0", color: "#F22F46" }}
        >
          {categoryName || "Uncategorized"}
        </span>
        <span
          className="text-xs font-medium px-2.5 py-0.5 rounded-full"
          style={{ background: "#F4F4F6", color: "#696E7A" }}
        >
          {typeLabel}
        </span>
        <StatusBadge status={article.status} />
        {canEdit && (
          <button
            onClick={() => navigate(`/app/articles/${article.slug}/edit`)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border hover:bg-gray-50 transition-colors"
            style={{ borderColor: "#E1E3EA", color: "#243656" }}
          >
            <Edit3 size={12} /> Edit
          </button>
        )}
      </div>
    </>
  );
}