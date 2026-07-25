import { Link } from 'react-router-dom';
import { Clock, Eye, ThumbsUp } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import { formatDate } from '../../utils/formatters';

export default function ArticleCard({ article }) {
  return (
    <Link
      to={`/articles/${article.slug}`}
      className="block bg-white border border-border rounded-card p-5 hover:border-primary hover:shadow-card transition-all"
    >
      <div className="flex items-center gap-2 mb-2.5">
        {article.category && (
          <Badge tone="blue">{article.category.name || article.category}</Badge>
        )}
        {article.product_version && <span className="text-xs text-text-secondary">v{article.product_version}</span>}
      </div>
      <h3 className="font-semibold text-text-primary mb-1.5 leading-snug">{article.title}</h3>
      {article.summary && <p className="text-sm text-text-secondary line-clamp-2 mb-3">{article.summary}</p>}
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> {article.reading_time || 5} min read
        </span>
        {typeof article.views === 'number' && (
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> {article.views.toLocaleString()}
          </span>
        )}
        {article.rating && (
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5" /> {article.rating}
          </span>
        )}
        <span className="ml-auto">{formatDate(article.updated_at)}</span>
      </div>
    </Link>
  );
}
