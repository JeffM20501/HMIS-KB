import { useNavigate } from "react-router-dom";
import { Eye, Star, Clock, ChevronRight } from "lucide-react";
import StatusBadge from "../common/StatusBadge.jsx";
import { ARTICLE_TYPE_SHORT_LABELS } from "../../utils/constants";

export default function ArticleCard({ article, category }) {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white rounded-lg border cursor-pointer hover:border-red-300 transition-all group"
      style={{ borderColor: "#E1E3EA" }}
      onClick={() => navigate(`/app/knowledge-base/${article.slug ?? article.id}`)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${category?.color ?? "#F22F46"}14`, color: category?.color ?? "#F22F46" }}>
              {ARTICLE_TYPE_SHORT_LABELS[article.type] ?? article.type}
            </span>
            <StatusBadge status={article.status} />
          </div>
          <ChevronRight size={15} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#F22F46" }} />
        </div>

        <h3 className="text-sm font-semibold mb-2 leading-snug group-hover:text-red-600 transition-colors" style={{ color: "#121C2D" }}>
          {article.title}
        </h3>

        <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: "#696E7A" }}>
          {article.excerpt}
        </p>

        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {article.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded" style={{ background: "#F4F4F6", color: "#696E7A" }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "#F4F4F6" }}>
        <div className="flex items-center gap-3 text-xs" style={{ color: "#9EA6B3" }}>
          <span className="flex items-center gap-1"><Eye size={11} /> {(article.views ?? 0).toLocaleString()}</span>
          {article.ratingCount > 0 && (
            <span className="flex items-center gap-1"><Star size={11} style={{ color: "#F7C948" }} /> {article.rating?.toFixed(1)}</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: "#9EA6B3" }}>
          <Clock size={11} /> {article.lastUpdated}
        </div>
      </div>
    </div>
  );
}