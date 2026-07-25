import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { Check, X, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import * as articlesApi from '../../api/articles.api';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { CheckCircle2 } from 'lucide-react';
import { extractErrorMessage } from '../../api/axios';
import { formatDate } from '../../utils/formatters';

const PRIORITY_TONE = { high: 'red', normal: 'blue', low: 'gray' };

export default function ReviewQueuePage() {
  const queryClient = useQueryClient();
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [comment, setComment] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const queueQuery = useQuery({
    queryKey: ['articles', 'pending-review'],
    queryFn: () => articlesApi.getPendingReview(),
  });

  const items = queueQuery.data?.results || queueQuery.data || [];
  const activeSlug = selectedSlug || items[0]?.slug;
  const active = items.find((a) => a.slug === activeSlug);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['articles', 'pending-review'] });
    queryClient.invalidateQueries({ queryKey: ['articles', 'published'] });
  };

  const publishMutation = useMutation({
    mutationFn: articlesApi.publishArticle,
    onSuccess: () => {
      toast.success('Article approved and published.');
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ slug, reason }) => articlesApi.rejectArticle(slug, reason),
    onSuccess: () => {
      toast.success('Article returned to the editor.');
      setRejectOpen(false);
      setRejectReason('');
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <div>
      <PageHeader title="Review Queue" description={`${items.length} article${items.length === 1 ? '' : 's'} awaiting review`} />

      {queueQuery.isLoading && (
        <div className="grid lg:grid-cols-[320px_1fr] gap-4">
          <Skeleton className="h-96 rounded-card" />
          <Skeleton className="h-96 rounded-card" />
        </div>
      )}

      {!queueQuery.isLoading && items.length === 0 && (
        <EmptyState icon={CheckCircle2} title="All caught up" description="There are no articles waiting for review." />
      )}

      {!queueQuery.isLoading && items.length > 0 && (
        <div className="grid lg:grid-cols-[320px_1fr] gap-4">
          {/* Queue list */}
          <div className="bg-white border border-border rounded-card divide-y divide-border overflow-hidden h-fit">
            {items.map((item) => (
              <button
                key={item.slug}
                onClick={() => setSelectedSlug(item.slug)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  item.slug === activeSlug ? 'bg-primary-50/60 border-l-2 border-primary' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-semibold text-text-primary leading-snug">{item.title}</p>
                  <Badge tone={PRIORITY_TONE[item.priority] || 'blue'}>{item.priority || 'normal'}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <span>{item.author?.full_name}</span>
                  <span>·</span>
                  <span>{formatDate(item.submitted_at)}</span>
                </div>
                {item.category && (
                  <Badge tone="gray" className="mt-2">
                    {item.category.name || item.category}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {active && (
            <div className="bg-white border border-border rounded-card p-6">
              <div className="flex items-center gap-2 mb-3">
                {active.category && <Badge tone="blue">{active.category.name || active.category}</Badge>}
                <Badge tone={PRIORITY_TONE[active.priority] || 'blue'}>{active.priority || 'normal'} priority</Badge>
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">{active.title}</h2>
              <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
                <Avatar name={active.author?.full_name} size="sm" />
                <span>by {active.author?.full_name}</span>
                <span>·</span>
                <span>Submitted {formatDate(active.submitted_at)}</span>
              </div>

              <div className="bg-gray-50 border border-border rounded-lg p-5 mb-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">Article preview</p>
                <div className="kb-prose text-sm max-h-80 overflow-y-auto">
                  <ReactMarkdown>{active.content || active.summary || 'No preview available.'}</ReactMarkdown>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <Button onClick={() => publishMutation.mutate(active.slug)} isLoading={publishMutation.isPending}>
                  <Check className="w-4 h-4" /> Approve & Publish
                </Button>
                <Button variant="dangerOutline" onClick={() => setRejectOpen(true)}>
                  <X className="w-4 h-4" /> Request Changes
                </Button>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5 mb-3">
                  <MessageSquare className="w-4 h-4" /> Review Comments ({active.review_comments?.length || 0})
                </p>
                <div className="space-y-3 mb-4">
                  {(active.review_comments || []).map((c, i) => (
                    <div key={i} className="flex gap-2.5">
                      <Avatar name={c.author?.full_name} size="sm" />
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text-primary">{c.author?.full_name}</span>
                          <span className="text-xs text-text-secondary">{formatDate(c.created_at)}</span>
                        </div>
                        <p className="text-sm text-text-secondary">{c.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Textarea
                  rows={2}
                  placeholder="Add a review comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Request changes"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate({ slug: active?.slug, reason: rejectReason })}
              disabled={!rejectReason.trim()}
            >
              Send back to editor
            </Button>
          </>
        }
      >
        <Textarea
          rows={4}
          placeholder="Explain what needs to change before this can be published..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
