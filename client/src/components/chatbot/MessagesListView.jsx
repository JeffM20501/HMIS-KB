import { useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Pencil, Archive, Trash2, Plus, MessageCircle } from 'lucide-react';
import * as chatbotApi from '../../api/chatbot.api';
import { formatRelativeTime } from '../../utils/formatters';

export default function MessagesListView({ onOpenConversation, onNewChat }) {
  const queryClient = useQueryClient();
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

  const conversationsQuery = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: () => chatbotApi.listConversations({ include_archived: false }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }) => chatbotApi.renameConversation(id, title),
    onSuccess: () => {
      setRenamingId(null);
      invalidate();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => chatbotApi.archiveConversation(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => chatbotApi.deleteConversation(id),
    onSuccess: () => {
      setConfirmingDeleteId(null);
      invalidate();
    },
  });

  const conversations = conversationsQuery.data?.results || conversationsQuery.data || [];

  const startRename = (conv) => {
    setRenamingId(conv.id);
    setRenameValue(conv.title || '');
  };

  const commitRename = (id) => {
    const title = renameValue.trim();
    if (title) renameMutation.mutate({ id, title });
    else setRenamingId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="p-4 pb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-700 hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="w-4 h-4" /> New chat
        </button>
      </div>

      {conversationsQuery.isLoading && (
        <div className="px-4 py-8 text-center text-sm text-gray-500">Loading conversations…</div>
      )}

      {!conversationsQuery.isLoading && conversations.length === 0 && (
        <div className="px-4 py-10 text-center">
          <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No conversations yet</p>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {conversations.map((conv) => (
          <div key={conv.id} className="group flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors">
            {renamingId === conv.id ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => commitRename(conv.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename(conv.id);
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                className="flex-1 h-8 px-2 rounded bg-gray-50 border border-primary text-sm text-gray-900 outline-none"
              />
            ) : (
              <button onClick={() => onOpenConversation(conv.id)} className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">{conv.title || 'New conversation'}</p>
                <p className="text-xs text-gray-500">
                  {formatRelativeTime(conv.updated_at)} · {conv.message_count} message{conv.message_count === 1 ? '' : 's'}
                </p>
              </button>
            )}

            {renamingId !== conv.id && (
              <Menu as="div" className="relative shrink-0">
                <Menu.Button className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                >
                  <Menu.Items className="absolute right-0 z-40 mt-1 w-40 rounded-lg bg-white border border-gray-200 shadow-lg py-1 focus:outline-none">
                    <Menu.Item>
                      <button
                        onClick={() => startRename(conv)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Rename
                      </button>
                    </Menu.Item>
                    <Menu.Item>
                      <button
                        onClick={() => archiveMutation.mutate(conv.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Archive className="w-3.5 h-3.5" /> Archive
                      </button>
                    </Menu.Item>
                    <Menu.Item>
                      <button
                        onClick={() =>
                          confirmingDeleteId === conv.id
                            ? deleteMutation.mutate(conv.id)
                            : setConfirmingDeleteId(conv.id)
                        }
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {confirmingDeleteId === conv.id ? 'Click to confirm' : 'Delete'}
                      </button>
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}