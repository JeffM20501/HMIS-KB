import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import ChatMessage from './ChatMessage.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import SuggestedQuestions from './SuggestedQuestions.jsx';

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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white">
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} chatLogId={m.chatLogId} onEscalate={onEscalate} />
        ))}
        {isPending && <TypingIndicator />}
      </div>

      {messages.length <= 1 && <SuggestedQuestions onSelect={onSend} />}

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            className="flex-1 h-10 px-3.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isPending}
            className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 focus-ring shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-2.5">
          By chatting with us, you agree to our <span className="text-gray-600">Privacy Policy</span>.
        </p>
      </form>
    </>
  );
}