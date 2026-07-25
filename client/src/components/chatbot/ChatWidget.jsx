import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Minus, Send, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import * as chatbotApi from '../../api/chatbot.api';
import ChatMessage from './ChatMessage.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import SuggestedQuestions from './SuggestedQuestions.jsx';

const STORAGE_KEY = 'taifacare_chat_session';

function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

function saveSession(state) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm the TaifaCare Knowledge Assistant. Ask me anything about the HMIS, Lab, Pharmacy, or Billing modules — I'll answer only from published documentation and always show my sources.",
  sources: [],
  createdAt: new Date().toISOString(),
};

export default function ChatWidget({ context = {} }) {
  const persisted = loadSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversationId, setConversationId] = useState(persisted?.conversationId || null);
  const [messages, setMessages] = useState(persisted?.messages?.length ? persisted.messages : [WELCOME]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    saveSession({ conversationId, messages });
  }, [conversationId, messages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  const chatMutation = useMutation({
    mutationFn: (payload) => chatbotApi.sendChatMessage(payload),
    onSuccess: (data) => {
      setConversationId(data.conversation_id || conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: data.id || crypto.randomUUID(),
          role: 'assistant',
          content: data.answer,
          sources: data.sources || [],
          confidence: data.confidence,
          escalateSuggested: data.escalate_suggested,
          createdAt: new Date().toISOString(),
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            "I couldn't reach the knowledge base right now. Please try again in a moment, or escalate this to support.",
          sources: [],
          escalateSuggested: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    },
  });

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: trimmed, createdAt: new Date().toISOString() },
    ]);
    setInput('');
    chatMutation.mutate({ message: trimmed, conversation_id: conversationId, context });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating action button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-popover flex items-center justify-center hover:bg-primary-hover transition-transform hover:scale-105 focus-ring"
          aria-label="Open Knowledge Assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div
          className={`fixed z-50 bg-white border border-border shadow-popover flex flex-col transition-all
          ${
            isExpanded
              ? 'inset-4 sm:inset-8 rounded-card'
              : 'bottom-6 right-6 w-[min(400px,calc(100vw-2rem))] h-[min(600px,calc(100vh-3rem))] rounded-card'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-primary rounded-t-card text-white">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight">Knowledge Assistant</p>
                <p className="text-[11px] text-white/70">Answers grounded in published articles</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="p-1.5 rounded hover:bg-white/10 hidden sm:block"
                aria-label="Resize"
              >
                <Minus className="w-4 h-4 rotate-45" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded hover:bg-white/10" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-surface">
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} onEscalate={() => sendMessage('Please escalate this to support.')} />
            ))}
            {chatMutation.isPending && <TypingIndicator />}
          </div>

          {messages.length <= 1 && (
            <SuggestedQuestions onSelect={sendMessage} />
          )}

          {/* Composer */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-border flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 h-10 px-3 rounded-full bg-gray-50 border border-transparent text-sm focus-ring focus:bg-white focus:border-primary"
            />
            <button
              type="submit"
              disabled={!input.trim() || chatMutation.isPending}
              className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-hover focus-ring shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
