import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ThumbsUp, ThumbsDown, LifeBuoy } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import SourceCitationCard from './SourceCitationCard.jsx';
import * as analyticsApi from '../../api/analytics.api';

export default function ChatMessage({ message,chatLogId,onEscalate }) {
  const isUser = message.role === 'user';
  const [feedback, setFeedback] = useState(null);

  const feedbackMutation = useMutation({
    mutationFn: (helpful) =>
      analyticsApi.submitFeedback({
        content_type: 'chat',
        object_id: chatLogId,
        helpful: helpful,   // true or false
      }),
  });

  const giveFeedback = (rating) => {
    const isHelpful=rating == 'up'
    setFeedback(rating);
    feedbackMutation.mutate(isHelpful);
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-primary text-white text-sm rounded-2xl rounded-tr-sm px-3.5 py-2.5">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-w-[92%]">
      <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-3.5 py-3 text-sm text-text-primary shadow-sm">
        <div className="kb-prose text-sm [&_p]:mb-2 [&_p]:leading-6">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {!!message.sources?.length && (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Sources</p>
            {message.sources.map((s, i) => (
              <SourceCitationCard key={i} source={s} />
            ))}
          </div>
        )}

        {message.escalateSuggested && (
          <button
            onClick={onEscalate}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <LifeBuoy className="w-3.5 h-3.5" /> Escalate to support
          </button>
        )}
      </div>

      {message.id !== 'welcome' && chatLogId && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] text-text-secondary">Was this helpful?</span>
          <button
            onClick={() => giveFeedback('up')}
            className={clsx('p-1 rounded hover:bg-gray-100', feedback === 'up' && 'text-success bg-success-bg')}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => giveFeedback('down')}
            className={clsx('p-1 rounded hover:bg-gray-100', feedback === 'down' && 'text-danger bg-danger-bg')}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
