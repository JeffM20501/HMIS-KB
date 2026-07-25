import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Clock, Calendar, Tag as TagIcon } from 'lucide-react';
import * as articlesApi from '../../api/articles.api';
import * as analyticsApi from '../../api/analytics.api';
import ArticleCard from '../../components/article/ArticleCard.jsx';
import TableOfContents from '../../components/article/TableOfContents.jsx';
import FeedbackWidget from '../../components/article/FeedbackWidget.jsx';
import MarkdownRenderer from '../../components/article/MarkdownRenderer.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { FileQuestion } from 'lucide-react';
import { formatDate, estimateReadingTime } from '../../utils/formatters';
import { extractHeadings } from '../../utils/headings';

export default function ArticlePage() {
  const { slug } = useParams();

  const articleQuery = useQuery({
    queryKey: ['article', slug],
    queryFn: () => articlesApi.getArticle(slug),
  });

  const article = articleQuery.data;

  useEffect(() => {
    if (article?.id) {
      analyticsApi.logArticleView(article.id).catch(() => {});
    }
  }, [article?.id]);

  const relatedQuery = useQuery({
    queryKey: ['articles', 'related', article?.category?.slug],
    queryFn: () =>
      articlesApi.listArticles({ category: article.category?.slug, status: 'published', page_size: 3 }),
    enabled: !!article?.category?.slug,
  });

  // Same slug algorithm rehype-slug uses in MarkdownRenderer, so these
  // TOC ids always match the ids actually rendered on the headings below.
  const headings = useMemo(() => extractHeadings(article?.content || ''), [article?.content]);

  if (articleQuery.isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Skeleton className="h-4 w-48 mb-6" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (articleQuery.isError) {
    return <ErrorState message="Couldn't load this article." onRetry={articleQuery.refetch} />;
  }

  if (!article) {
    return (
      <EmptyState icon={FileQuestion} title="Article not found" description="This article may have been moved or archived." />
    );
  }

  const related = (relatedQuery.data?.results || relatedQuery.data || []).filter((a) => a.slug !== slug).slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center gap-1.5 text-sm text-text-secondary mb-6 flex-wrap">
        <Link to="/" className="hover:text-primary">
          Home
        </Link>
        {article.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to={`/categories/${article.category.slug}`} className="hover:text-primary">
              {article.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-text-primary font-medium truncate max-w-xs">{article.title}</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_220px] gap-10">
        <article>
          <div className="flex items-center gap-2 mb-3">
            {article.category && <Badge tone="blue">{article.category.name}</Badge>}
            {article.product_version && (
              <span className="text-xs text-text-secondary">v{article.product_version}</span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-4">{article.title}</h1>

          <div className="flex items-center gap-4 text-sm text-text-secondary mb-8 pb-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Avatar name={article.author?.full_name || 'Author'} size="sm" />
              <span>by {article.author?.full_name || 'TaifaCare Team'}</span>
            </div>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {article.reading_time || estimateReadingTime(article.content)} min read
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Updated {formatDate(article.updated_at)}
            </span>
          </div>

          <MarkdownRenderer content={article.content || ''} className="max-w-article" />

          {!!article.tags?.length && (
            <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-border">
              <TagIcon className="w-4 h-4 text-text-secondary" />
              {article.tags.map((t) => (
                <span key={t.id || t} className="text-xs px-2 py-1 rounded bg-gray-100 text-text-secondary">
                  #{t.name || t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8">
            <FeedbackWidget articleId={article.id} />
          </div>

          {related.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-text-primary mb-4">Related articles</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map((a) => (
                  <ArticleCard key={a.id || a.slug} article={a} />
                ))}
              </div>
            </div>
          )}
        </article>

        <TableOfContents headings={headings} />
      </div>
    </div>
  );
}
