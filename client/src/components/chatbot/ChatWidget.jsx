import { useEffect, useState } from 'react';
import { MessageCircle, X, Minus, Sparkles } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as chatbotApi from '../../api/chatbot.api';
import ChatTabBar from './ChatTabBar.jsx';
import ConversationView, { conversationMessagesToChatMessages } from './ConversationView.jsx';
import MessagesListView from './MessagesListView.jsx';

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

const HEADER_COPY = {
  chat: { title: 'Knowledge Assistant', subtitle: 'Answers grounded in published articles' },
  messages: { title: 'Messages', subtitle: 'Your conversation history' },
};

export default function ChatWidget({ context = {} }) {
  const persisted = loadSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [conversationId, setConversationId] = useState(persisted?.conversationId || null);
  const [messages, setMessages] = useState(persisted?.messages?.length ? persisted.messages : [WELCOME]);
  const queryClient = useQueryClient();

  useEffect(() => {
    saveSession({ conversationId, messages });
  }, [conversationId, messages]);

  const chatMutation = useMutation({
    mutationFn: (payload) => chatbotApi.sendChatMessage(payload),
    onSuccess: (data) => {
      const newId = data.conversation_id || conversationId;
      setConversationId(newId);
      setMessages((prev) => [
        ...prev,
        {
          id: data.chat_log_id || crypto.randomUUID(),
          chatLogId: data.chat_log_id,
          role: 'assistant',
          content: data.answer,
          sources: data.sources || [],
          confidence: data.confidence,
          escalateSuggested: data.escalate_suggested,
          createdAt: new Date().toISOString(),
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
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
    chatMutation.mutate({ message: trimmed, conversation_id: conversationId, context });
  };

  const startNewChat = () => {
    setConversationId(null);
    setMessages([WELCOME]);
    setActiveTab('chat');
  };

  const openConversationMutation = useMutation({
    mutationFn: (id) => chatbotApi.getConversationMessages(id),
    onSuccess: (entries, id) => {
      setConversationId(id);
      setMessages(conversationMessagesToChatMessages(entries));
      setActiveTab('chat');
    },
  });

  const headerCopy = HEADER_COPY[activeTab];

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-transform hover:scale-105 focus-ring"
          aria-label="Open Knowledge Assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div
          className={`fixed z-50 bg-white border border-gray-200 shadow-xl flex flex-col transition-all
          ${
            isExpanded
              ? 'inset-4 sm:inset-8 rounded-lg'
              : 'bottom-6 right-6 w-[min(400px,calc(100vw-2rem))] h-[min(640px,calc(100vh-3rem))] rounded-lg'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200 bg-white rounded-t-lg shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight text-gray-900">{headerCopy.title}</p>
                <p className="text-[11px] text-gray-500">{headerCopy.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hidden sm:block"
                aria-label="Resize"
              >
                <Minus className="w-4 h-4 rotate-45" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {activeTab === 'chat' ? (
            <ConversationView
              messages={messages}
              onSend={sendMessage}
              isPending={chatMutation.isPending}
              onEscalate={() => sendMessage('Please escalate this to support.')}
            />
          ) : (
            <MessagesListView
              onOpenConversation={(id) => openConversationMutation.mutate(id)}
              onNewChat={startNewChat}
            />
          )}

          <ChatTabBar activeTab={activeTab} onChange={setActiveTab} />
        </div>
      )}
    </>
  );
}