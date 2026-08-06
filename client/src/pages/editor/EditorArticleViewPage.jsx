import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Clock, Calendar, Tag as TagIcon, PenTool, Trash2, ArrowLeft, File, FileText, Send, Archive, RotateCcw } from 'lucide-react';
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
import Modal from '../../components/ui/Modal.jsx';
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
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);

    const articleQuery = useQuery({
        queryKey: ['article', slug],
        queryFn: () => articlesApi.getArticle(slug),
    });

    const article = articleQuery.data;

    const mediaQuery = useQuery({
        queryKey: ['article', slug, 'media'],
        queryFn: () => articlesApi.getArticleMedia(slug),
        enabled: !!slug,
    });
    const mediaItems = mediaQuery.data || [];

    // ---- Mutations ----
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

    const archiveMutation = useMutation({
        mutationFn: () => articlesApi.archiveArticle(slug),
        onSuccess: () => {
        toast.success('Article archived.');
        setShowArchiveModal(false);
        queryClient.invalidateQueries({ queryKey: ['articles', 'my-articles'] });
        navigate('/editor/my-articles');
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
    });

    const restoreMutation = useMutation({
        mutationFn: () => articlesApi.restoreArticle(slug),
        onSuccess: () => {
        toast.success('Article restored to draft.');
        setShowRestoreModal(false);
        queryClient.invalidateQueries({ queryKey: ['articles', 'my-articles'] });
        navigate('/editor/my-articles');
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

    const handleArchive = () => {
        archiveMutation.mutate();
    };

    const handleRestore = () => {
        restoreMutation.mutate();
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
    const isAdmin = user?.role === 'admin';
    const isEditor = user?.role === 'editor';

    // Permissions
    const canEdit = (isAdmin || (isEditor && isAuthor)) && article?.status !== 'archived';
    const canSubmit = (isAdmin || (isEditor && isAuthor)) && article?.status === 'draft';
    const canArchive = isAdmin && article?.status === 'published';
    const canRestore = isAdmin && article?.status === 'archived';
    const canDelete = isAdmin || (isEditor && isAuthor && article?.status === 'draft');

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
            {canArchive && (
                <Button
                variant="dangerOutline"
                onClick={() => setShowArchiveModal(true)}
                >
                <Archive className="w-4 h-4" /> Archive
                </Button>
            )}
            {canRestore && (
                <Button
                variant="primary"
                onClick={() => setShowRestoreModal(true)}
                >
                <RotateCcw className="w-4 h-4" /> Restore
                </Button>
            )}
            {canEdit && (
                <Link to={`/editor/articles/${article.slug}/edit`}>
                <Button variant="secondary" size="sm">
                    <PenTool className="w-4 h-4" /> Edit
                </Button>
                </Link>
            )}
            {canDelete && (
                <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                <Trash2 className="w-4 h-4" /> Delete
                </Button>
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

        {/* ═══ MODALS WITH IMPROVED MESSAGING ═══ */}

        {/* Submit for Review (no destructive action) */}
        {/* We don't have a modal for submit; it's a direct action. If you want, we can add one, but it's fine as is. */}

        {/* Delete Confirmation Modal */}
        <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Permanently Delete Article"
            footer={
                <>
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    isLoading={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate()}
                >
                    <Trash2 className="w-4 h-4" /> Delete Permanently
                </Button>
                </>
            }
            >
            <p className="text-text-secondary">
                You are about to permanently delete <strong className="text-text-primary">“{article.title}”</strong>.
            </p>
            <p className="text-text-danger font-semibold mt-2">
                This action <strong>cannot be undone</strong>. All data associated with this article will be lost.
            </p>
        </Modal>

        {/* Archive Confirmation Modal */}
        <Modal
            isOpen={showArchiveModal}
            onClose={() => setShowArchiveModal(false)}
            title="Archive Article"
            description={
            <div>
                <p className="mb-2">
                Archiving will remove <strong>“{article.title}”</strong> from public view.
                </p>
                <p className="text-amber-600 font-medium">The article will be hidden from viewers and search results.</p>
                <p className="mt-2 text-sm text-text-secondary">
                You can restore it later from the Archived Articles page in the admin panel.
                </p>
            </div>
            }
            footer={
            <>
                <Button variant="secondary" onClick={() => setShowArchiveModal(false)}>
                Cancel
                </Button>
                <Button variant="danger" onClick={handleArchive} isLoading={archiveMutation.isPending}>
                <Archive className="w-4 h-4" /> Archive Article
                </Button>
            </>
            }
        />

        {/* Restore Confirmation Modal */}
        <Modal
            isOpen={showRestoreModal}
            onClose={() => setShowRestoreModal(false)}
            title="Restore Article"
            description={
            <div>
                <p className="mb-2">
                Restoring <strong>“{article.title}”</strong> will set it back to draft status.
                </p>
                <p className="text-primary font-medium">You will be able to edit and resubmit it for review.</p>
                <p className="mt-2 text-sm text-text-secondary">
                The article will not be publicly visible until it is published again.
                </p>
            </div>
            }
            footer={
            <>
                <Button variant="secondary" onClick={() => setShowRestoreModal(false)}>
                Cancel
                </Button>
                <Button variant="primary" onClick={handleRestore} isLoading={restoreMutation.isPending}>
                <RotateCcw className="w-4 h-4" /> Restore Article
                </Button>
            </>
            }
        />
        </div>
    );
}