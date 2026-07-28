import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import * as analyticsApi from '../../api/analytics.api';
import Button from '../ui/Button.jsx';
import Textarea from '../ui/Textarea.jsx';
import toast from 'react-hot-toast';

export default function FeedbackWidget({ articleId }) {
  const [choice, setChoice] = useState(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload) => analyticsApi.submitFeedback(payload),
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Thanks for your feedback!');
    },
    onError: () => toast.error('Could not submit feedback. Please try again.'),
  });

  const pick = (val) => setChoice(val);

  const submit = () => {
    mutation.mutate({
      content_type:'article',
      object_id: articleId,
      rating: choice === 'up' ? 5 : 1,
      comment: comment || undefined,
      helpful:true,
    });
  };

  if (submitted) {
    return (
      <div className="bg-success-bg text-success rounded-card p-4 text-sm font-medium text-center">
        Thanks — your feedback helps keep this documentation accurate.
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-card p-5">
      <p className="text-sm font-semibold text-text-primary mb-3">Was this article helpful?</p>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => pick('up')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-sm ${
            choice === 'up' ? 'border-success bg-success-bg text-success' : 'border-border text-text-secondary hover:bg-gray-50'
          }`}
        >
          <ThumbsUp className="w-4 h-4" /> Yes
        </button>
        <button
          onClick={() => pick('down')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-sm ${
            choice === 'down' ? 'border-danger bg-danger-bg text-danger' : 'border-border text-text-secondary hover:bg-gray-50'
          }`}
        >
          <ThumbsDown className="w-4 h-4" /> No
        </button>
      </div>
      {choice && (
        <div className="space-y-3">
          <Textarea
            rows={3}
            placeholder="Anything we should improve? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button size="sm" onClick={submit} isLoading={mutation.isPending}>
            Submit feedback
          </Button>
        </div>
      )}
    </div>
  );
}
