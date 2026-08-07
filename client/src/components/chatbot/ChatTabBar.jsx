import { MessageCircle, History } from 'lucide-react';
import clsx from 'clsx';

const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'messages', label: 'Messages', icon: History },
];

export default function ChatTabBar({ activeTab, onChange }) {
  return (
    <div className="flex items-center border-t border-gray-200 bg-white shrink-0">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors',
              isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
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