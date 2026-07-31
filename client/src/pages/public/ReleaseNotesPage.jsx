import { useQuery } from '@tanstack/react-query';
import MarkdownRenderer from '../../components/article/MarkdownRenderer.jsx';
import { Tag } from 'lucide-react';
import * as articlesApi from '../../api/articles.api';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { formatDate } from '../../utils/formatters';

export default function ReleaseNotesPage() {
  const query = useQuery({
    queryKey: ['articles', 'release-notes'],
    queryFn: () => articlesApi.listArticles({ content_type: 'release_notes', status: 'published', ordering: '-updated_at' }),
  });

  const notes = query.data?.results || query.data || [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Release Notes</h1>
      <p className="text-text-secondary mb-10">
        New features, bug fixes, and breaking changes across the TaifaCare HMIS product suite.
      </p>

      {query.isLoading && (
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-card" />
          ))}
        </div>
      )}

      {query.isError && <ErrorState message="Couldn't load release notes." onRetry={query.refetch} />}

      {!query.isLoading && notes.length === 0 && (
        <EmptyState title="No release notes yet" description="Check back after the next product release." />
      )}

      <div className="space-y-10">
        {notes.map((note) => (
          <div key={note.id || note.slug} className="border-l-2 border-primary/30 pl-6 relative">
            <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-primary" />
            <div className="flex items-center gap-2 mb-1.5">
              {note.product_version && (
                <span className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary-50 px-2 py-0.5 rounded-full">
                  <Tag className="w-3 h-3" /> v{note.product_version}
                </span>
              )}
              <span className="text-xs text-text-secondary">{formatDate(note.updated_at)}</span>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">{note.title}</h2>
            <div className="text-sm [&_p]:mb-2">
              <MarkdownRenderer content={note.summary || note.content?.slice(0, 400) || ''} />
            </div>
            <a href={`/articles/${note.slug}`} className="text-sm font-medium text-primary hover:underline">
              Read full notes →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
