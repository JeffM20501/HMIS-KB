import { useNavigate } from "react-router-dom";
import { FileText, Eye } from "lucide-react";
import StatusBadge from "../common/StatusBadge.jsx";

export default function ArticleRow({ article }) {
  const navigate = useNavigate();
  return (
    <tr
      className="border-t hover:bg-gray-50 cursor-pointer transition-colors"
      style={{ borderColor: "#F4F4F6" }}
      onClick={() => navigate(`/app/knowledge-base/${article.slug ?? article.id}`)}
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <FileText size={14} style={{ color: "#9EA6B3", flexShrink: 0 }} />
          <span className="text-sm font-medium" style={{ color: "#121C2D" }}>{article.title}</span>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-xs" style={{ color: "#696E7A" }}>{article.categoryName}</span>
      </td>
      <td className="px-5 py-3.5"><StatusBadge status={article.status} /></td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1 text-xs" style={{ color: "#696E7A" }}>
          <Eye size={11} /> {(article.views ?? 0).toLocaleString()}
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-xs" style={{ color: "#9EA6B3" }}>{article.lastUpdated}</span>
      </td>
    </tr>
  );
}
