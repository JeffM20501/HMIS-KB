import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Search, Menu } from 'lucide-react';
import NotificationBell from './NotificationBell.jsx';
import Avatar from '../ui/Avatar.jsx';
import Dropdown from '../ui/Dropdown.jsx';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';

export default function Topbar({ notificationsRoute, onMenuClick }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const submitSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="h-16 sticky top-0 z-30 bg-white border-b border-border flex items-center gap-4 px-4 lg:px-6">
      {/* Hamburger menu (mobile only) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary rounded hover:bg-gray-100"
        aria-label="Toggle navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      <form onSubmit={submitSearch} className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, users, categories..."
            className="w-full h-10 pl-9 pr-3 rounded bg-gray-50 border border-transparent text-sm focus-ring focus:bg-white focus:border-primary transition-colors"
          />
        </div>
      </form>

      <div className="flex items-center gap-3">
        <NotificationBell route={notificationsRoute} />
        <Dropdown
          align="right"
          trigger={
            <button className="flex items-center gap-2 focus-ring rounded p-1">
              <Avatar name={user?.full_name || user?.email} src={user?.avatar} size="sm" />
              <ChevronDown className="w-4 h-4 text-text-secondary" />
            </button>
          }
          items={[
            { label: 'Profile', icon: User, onClick: () => navigate(isAdmin ? ROUTES.ADMIN_PROFILE : ROUTES.EDITOR_SETTINGS) },
            { label: 'Settings', icon: Settings, onClick: () => navigate(isAdmin ? ROUTES.ADMIN_SETTINGS : ROUTES.EDITOR_SETTINGS) },
            { divider: true },
            { label: 'Sign out', icon: LogOut, danger: true, onClick: logout },
          ]}
        />
      </div>
    </header>
  );
}