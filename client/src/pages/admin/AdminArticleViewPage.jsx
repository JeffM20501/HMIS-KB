// src/pages/admin/AdminArticleViewPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Clock, Calendar, Tag as TagIcon, PenTool, Trash2, ArrowLeft, File, FileText, Check, X, Archive, RotateCcw, AlertTriangle } from 'lucide-react';
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
import Textarea from '../../components/ui/Textarea.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { FileQuestion } from 'lucide-react';
import { formatDate, estimateReadingTime } from '../../utils/formatters';
import { extractHeadings } from '../../utils/headings';
import { useAuth } from '../../hooks/useAuth';
import { extractErrorMessage } from '../../api/axios';

export default function AdminArticleViewPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
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

    const publishMutation = useMutation({
        mutationFn: () => articlesApi.publishArticle(slug),
        onSuccess: () => {
        toast.success('Article published successfully.');
        queryClient.invalidateQueries({ queryKey: ['article', slug] });
        queryClient.invalidateQueries({ queryKey: ['articles'] });
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
    });

    const rejectMutation = useMutation({
        mutationFn: (reason) => articlesApi.rejectArticle(slug, reason),
        onSuccess: () => {
        toast.success('Article rejected and returned to draft.');
        setShowRejectModal(false);
        queryClient.invalidateQueries({ queryKey: ['article', slug] });
        queryClient.invalidateQueries({ queryKey: ['articles'] });
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
    });

    const archiveMutation = useMutation({
        mutationFn: () => articlesApi.archiveArticle(slug),
        onSuccess: () => {
        toast.success('Article archived successfully.');
        setShowArchiveModal(false);
        queryClient.invalidateQueries({ queryKey: ['article', slug] });
        queryClient.invalidateQueries({ queryKey: ['articles'] });
        navigate('/admin/archived');
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
    });

    const restoreMutation = useMutation({
        mutationFn: () => articlesApi.restoreArticle(slug),
        onSuccess: () => {
        toast.success('Article restored successfully.');
        setShowRestoreModal(false);
        queryClient.invalidateQueries({ queryKey: ['article', slug] });
        queryClient.invalidateQueries({ queryKey: ['articles'] });
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
    });

    const deleteMutation = useMutation({
        mutationFn: () => articlesApi.deleteArticle(slug),
        onSuccess: () => {
        toast.success('Article permanently deleted.');
        setShowDeleteModal(false);
        queryClient.invalidateQueries({ queryKey: ['articles'] });
        navigate('/admin/published');
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
    });

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
    const isPending = article.status === 'pending_review';
    const isArchived = article.status === 'archived';

    return (
        <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
            >
            <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center gap-2">
            {isPending && (
                <>
                <Button
                    variant="secondary"
                    onClick={() => publishMutation.mutate()}
                    isLoading={publishMutation.isPending}
                >
                    <Check className="w-4 h-4" /> Publish
                </Button>
                <Button
                    variant="dangerOutline"
                    onClick={() => setShowRejectModal(true)}
                >
                    <X className="w-4 h-4" /> Reject
                </Button>
                </>
            )}
            {isPublished && (
                <Button
                variant="dangerOutline"
                onClick={() => setShowArchiveModal(true)}
                >
                <Archive className="w-4 h-4" /> Archive
                </Button>
            )}
            {isArchived && (
                <Button
                variant="secondary"
                onClick={() => setShowRestoreModal(true)}
                >
                <RotateCcw className="w-4 h-4" /> Restore
                </Button>
            )}
            <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
            >
                <Trash2 className="w-4 h-4" /> Delete
            </Button>
            <Link to={`/editor/articles/${article.slug}/edit`}>
                <Button variant="secondary">
                <PenTool className="w-4 h-4" /> Edit
                </Button>
            </Link>
            </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-sm text-text-secondary mb-6 flex-wrap">
            <Link to="/admin" className="hover:text-primary">Admin</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/admin/published" className="hover:text-primary">Published</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-text-primary font-medium truncate max-w-xs">{article.title}</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_220px] gap-10">
            <article>
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                {article.category && <Badge tone="blue">{article.category.name}</Badge>}
                {article.product?.name && <Badge tone="purple">{article.product.name}</Badge>}
                {article.product_version && (
                <span className="text-xs text-text-secondary">{article.product_version}</span>
                )}
                <Badge tone={isPublished ? 'green' : isPending ? 'amber' : isArchived ? 'gray' : 'gray'}>
                {article.status.replace('_', ' ')}
                </Badge>
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

            {/* Media attachments */}
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

        {/* Reject Modal */}
        <Modal
            isOpen={showRejectModal}
            onClose={() => setShowRejectModal(false)}
            title="Reject Article"
            footer={
            <>
                <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                Cancel
                </Button>
                <Button
                variant="danger"
                isLoading={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate(rejectReason)}
                disabled={!rejectReason.trim()}
                >
                Send back to editor
                </Button>
            </>
            }
        >
            <Textarea
            rows={4}
            placeholder="Explain why this article is being rejected..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            />
        </Modal>

        {/* Archive Modal */}
        <Modal
            isOpen={showArchiveModal}
            onClose={() => setShowArchiveModal(false)}
            title="Archive Article"
            description="Archiving will remove this article from the published knowledge base. It can be restored later."
            footer={
            <>
                <Button variant="secondary" onClick={() => setShowArchiveModal(false)}>
                Cancel
                </Button>
                <Button
                variant="danger"
                isLoading={archiveMutation.isPending}
                onClick={() => archiveMutation.mutate()}
                >
                Archive Article
                </Button>
            </>
            }
        />

        {/* Restore Modal */}
        <Modal
            isOpen={showRestoreModal}
            onClose={() => setShowRestoreModal(false)}
            title="Restore Article"
            description="Restoring this article will move it back to the draft state. You will need to review and publish it again."
            footer={
            <>
                <Button variant="secondary" onClick={() => setShowRestoreModal(false)}>
                Cancel
                </Button>
                <Button
                variant="primary"
                isLoading={restoreMutation.isPending}
                onClick={() => restoreMutation.mutate()}
                >
                <RotateCcw className="w-4 h-4" /> Restore Article
                </Button>
            </>
            }
        />

        {/* Delete Modal – fixed: uses article directly */}
        <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Delete Permanently"
            description={
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-danger">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">This action cannot be undone</span>
                </div>
                <p>
                Article: <strong className="text-text-primary">“{article?.title}”</strong>
                </p>
                <p className="text-text-secondary">
                The article and all its associated data (media, feedback, etc.) will be permanently removed from the database.
                </p>
                <div className="bg-danger-bg border border-danger/20 rounded-lg p-3 text-sm text-danger">
                <strong>Warning:</strong> This is irreversible. Only proceed if you are certain.
                </div>
            </div>
            }
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
        />
        </div>
    );
}