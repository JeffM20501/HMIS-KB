import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { LogOut, X } from 'lucide-react';
import Logo from '../common/Logo.jsx';
import Avatar from '../ui/Avatar.jsx';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar({ items, badges = {}, isOpen, onClose }) {
  const { user, logout } = useAuth();

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) { // lg breakpoint
      onClose?.();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed lg:sticky top-0 z-50 h-screen bg-white border-r border-border flex flex-col transition-transform duration-300 ease-in-out',
          'w-64 shrink-0', // slightly wider for better readability
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Close button (mobile only) */}
        <div className="lg:hidden absolute right-3 top-3">
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="h-16 flex items-center px-5 border-b border-border">
          <Logo to="/" />
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {items.map((item) => {
            const badge = item.badgeKey ? badges[item.badgeKey] : null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-colors focus-ring',
                    isActive ? 'bg-primary-50 text-primary' : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                  )
                }
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                <span className="flex-1">{item.label}</span>
                {!!badge && (
                  <span className="text-xs font-semibold bg-primary-50 text-primary rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border flex items-center gap-2.5">
          <Avatar name={user?.full_name || user?.email} src={user?.avatar} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary truncate">{user?.full_name || user?.email}</p>
            <p className="text-xs text-text-secondary capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-text-secondary hover:text-danger hover:bg-danger-bg rounded focus-ring"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
}