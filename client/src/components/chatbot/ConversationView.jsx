import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import ChatMessage from './ChatMessage.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import SuggestedQuestions from './SuggestedQuestions.jsx';

/**
 * Turns the flat per-turn history from GET /chat/conversations/:id/messages/
 * ({ question, answer, was_helpful, created_at, sources }) into the
 * user+assistant message pairs ChatMessage renders. Note: this endpoint's
 * serializer doesn't currently return a per-turn ChatLog id, so replayed
 * historical messages have no `chatLogId` — ChatMessage already handles
 * that gracefully (it just hides the feedback buttons rather than
 * breaking). Worth adding that id to the backend serializer later so past
 * conversations can still receive feedback.
 */
export function conversationMessagesToChatMessages(entries = []) {
  const out = [];
  entries.forEach((entry, i) => {
    out.push({ id: `${i}-q`, role: 'user', content: entry.question, createdAt: entry.created_at });
    out.push({
      id: `${i}-a`,
      role: 'assistant',
      content: entry.answer,
      sources: entry.sources || [],
      createdAt: entry.created_at,
    });
  });
  return out;
}

export default function ConversationView({ messages, onSend, isPending, onEscalate }) {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#131316]">
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} chatLogId={m.chatLogId} onEscalate={onEscalate} />
        ))}
        {isPending && <TypingIndicator />}
      </div>

      {messages.length <= 1 && <SuggestedQuestions onSelect={onSend} />}

      <form onSubmit={handleSubmit} className="p-3 border-t border-[#2A2A30] bg-[#131316] shrink-0">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            className="flex-1 h-10 px-3.5 rounded-full bg-[#1C1C21] border border-[#2A2A30] text-sm text-gray-100 placeholder:text-gray-500 outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isPending}
            className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-hover focus-ring shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[11px] text-gray-600 mt-2.5">
          By chatting with us, you agree to our <span className="text-gray-400">Privacy Policy</span>.
        </p>
      </form>
    </>
  );
}
