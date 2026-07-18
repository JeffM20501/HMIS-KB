// src/components/articles/ArticleCard.jsx
import { useNavigate } from "react-router-dom";
import { Eye, Star, Calendar } from "lucide-react";
import StatusBadge from "../common/StatusBadge.jsx";
import { ARTICLE_TYPE_LABELS } from "../../utils/constants";

// Helper: strip HTML tags for preview
function stripHtml(html) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

export default function ArticleCard({ article, category, tagMap }) {
  const navigate = useNavigate();

  // Preview: first 120 characters of plain text
  const preview = article.content ? stripHtml(article.content).slice(0, 120) : "";
  const tags = article.tags || [];
  const views = article.views || 0;
  const rating = article.rating || 0;
  const ratingCount = article.ratingCount || 0;
  const date = article.published_at || article.updated_at;
  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "";

  const categoryName = category?.name || "Uncategorized";
  const typeLabel = ARTICLE_TYPE_LABELS[article.article_type] || article.type || "Article";

  // Resolve tag names
  const tagNames = tags.map(tag => {
    if (typeof tag === 'object') return tag.name;
    return tagMap?.[tag] || `Tag ${tag}`;
  });

  return (
    <div
      className="bg-white rounded-lg border p-5 hover:shadow-md transition-shadow cursor-pointer"
      style={{ borderColor: "#E1E3EA" }}
      onClick={() => navigate(`/app/knowledge-base/${article.slug}`)}
    >
      {/* Top row: Category, Type, Status */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span
          className="text-xs font-medium px-2.5 py-0.5 rounded-full"
          style={{ background: "#FDEEF0", color: "#F22F46" }}
        >
          {categoryName}
        </span>
        <span
          className="text-xs font-medium px-2.5 py-0.5 rounded-full"
          style={{ background: "#F4F4F6", color: "#696E7A" }}
        >
          {typeLabel}
        </span>
        <StatusBadge status={article.status} />
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold mb-2 leading-snug" style={{ color: "#121C2D" }}>
        {article.title}
      </h3>

      {/* Content preview */}
      {preview && (
        <p className="text-sm mb-3" style={{ color: "#696E7A" }}>
          {preview}…
        </p>
      )}

      {/* Tags */}
      {tagNames.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {tagNames.slice(0, 3).map((name) => (
            <span
              key={name}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "#F4F4F6", color: "#696E7A" }}
            >
              {name}
            </span>
          ))}
          {tagNames.length > 3 && (
            <span className="text-xs" style={{ color: "#9EA6B3" }}>
              +{tagNames.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Bottom row: views, rating, date */}
      <div className="flex items-center justify-between text-xs" style={{ color: "#9EA6B3" }}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {views.toLocaleString()}
          </span>
          {rating > 0 && (
            <span className="flex items-center gap-1">
              <Star size={12} style={{ color: "#F7C948", fill: "#F7C948" }} />
              {rating.toFixed(1)} ({ratingCount})
            </span>
          )}
        </div>
        {formattedDate && (
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {formattedDate}
          </span>
        )}
      </div>
    </div>
  );
}