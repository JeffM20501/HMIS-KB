import { FileText, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SourceCitationCard({ source }) {
  const confidencePct = typeof source.confidence === 'number' ? Math.round(source.confidence * 100) : null;

  return (
    <Link
      to={`/articles/${source.article_slug || source.slug}`}
      target="_blank"
      className="flex items-start gap-2.5 border border-gray-200 rounded-lg px-3 py-2 hover:border-primary hover:bg-primary/5 transition-colors group"
    >
      <FileText className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-700 truncate">{source.title}</p>
        {confidencePct !== null && <p className="text-[11px] text-gray-500">{confidencePct}% confidence</p>}
      </div>
      <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary shrink-0 mt-0.5" />
    </Link>
  );
}