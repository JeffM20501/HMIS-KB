import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Clock, Calendar, Tag as TagIcon, PenTool, Trash2, ArrowLeft, File, FileText, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import * as articlesApi from '../../api/articles.api';
import * as analyticsApi from '../../api/analytics.api';
import ArticleCard from '../../components/article/ArticleCard.jsx';
import TableOfContents from '../../components/article/TableOfContents.jsx';
import FeedbackWidget from '../../components/article/FeedbackWidget.jsx';
import MarkdownRenderer from '../../components/article/MarkdownRenderer.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { FileQuestion } from 'lucide-react';
import { formatDate, estimateReadingTime } from '../../utils/formatters';
import { extractHeadings } from '../../utils/headings';
import { useAuth } from '../../hooks/useAuth';
import { extractErrorMessage } from '../../api/axios';

export default function EditorArticleViewPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const articleQuery = useQuery({
    queryKey: ['article', slug],
    queryFn: () => articlesApi.getArticle(slug),
    });

    const article = articleQuery.data;

    // Fetch media for this article
    const mediaQuery = useQuery({
    queryKey: ['article', slug, 'media'],
    queryFn: () => articlesApi.getArticleMedia(slug),
    enabled: !!slug,
    });
    const mediaItems = mediaQuery.data || [];

    const deleteMutation = useMutation({
    mutationFn: () => articlesApi.deleteArticle(slug),
    onSuccess: () => {
        toast.success('Article deleted successfully.');
        queryClient.invalidateQueries({ queryKey: ['articles', 'my-articles'] });
        navigate('/editor/my-articles');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
    });

    const submitMutation = useMutation({
    mutationFn: () => articlesApi.submitForReview(slug),
    onSuccess: () => {
        toast.success('Article submitted for review.');
        queryClient.invalidateQueries({ queryKey: ['articles', 'my-articles'] });
        navigate('/editor/submitted');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
    });

    const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteModal(false);
    };

    const handleSubmit = () => {
    submitMutation.mutate();
    };

    useEffect(() => {
    if (article?.id && article.status === 'published') {
        analyticsApi.logArticleView(article.id).catch(() => {});
    }
    }, [article?.id, article?.status]);

    const relatedQuery = useQuery({
    queryKey: ['articles', 'related', article?.category?.slug],
    queryFn: () =>
        articlesApi.listArticles({ category: article.category?.slug, status: 'published', page_size: 3 }),
    enabled: !!article?.category?.slug,
    });

    const headings = useMemo(() => extractHeadings(article?.content || ''), [article?.content]);

    const isAuthor = user?.id === article?.author;
    const canEdit = user && (
    user.role === 'admin' ||
    (user.role === 'editor' && isAuthor && article?.status === 'draft')
    );
    const canSubmit = user && (
    user.role === 'admin' ||
    (user.role === 'editor' && isAuthor && article?.status === 'draft')
    );

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
    const isPublished = article.status === 'published';

    return (
    <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header with Back button and actions */}
        <div className="flex items-center justify-between mb-6">
        <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
            <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
            {canSubmit && (
            <Button
                variant="secondary"
                onClick={handleSubmit}
                isLoading={submitMutation.isPending}
            >
                <Send className="w-4 h-4" /> Submit for Review
            </Button>
            )}
            {canEdit && (
            <>
                <Link to={`/editor/articles/${article.slug}/edit`}>
                <Button variant="secondary" size="sm">
                    <PenTool className="w-4 h-4" /> Edit
                </Button>
                </Link>
                <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                <Trash2 className="w-4 h-4" /> Delete
                </Button>
            </>
            )}
        </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-sm text-text-secondary mb-6 flex-wrap">
        <Link to="/" className="hover:text-primary">Home</Link>
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
            {article.product_version && <span className="text-xs text-text-secondary">{article.product_version}</span>}
            {!isPublished && (
                <Badge tone="amber">{article.status.replace('_', ' ')}</Badge>
            )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-4">{article.title}</h1>

            <div className="flex items-center gap-4 text-sm text-text-secondary mb-8 pb-6 border-b border-border">
            <div className="flex items-center gap-2">
                <Avatar name={article.author_full_name || 'Author'} size="sm" src={article.author_avatar} />
                <span>by {article.author_full_name || article.author_username || 'TaifaCare Team'}</span>
            </div>
            <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {article.reading_time || estimateReadingTime(article.content)} min read
            </span>
            <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Updated {formatDate(article.updated_at)}
            </span>
            </div>

            {!isPublished && (
            <div className="mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                This article is <strong>{article.status.replace('_', ' ')}</strong> and not yet publicly visible.
            </div>
            )}

            <MarkdownRenderer content={article.content || ''} className="max-w-article" />

            {!!(article.tags?.length || article.tag_names?.length) && (
                <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-border">
                    <TagIcon className="w-4 h-4 text-text-secondary" />
                    {(article.tag_names || article.tags || []).map((t, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 rounded bg-gray-100 text-text-secondary">
                        #{typeof t === 'string' ? t : (t.name || t)}
                    </span>
                    ))}
                </div>
            )}

            {/* Display attached media */}
            {mediaItems.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Attached Media</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {mediaItems.map((m) => (
                    <div key={m.id} className="border border-border rounded-lg overflow-hidden bg-white">
                    {m.type === 'image' ? (
                        <img src={m.url} alt={m.filename} className="w-full h-32 object-cover" />
                    ) : m.type === 'video' ? (
                        <video src={m.url} className="w-full h-32 object-cover" controls muted />
                    ) : m.type === 'pdf' ? (
                        <div className="flex items-center justify-center h-32 bg-gray-50">
                        <FileText className="w-12 h-12 text-red-500" />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 bg-gray-50">
                        <File className="w-12 h-12 text-text-secondary" />
                        </div>
                    )}
                    <div className="p-2">
                        <p className="text-xs truncate text-text-secondary">{m.filename || m.name}</p>
                        {m.url && (
                        <a
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                        >
                            View
                        </a>
                        )}
                    </div>
                    </div>
                ))}
                </div>
            </div>
            )}

            {isPublished && (
            <div className="mt-8">
                <FeedbackWidget articleId={article.id} />
            </div>
            )}

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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Delete Article</h3>
            <p className="text-text-secondary mb-6">
                Are you sure you want to delete <strong className="text-text-primary">“{article.title}”</strong>?
                This action <strong className="text-danger">cannot be undone</strong>.
            </p>
            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
                </Button>
                <Button variant="danger" onClick={handleDelete} isLoading={deleteMutation.isPending}>
                <Trash2 className="w-4 h-4" /> Delete permanently
                </Button>
            </div>
            </div>
        </div>
        )}
    </div>
    );
}