import { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageSquare } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as analyticsApi from '../../api/analytics.api';
import { extractErrorMessage } from '../../api/axios';

export default function FeedbackWidget({ articleId }) {
  const [rating, setRating] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);

  // Check if user already submitted feedback for this article
  const feedbackQuery = useQuery({
    queryKey: ['feedback', 'article', articleId],
    queryFn: () => analyticsApi.getFeedbackForObject({ content_type: 'article', object_id: articleId }),
    enabled: !!articleId,
    retry: false,
  });

  useEffect(() => {
    if (feedbackQuery.data && feedbackQuery.data.length > 0) {
      const fb = feedbackQuery.data[0];
      setExistingFeedback(fb);
      setSubmitted(true);
      if (fb.rating) {
        setRating(fb.rating);
      }
    }
  }, [feedbackQuery.data]);

  const submitRating = useMutation({
    mutationFn: (ratingValue) =>
      analyticsApi.submitFeedback({
        content_type: 'article',
        object_id: articleId,
        rating: ratingValue,
        comment: '',
      }),
    onSuccess: (data) => {
      setSubmitted(true);
      setExistingFeedback(data);
      toast.success('Thank you for your rating!');
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err));
    },
  });

  const handleRating = (value) => {
    if (submitted || existingFeedback || submitRating.isPending) return;
    setRating(value);
    submitRating.mutate(value);
  };

  // If feedback already exists, show the rating
  if (submitted || existingFeedback) {
    const displayRating = existingFeedback?.rating || rating;
    return (
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          {displayRating}
        </span>
        <span>· You rated this article</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-secondary">Rate this article:</span>
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          onMouseEnter={() => setHovered(v)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleRating(v)}
          disabled={submitRating.isPending}
          className="text-2xl transition-colors hover:scale-110 disabled:opacity-50"
        >
          <Star
            className={`w-5 h-5 ${
              (hovered !== null && v <= hovered) || (rating !== null && v <= rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        </button>
      ))}
      {submitRating.isPending && (
        <span className="text-sm text-text-secondary animate-pulse">Submitting...</span>
      )}
    </div>
  );
}