import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getCategoryIcon } from '../../utils/categoryIcons';

export default function CategoryCard({ category }) {
  const Icon = getCategoryIcon(category.icon || category.slug);
  return (
    <Link
      to={`/categories/${category.slug}`}
      className="flex items-start gap-3.5 bg-white border border-border rounded-card p-5 hover:border-primary hover:shadow-card transition-all group"
    >
      <span
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${category.color || '#2563EB'}1A`, color: category.color || '#2563EB' }}
      >
        <Icon className="w-5 h-5" />
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-text-primary mb-0.5">{category.name}</h3>
        <p className="text-sm text-text-secondary line-clamp-1">{category.description}</p>
        <p className="text-xs text-text-secondary mt-1.5">{category.article_count ?? 0} articles</p>
      </div>
      <ChevronRight className="w-4 h-4 text-text-secondary group-hover:text-primary shrink-0 mt-1" />
    </Link>
  );
}
