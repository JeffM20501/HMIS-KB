import { MessageCircle, History } from 'lucide-react';
import clsx from 'clsx';

const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'messages', label: 'Messages', icon: History },
];

/**
 * Bottom tab bar for the widget shell. Deliberately only two tabs — real
 * Intercom also has Home/Help/News, but neither has any real content
 * behind it in this app (no news feed, and a Help "collections" browser
 * would just duplicate the public Help Center that already exists as full
 * pages). Chat and Messages are the two surfaces with actual backend
 * functionality: sending a message, and listing/reopening real past
 * conversations via the Conversation API.
 */
export default function ChatTabBar({ activeTab, onChange }) {
  return (
    <div className="flex items-center border-t border-[#2A2A30] bg-[#131316] shrink-0">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors',
              isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
